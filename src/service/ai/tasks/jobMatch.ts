import { AiConfig } from "../types";
import { createAiClient } from "../client";
import { assertAiConfigReady } from "../config";
import {
  calculateKeywordCoverage,
  extractJobKeywords,
  parseJobMatchAnalysis,
} from "../../jobMatchAnalysis";
import { getResumeAiTaskPrompt } from "./resumePolish";

export async function runJobMatchAnalysis(
  markdown: string,
  jobDescription: string,
  config: AiConfig
) {
  if (!jobDescription.trim()) {
    throw new Error("请先粘贴岗位描述。");
  }

  assertAiConfigReady(config);
  const client = createAiClient(config);

  const jdKeywords = extractJobKeywords(jobDescription);
  const localCoverage = calculateKeywordCoverage(jdKeywords, markdown);

  const content = await client.createChatCompletion({
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: getResumeAiTaskPrompt("job_match"),
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
  });

  return parseJobMatchAnalysis(content, localCoverage);
}
