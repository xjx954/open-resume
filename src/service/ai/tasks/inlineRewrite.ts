import { createAiClient } from "../client";
import { assertAiConfigReady } from "../config";
import { InlineRewriteParams } from "../types";

const inlineRewritePrompt = [
  "你是一名专业简历顾问。",
  "请只优化用户选中的原文，只能输出优化后的 selectedText。",
  "不要输出解释、标题、引号或 Markdown 代码块。",
  "不要修改整份简历其他部分。",
  "不要编造不存在的经历、数据、技能、公司或时间。",
  "保持与完整简历的表达风格一致，避免和简历其他条目重复。",
].join("\n");

export function buildInlineRewriteUserPrompt({
  selectedText,
  resumeContext,
  userInstruction,
  fieldContext,
  generationIndex = 1,
}: Omit<InlineRewriteParams, "config">) {
  const instruction = userInstruction?.trim() || "专业、简洁、适合简历表达";
  const currentGeneration = Math.max(1, generationIndex);

  return [
    "下面是用户完整简历上下文：",
    resumeContext || "（当前简历为空）",
    "",
    "当前正在优化的字段/模块：",
    fieldContext || "简历块编辑器字段",
    "",
    "用户选中的原文：",
    selectedText,
    "",
    "用户的优化要求：",
    instruction,
    "",
    currentGeneration > 1
      ? `这是第 ${currentGeneration} 次生成，请给出不同措辞但保持事实一致。`
      : "",
    "",
    "请只优化“用户选中的原文”。",
    "不要修改整份简历其他部分。",
    "不要编造不存在的经历、数据、技能、公司或时间。",
    "保持与完整简历的表达风格一致。",
    "避免和简历其他条目重复。",
    "输出一段可以直接替换原文的内容。",
    "不要输出解释、标题、引号或代码块。",
    "只能输出优化后的 selectedText。",
  ].join("\n");
}

export async function runInlineRewrite({
  selectedText,
  resumeContext,
  userInstruction,
  fieldContext,
  generationIndex = 1,
  config,
}: InlineRewriteParams) {
  if (!selectedText.trim()) {
    throw new Error("请先选中需要润色的文字。");
  }
  assertAiConfigReady(config);
  const client = createAiClient(config);

  const content = await client.createChatCompletion({
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: inlineRewritePrompt,
      },
      {
        role: "user",
        content: buildInlineRewriteUserPrompt({
          selectedText,
          resumeContext,
          userInstruction,
          fieldContext,
          generationIndex,
        }),
      },
    ],
  });
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error("AI 未返回有效内容。");
  }
  return trimmedContent;
}
