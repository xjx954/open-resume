import React, { useCallback, useEffect, useRef, useState } from "react";
import { message } from "antd";
import { observer } from "mobx-react";
import { useStores } from "@src/store";
import { runInlineRewrite } from "@src/service/ai";
import { isAiConfigError, isAiConfigReady, loadAiConfig } from "@src/service/aiConfig";
import {
  applyInputSelectionInsertion,
  applyInputSelectionReplacement,
  getInlineRewriteContext,
} from "@src/utils/inlineRewrite";

interface InlineTarget {
  element: HTMLInputElement | HTMLTextAreaElement;
  text: string;
  start: number;
  end: number;
  top: number;
  left: number;
  fieldContext: string;
}

const PANEL_WIDTH = 480;
const PANEL_MARGIN = 16;
const INSTRUCTION_PLACEHOLDER = "可以在这里输入您的想法，例如：突出技术深度、量化成果、压缩为一句话";
const QUICK_INSTRUCTIONS = ["更专业", "更简洁", "突出成果", "量化表达", "更符合岗位"];

function isEditableElement(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return false;
  }
  return !target.readOnly && !target.disabled;
}

function readSelection(element: HTMLInputElement | HTMLTextAreaElement): InlineTarget | null {
  const start = element.selectionStart ?? 0;
  const end = element.selectionEnd ?? start;
  const text = element.value.slice(start, end).trim();
  if (!text || start === end) return null;

  const rect = element.getBoundingClientRect();
  return {
    element,
    text,
    start,
    end,
    top: rect.top - 42,
    left: rect.left + 8,
    fieldContext: getInlineRewriteContext(element),
  };
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: string }).message || "");
  }
  return "AI 润色失败，请稍后重试。";
}

const InlineAiRewrite: React.FC = observer(() => {
  const { templateStore } = useStores();
  const [target, setTarget] = useState<InlineTarget | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [userInstruction, setUserInstruction] = useState("");
  const [generationCount, setGenerationCount] = useState(0);
  const [configMissing, setConfigMissing] = useState(false);
  const targetRef = useRef<InlineTarget | null>(null);
  const updateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  const resetPanelState = useCallback(() => {
    setPanelOpen(false);
    setLoading(false);
    setResult("");
    setError("");
    setUserInstruction("");
    setGenerationCount(0);
    setConfigMissing(false);
  }, []);

  useEffect(() => {
    const updateTarget = () => {
      if (updateTimerRef.current != null) {
        window.clearTimeout(updateTimerRef.current);
      }
      updateTimerRef.current = window.setTimeout(() => {
        updateTimerRef.current = null;
        const active = document.activeElement;
        if (active instanceof HTMLElement && active.closest(".inline-ai-rewrite-popover")) {
          return;
        }
        if (!isEditableElement(active) || !active.closest(".rs-block-editor")) {
          if (!panelOpen) {
            setTarget(null);
          }
          return;
        }

        const nextTarget = readSelection(active);
        const previousTarget = targetRef.current;
        const changed =
          nextTarget?.element !== previousTarget?.element ||
          nextTarget?.start !== previousTarget?.start ||
          nextTarget?.end !== previousTarget?.end ||
          nextTarget?.text !== previousTarget?.text;

        setTarget(nextTarget);
        if (changed) {
          resetPanelState();
        }
      }, 0);
    };

    document.addEventListener("selectionchange", updateTarget);
    document.addEventListener("mouseup", updateTarget);
    document.addEventListener("keyup", updateTarget);
    document.addEventListener("focusin", updateTarget);
    return () => {
      document.removeEventListener("selectionchange", updateTarget);
      document.removeEventListener("mouseup", updateTarget);
      document.removeEventListener("keyup", updateTarget);
      document.removeEventListener("focusin", updateTarget);
      if (updateTimerRef.current != null) {
        window.clearTimeout(updateTimerRef.current);
      }
    };
  }, [panelOpen, resetPanelState]);

  const openSettings = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-resume:ai-settings"));
  }, []);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    setConfigMissing(!isAiConfigReady(loadAiConfig()));
  }, []);

  const closePanel = useCallback(() => {
    resetPanelState();
    setTarget(null);
  }, [resetPanelState]);

  const generateRewrite = useCallback(async () => {
    const currentTarget = targetRef.current;
    if (!currentTarget) return;

    const config = loadAiConfig();
    if (!isAiConfigReady(config)) {
      setConfigMissing(true);
      setError("");
      return;
    }

    const nextGeneration = generationCount + 1;
    setConfigMissing(false);
    setLoading(true);
    setError("");
    setGenerationCount(nextGeneration);
    try {
      const nextResult = await runInlineRewrite({
        selectedText: currentTarget.text,
        resumeContext: templateStore.mdContent,
        userInstruction,
        fieldContext: currentTarget.fieldContext,
        generationIndex: nextGeneration,
        config,
      });
      setResult(nextResult);
      if (!nextResult.trim()) {
        setError("本次未生成有效结果，请重试");
      }
    } catch (e: unknown) {
      if (isAiConfigError(e)) {
        setConfigMissing(true);
        setError("");
      } else {
        setError(getErrorMessage(e) || "AI 润色失败，请稍后重试。");
      }
    } finally {
      setLoading(false);
    }
  }, [generationCount, templateStore.mdContent, userInstruction]);

  const handleReplace = useCallback(() => {
    const currentTarget = targetRef.current;
    if (!currentTarget || !result.trim()) return;
    currentTarget.element.focus();
    currentTarget.element.setSelectionRange(currentTarget.start, currentTarget.end);
    applyInputSelectionReplacement(currentTarget.element, result);
    closePanel();
    message.success("已替换原文");
  }, [closePanel, result]);

  const handleInsert = useCallback(() => {
    const currentTarget = targetRef.current;
    if (!currentTarget || !result.trim()) return;
    currentTarget.element.focus();
    applyInputSelectionInsertion(currentTarget.element, result, currentTarget.start, currentTarget.end);
    closePanel();
    message.success("已插入到下方");
  }, [closePanel, result]);

  if (!target) return null;

  const maxLeft = Math.max(PANEL_MARGIN, window.innerWidth - PANEL_WIDTH - PANEL_MARGIN);
  const top = Math.max(72, target.top);
  const left = Math.min(Math.max(PANEL_MARGIN, target.left), maxLeft);
  const canApply = !!result.trim() && !loading;

  return (
    <div className="inline-ai-rewrite-popover" style={{ top, left }}>
      {!panelOpen ? (
        <button
          type="button"
          className="inline-ai-rewrite"
          onMouseDown={(event) => event.preventDefault()}
          onClick={openPanel}
        >
          <span aria-hidden="true">✨</span>
          AI 润色
        </button>
      ) : (
        <div className="inline-ai-panel">
          <div className="inline-ai-panel__header">
            <div>
              <div className="inline-ai-panel__title">局部润色</div>
              <div className="inline-ai-panel__description">
                已参考整份简历上下文，仅优化当前选中内容。
              </div>
            </div>
            <button type="button" className="inline-ai-panel__close" onClick={closePanel}>
              取消
            </button>
          </div>

          <div className="inline-ai-panel__context">正在润色：{target.fieldContext}</div>

          <section className="inline-ai-panel__section">
            <div className="inline-ai-panel__label">原文</div>
            <div className="inline-ai-panel__readonly">{target.text}</div>
          </section>

          <section className="inline-ai-panel__section">
            <div className="inline-ai-panel__label">优化要求</div>
            <textarea
              className="inline-ai-panel__textarea"
              value={userInstruction}
              placeholder={INSTRUCTION_PLACEHOLDER}
              onChange={(event) => setUserInstruction(event.target.value)}
            />
            <div className="inline-ai-panel__quick-actions">
              {QUICK_INSTRUCTIONS.map((item) => (
                <button type="button" key={item} onClick={() => setUserInstruction(item)}>
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="inline-ai-panel__section">
            <div className="inline-ai-panel__label">AI 结果</div>
            <div className={`inline-ai-panel__result${loading ? " inline-ai-panel__result--loading" : ""}`}>
              {loading ? "生成中..." : result || "生成结果将显示在这里"}
            </div>
            {configMissing && (
              <div className="inline-ai-panel__notice">
                <span>请先在设置中配置 AI 服务</span>
                <button type="button" onClick={openSettings}>去设置</button>
              </div>
            )}
            {error && <div className="inline-ai-panel__error">{error}</div>}
          </section>

          <div className="inline-ai-panel__actions">
            <button
              type="button"
              className="inline-ai-panel__primary"
              onClick={generateRewrite}
              disabled={loading}
            >
              {loading ? "生成中..." : generationCount > 0 || error ? "重新生成" : "生成"}
            </button>
            <button type="button" onClick={handleReplace} disabled={!canApply}>
              替换原文
            </button>
            <button type="button" onClick={handleInsert} disabled={!canApply}>
              插入下方
            </button>
            <button type="button" onClick={closePanel}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default InlineAiRewrite;
