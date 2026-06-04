import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, message } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import { runInlineRewrite } from "@src/service/ai";
import { isAiConfigError, loadAiConfig } from "@src/service/aiConfig";
import {
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
    top: rect.top - 38,
    left: rect.left,
  };
}

const InlineAiRewrite: React.FC = () => {
  const [target, setTarget] = useState<InlineTarget | null>(null);
  const [loading, setLoading] = useState(false);
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
          setTarget(null);
          return;
        }
        setTarget(readSelection(active));
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
  }, []);

  const openSettings = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-resume:ai-settings"));
  }, []);

  const handleRewrite = useCallback(async () => {
    const currentTarget = targetRef.current;
    if (!currentTarget) return;
    setLoading(true);
    try {
      const result = await runInlineRewrite(
        currentTarget.text,
        getInlineRewriteContext(currentTarget.element),
        loadAiConfig()
      );
      currentTarget.element.setSelectionRange(currentTarget.start, currentTarget.end);
      applyInputSelectionReplacement(currentTarget.element, result);
      setTarget(null);
      message.success("已替换选中文本");
    } catch (e: any) {
      const errorMessage = e?.message || "AI 润色失败，请稍后重试。";
      if (isAiConfigError(e)) {
        Modal.confirm({
          title: "请先配置 AI 服务",
          content: "按向导选择服务商并粘贴 API Key，测试连接成功后即可使用 AI 润色。",
          okText: "打开设置",
          cancelText: "稍后再说",
          onOk: openSettings,
        });
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [openSettings]);

  if (!target) return null;

  return (
    <button
      type="button"
      className="inline-ai-rewrite"
      style={{ top: Math.max(72, target.top), left: target.left }}
      onMouseDown={(event) => event.preventDefault()}
      onClick={handleRewrite}
      disabled={loading}
    >
      <RobotOutlined />
      {loading ? "润色中..." : "AI 润色"}
    </button>
  );
};

export default InlineAiRewrite;
