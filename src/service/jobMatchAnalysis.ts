import { ResumeAnalysisReport, ResumeAnalysisResult } from "@src/types/ai";

export interface KeywordCoverageResult {
  keywordCoverage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

const STOP_WORDS = new Set([
  "岗位",
  "职责",
  "要求",
  "任职",
  "技能",
  "经验",
  "熟悉",
  "掌握",
  "负责",
  "优先",
  "相关",
  "能力",
  "项目",
  "开发",
  "工作",
  "团队",
  "具备",
  "使用",
  "了解",
]);

function uniqueByLowercase(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const normalized = value.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(normalized);
  });
  return result;
}

export function extractJobKeywords(jd: string): string[] {
  const technicalTokens = jd.match(/[A-Za-z][A-Za-z0-9+#./-]*/g) || [];
  const chineseTokens = jd.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  const filteredChinese = chineseTokens.filter((token) => !STOP_WORDS.has(token));
  return uniqueByLowercase([...technicalTokens, ...filteredChinese]);
}

export function calculateKeywordCoverage(
  jdKeywords: string[],
  resumeMarkdown: string
): KeywordCoverageResult {
  const resumeLower = resumeMarkdown.toLowerCase();
  const keywords = uniqueByLowercase(jdKeywords);
  const matchedKeywords = keywords.filter((keyword) =>
    resumeLower.includes(keyword.toLowerCase())
  );
  const missingKeywords = keywords.filter((keyword) =>
    !resumeLower.includes(keyword.toLowerCase())
  );
  const keywordCoverage = keywords.length
    ? Math.round((matchedKeywords.length / keywords.length) * 100)
    : 0;

  return {
    keywordCoverage,
    matchedKeywords,
    missingKeywords,
  };
}

function clampScore(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function extractJson(rawText: string) {
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return rawText.trim();
}

export function parseJobMatchAnalysis(
  rawText: string,
  localCoverage: KeywordCoverageResult
): ResumeAnalysisResult {
  try {
    const parsed = JSON.parse(extractJson(rawText));
    const radar = parsed?.radarScores || {};
    const report: ResumeAnalysisReport = {
      keywordCoverage: localCoverage.keywordCoverage,
      matchedKeywords: localCoverage.matchedKeywords,
      missingKeywords: localCoverage.missingKeywords,
      advantages: asStringArray(parsed?.advantages),
      improvementAreas: asStringArray(parsed?.improvementAreas),
      suggestions: Array.isArray(parsed?.suggestions)
        ? parsed.suggestions.map((item: any) => ({
            title: String(item?.title || "").trim(),
            detail: String(item?.detail || "").trim(),
          })).filter((item: { title: string; detail: string }) => item.title || item.detail)
        : [],
      generatedBullets: Array.isArray(parsed?.generatedBullets)
        ? parsed.generatedBullets.map((item: any) => ({
            targetSection: String(item?.targetSection || "projects").trim() || "projects",
            targetEntryHint: item?.targetEntryHint
              ? String(item.targetEntryHint).trim() || undefined
              : undefined,
            sourceKeyword: String(item?.sourceKeyword || "").trim(),
            content: String(item?.content || "").trim(),
            insertable: Boolean(item?.insertable),
          })).filter((item: { sourceKeyword: string; content: string }) => item.sourceKeyword && item.content)
        : [],
      radarScores: {
        technical: clampScore(radar.technical),
        project: clampScore(radar.project),
        impact: clampScore(radar.impact),
        keywordCoverage: localCoverage.keywordCoverage,
        engineering: clampScore(radar.engineering),
      },
    };
    return { kind: "report", report };
  } catch {
    return {
      kind: "fallback",
      rawText: rawText.trim(),
    };
  }
}
