import { AiConfig, AiTaskType } from "@src/types/ai";
import { assertAiConfigReady } from "./aiConfig";
import {
  calculateKeywordCoverage,
  extractJobKeywords,
  parseJobMatchAnalysis,
} from "./jobMatchAnalysis";

const taskPrompts: Record<AiTaskType, string> = {
  polish:
    "你是一名专业中文简历顾问。请在不编造经历的前提下，润色这份 Markdown 简历，让表达更清晰、更有结果导向。保留 Markdown 结构，直接输出优化后的 Markdown。",
  job_match:
    "你是一名资深技术招聘顾问。请根据用户简历、岗位 JD 和本地关键词覆盖结果，输出岗位匹配分析 JSON。不要输出 ATS 分、JD 分、总分或虚假数字；不编造经历，不虚构项目。建议必须可执行，generatedBullets.sourceKeyword 必须对应缺失关键词或相关 JD 关键词。generatedBullets.targetEntryHint 可选，尽量填写适合插入的公司名、项目名或经历关键词，匹配不到时前端会降级处理。",
};

const inlineRewritePrompt = [
  "你是一名专业简历顾问。",
  "请只优化用户选中的原文，只能输出优化后的 selectedText。",
  "不要输出解释、标题、引号或 Markdown 代码块。",
  "不要修改整份简历其他部分。",
  "不要编造不存在的经历、数据、技能、公司或时间。",
  "保持与完整简历的表达风格一致，避免和简历其他条目重复。",
].join("\n");

interface InlineRewriteParams {
  selectedText: string;
  resumeContext: string;
  userInstruction?: string;
  fieldContext?: string;
  generationIndex?: number;
  config: AiConfig;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

function joinUrl(baseURL: string) {
  return `${baseURL.replace(/\/+$/, "")}/chat/completions`;
}

export async function runResumeAiTask(
  taskType: AiTaskType,
  markdown: string,
  jobDescription: string,
  config: AiConfig
) {
  const apiKey = config.apiKey.trim();
  const baseURL = config.baseURL.trim();
  const model = config.model.trim();

  assertAiConfigReady(config);

  const response = await fetch(joinUrl(baseURL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: taskPrompts[taskType],
        },
        {
          role: "user",
          content: [
            "当前简历 Markdown:",
            markdown || "（当前简历为空）",
            "",
            "岗位 JD（可为空）:",
            jobDescription || "（未提供）",
          ].join("\n"),
        },
      ],
    }),
  });

  const data: ChatCompletionResponse = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `AI 请求失败：HTTP ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI 未返回有效内容。");
  }
  return content;
}

export async function runInlineRewrite({
  selectedText,
  resumeContext,
  userInstruction,
  fieldContext,
  generationIndex = 1,
  config,
}: InlineRewriteParams) {
  const apiKey = config.apiKey.trim();
  const baseURL = config.baseURL.trim();
  const model = config.model.trim();
  const instruction = userInstruction?.trim() || "专业、简洁、适合简历表达";
  const currentGeneration = Math.max(1, generationIndex);

  if (!selectedText.trim()) {
    throw new Error("请先选中需要润色的文字。");
  }
  assertAiConfigReady(config);

  const response = await fetch(joinUrl(baseURL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: inlineRewritePrompt,
        },
        {
          role: "user",
          content: [
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
          ].join("\n"),
        },
      ],
    }),
  });

  const data: ChatCompletionResponse = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `AI 请求失败：HTTP ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI 未返回有效内容。");
  }
  return content;
}

export async function runJobMatchAnalysis(
  markdown: string,
  jobDescription: string,
  config: AiConfig
) {
  if (!jobDescription.trim()) {
    throw new Error("请先粘贴岗位描述。");
  }

  const apiKey = config.apiKey.trim();
  const baseURL = config.baseURL.trim();
  const model = config.model.trim();
  assertAiConfigReady(config);

  const jdKeywords = extractJobKeywords(jobDescription);
  const localCoverage = calculateKeywordCoverage(jdKeywords, markdown);

  const response = await fetch(joinUrl(baseURL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: taskPrompts.job_match,
        },
        {
          role: "user",
          content: [
            "当前简历 Markdown:",
            markdown || "（当前简历为空）",
            "",
            "岗位 JD:",
            jobDescription,
            "",
            "本地关键词覆盖结果:",
            JSON.stringify(localCoverage, null, 2),
            "",
            "请只输出 JSON，字段为 advantages、improvementAreas、suggestions、generatedBullets、radarScores。generatedBullets 每项字段为 targetSection、targetEntryHint、sourceKeyword、content、insertable。",
          ].join("\n"),
        },
      ],
    }),
  });

  const data: ChatCompletionResponse = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `AI 请求失败：HTTP ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI 未返回有效内容。");
  }

  return parseJobMatchAnalysis(content, localCoverage);
}
