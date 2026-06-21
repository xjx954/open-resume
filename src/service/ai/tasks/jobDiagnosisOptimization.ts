import {
  JobDiagnosisOptimizationParams,
  JobDiagnosisOptimizationResult,
} from "../types";
import { createAiClient } from "../client";
import { assertAiConfigReady } from "../config";

const jobDiagnosisOptimizationPrompt = [
  "你是一名专业简历顾问。",
  "请根据求职诊断中的具体问题，生成一组可以帮助用户修改简历的优化示例。",
  "不要自动改写整份简历，不要输出完整简历。",
  "不要编造不存在的公司、项目、时间、学历、证书或真实数据。",
  "如果需要量化成果，只能使用示例性表达，并提醒用户替换为真实数据。",
  "输出必须是 JSON，不要输出 Markdown 代码块。",
].join("\n");

export function buildJobDiagnosisOptimizationUserPrompt({
  resumeMarkdown,
  jobDescription,
  issue,
  generationIndex = 1,
}: Omit<JobDiagnosisOptimizationParams, "config">) {
  return [
    "当前简历 Markdown：",
    resumeMarkdown || "（当前简历为空）",
    "",
    "岗位 JD（可为空）：",
    jobDescription?.trim() || "（未提供）",
    "",
    "诊断问题：",
    issue.title,
    "",
    "问题原因：",
    issue.reason || issue.detail,
    "",
    "推荐修改方式：",
    issue.recommendation,
    "",
    "示例写法：",
    issue.example,
    "",
    generationIndex > 1
      ? `这是第 ${generationIndex} 次生成，请给出不同措辞但保持事实一致。`
      : "",
    "",
    "请输出 JSON，字段为 originalContent、optimizedContent、explanation。",
    "originalContent：从简历中摘取最相关、最需要优化的一小段原内容；如果找不到，写“未在简历中定位到直接对应内容”。",
    "optimizedContent：给出针对该问题的优化版本或可复制示例。",
    "explanation：说明为什么这样改，以及用户需要替换哪些示例数据。",
    "不要自动覆盖简历，不要输出完整简历。",
  ].join("\n");
}

function extractJson(rawText: string) {
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return rawText.trim();
}

function parseOptimizationResult(rawText: string): JobDiagnosisOptimizationResult {
  try {
    const parsed = JSON.parse(extractJson(rawText));
    return {
      originalContent: String(parsed?.originalContent || "").trim() || "未在简历中定位到直接对应内容",
      optimizedContent: String(parsed?.optimizedContent || "").trim(),
      explanation: String(parsed?.explanation || "").trim(),
    };
  } catch {
    return {
      originalContent: "未在简历中定位到直接对应内容",
      optimizedContent: rawText.trim(),
      explanation: "AI 返回了非 JSON 内容，请人工判断是否采用。",
    };
  }
}

export async function runJobDiagnosisOptimization({
  resumeMarkdown,
  jobDescription,
  issue,
  generationIndex = 1,
  config,
}: JobDiagnosisOptimizationParams): Promise<JobDiagnosisOptimizationResult> {
  assertAiConfigReady(config);
  const client = createAiClient(config);
  const content = await client.createChatCompletion({
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: jobDiagnosisOptimizationPrompt,
      },
      {
        role: "user",
        content: buildJobDiagnosisOptimizationUserPrompt({
          resumeMarkdown,
          jobDescription,
          issue,
          generationIndex,
        }),
      },
    ],
  });

  const result = parseOptimizationResult(content);
  if (!result.optimizedContent) {
    throw new Error("AI 未返回有效优化内容。");
  }
  return result;
}
