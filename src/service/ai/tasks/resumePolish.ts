import { AiConfig, AiTaskType } from "../types";
import { createAiClient } from "../client";
import { assertAiConfigReady } from "../config";

type ResumeAiPromptTask = Exclude<AiTaskType, "job_diagnosis">;

const taskPrompts: Record<ResumeAiPromptTask, string> = {
  polish:
    "你是一名专业中文简历顾问。请在不编造经历的前提下，润色这份 Markdown 简历，让表达更清晰、更有结果导向。保留 Markdown 结构，直接输出优化后的 Markdown。",
  job_match:
    "你是一名资深技术招聘顾问。请根据用户简历、岗位 JD 和本地关键词覆盖结果，输出岗位匹配分析 JSON。不要输出 ATS 分、JD 分、总分或虚假数字；不编造经历，不虚构项目。建议必须可执行，generatedBullets.sourceKeyword 必须对应缺失关键词或相关 JD 关键词。generatedBullets.targetEntryHint 可选，尽量填写适合插入的公司名、项目名或经历关键词，匹配不到时前端会降级处理。",
};

export function getResumeAiTaskPrompt(taskType: ResumeAiPromptTask) {
  return taskPrompts[taskType];
}

export async function runResumeAiTask(
  taskType: ResumeAiPromptTask,
  markdown: string,
  jobDescription: string,
  config: AiConfig
) {
  assertAiConfigReady(config);
  const client = createAiClient(config);

  return client.createChatCompletion({
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: getResumeAiTaskPrompt(taskType),
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
  });
}
