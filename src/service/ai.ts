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
    "你是一名资深技术招聘顾问。请根据用户简历、岗位 JD 和本地关键词覆盖结果，输出岗位匹配分析 JSON。不要输出 ATS 分、JD 分、总分或虚假数字；不编造经历，不虚构项目。建议必须可执行，generatedBullets.sourceKeyword 必须对应缺失关键词或相关 JD 关键词。",
};

const inlineRewritePrompt =
  "你是一名专业中文简历写作顾问。请只改写用户选中的简历片段，让表达更清晰、更具体、更结果导向。不要编造经历或数字。直接输出改写后的单段文本，不要解释。";

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

export async function runInlineRewrite(
  selectedText: string,
  context: string,
  config: AiConfig
) {
  const apiKey = config.apiKey.trim();
  const baseURL = config.baseURL.trim();
  const model = config.model.trim();

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
            "当前编辑位置：",
            context || "简历块编辑器",
            "",
            "需要润色的文字：",
            selectedText,
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
            "请只输出 JSON，字段为 advantages、improvementAreas、suggestions、generatedBullets、radarScores。",
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
