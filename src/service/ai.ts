import { AiConfig, AiTaskType } from "@src/types/ai";

const taskPrompts: Record<AiTaskType, string> = {
  polish:
    "你是一名专业中文简历顾问。请在不编造经历的前提下，润色这份 Markdown 简历，让表达更清晰、更有结果导向。保留 Markdown 结构，直接输出优化后的 Markdown。",
  match_jd:
    "你是一名招聘匹配顾问。请根据岗位 JD 优化这份 Markdown 简历，突出匹配项、补强关键词，并指出不应夸大的内容。直接输出可替换的 Markdown。",
  quantify:
    "你是一名简历成果量化顾问。请找出经历中可以量化的表述，改写为更具体的 STAR/结果导向表达。不要虚构数字；缺少数字时用【建议补充】标记。",
  ats_keywords:
    "你是一名 ATS 关键词优化顾问。请基于简历和岗位 JD 输出关键词建议、缺失能力点、可插入的简历 bullet。使用清晰的 Markdown 分组输出。",
};

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

  if (!apiKey || !baseURL || !model) {
    throw new Error("请先填写 API Key、Base URL 和模型名称。");
  }

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
