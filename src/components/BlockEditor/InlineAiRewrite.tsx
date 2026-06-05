import React, { useCallback, useEffect, useRef, useState } from "react";
import { message } from "antd";
import { runInlineRewrite } from "@src/service/ai";
import { isAiConfigError, loadAiConfig } from "@src/service/aiConfig";
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
}

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
  };
}

const InlineAiRewrite: React.FC = () => {
  const [target, setTarget] = useState<InlineTarget | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const targetRef = useRef<InlineTarget | null>(null);
  const updateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const updateTarget = () => {
      if (updateTimerRef.current != null) {
        window.clearTimeout(updateTimerRef.current);
      }
      updateTimerRef.current = window.setTimeout(() => {
        updateTimerRef.current = null;
        const active = document.activeElement;
        if (!isEditableElement(active) || !active.closest(".rs-block-editor")) {
          if (!result) setTarget(null);
          return;
        }

        const nextTarget = readSelection(active);
        setTarget(nextTarget);
        if (nextTarget?.text !== targetRef.current?.text) {
          setResult("");
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
  }, [result]);

  const openSettings = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-resume:ai-settings"));
  }, []);

  const generateRewrite = useCallback(async () => {
    const currentTarget = targetRef.current;
    if (!currentTarget) return;
    setLoading(true);
    try {
      const nextResult = await runInlineRewrite(
        currentTarget.text,
        getInlineRewriteContext(currentTarget.element),
        loadAiConfig()
      );
      setResult(nextResult);
    } catch (e: any) {
      if (isAiConfigError(e)) {
        message.warning("请先配置 AI 服务");
        openSettings();
      } else {
        message.error(e?.message || "AI 润色失败，请稍后重试。");
      }
    } finally {
      setLoading(false);
    }
  }, [openSettings]);

  const closePanel = useCallback(() => {
    setResult("");
    setTarget(null);
  }, []);

  const handleReplace = useCallback(() => {
    const currentTarget = targetRef.current;
    if (!currentTarget || !result) return;
    currentTarget.element.focus();
    currentTarget.element.setSelectionRange(currentTarget.start, currentTarget.end);
    applyInputSelectionReplacement(currentTarget.element, result);
    closePanel();
    message.success("已替换原文");
  }, [closePanel, result]);

  const handleInsert = useCallback(() => {
    const currentTarget = targetRef.current;
    if (!currentTarget || !result) return;
    currentTarget.element.focus();
    applyInputSelectionInsertion(currentTarget.element, result, currentTarget.start, currentTarget.end);
    closePanel();
    message.success("已插入到下方");
  }, [closePanel, result]);

  if (!target) return null;

  const top = Math.max(72, target.top);
  const left = Math.min(Math.max(16, target.left), window.innerWidth - 280);

  return (
    <div
      className="inline-ai-rewrite-popover"
      style={{ top, left }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {!result ? (
        <button
          type="button"
          className="inline-ai-rewrite"
          onClick={generateRewrite}
          disabled={loading}
        >
          <span aria-hidden="true">✨</span>
          {loading ? "润色中..." : "AI润色"}
        </button>
      ) : (
        <div className="inline-ai-result-panel">
          <div className="inline-ai-result-panel__title">AI润色结果</div>
          <div className="inline-ai-result-panel__content">{result}</div>
          <div className="inline-ai-result-panel__actions">
            <button type="button" onClick={handleReplace}>替换原文</button>
            <button type="button" onClick={handleInsert}>插入下方</button>
            <button type="button" onClick={generateRewrite} disabled={loading}>
              {loading ? "生成中..." : "重新生成"}
            </button>
            <button type="button" onClick={closePanel}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineAiRewrite;
