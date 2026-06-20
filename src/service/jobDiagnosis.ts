import {
  ExperienceMatchSummary,
  JobDiagnosisReport,
  JobKeywordCategory,
  JobKeywordItem,
  KeywordCategorySummary,
  PrioritizedKeyword,
  Suggestion,
} from "@src/types/ai";
import { analyzeResumeAts } from "./atsAnalyzer";
import { calculateKeywordCoverage, extractJobKeywords } from "./jobMatchAnalysis";

const CATEGORY_LABELS: Record<JobKeywordCategory, string> = {
  technical: "技术技能",
  business: "业务技能",
  soft: "软技能",
};

const TECHNICAL_PATTERNS = [
  /react|vue|angular|typescript|javascript|node\.?js|docker|kubernetes|webpack|vite|git|ci\/cd|java|python|go|sql|linux/i,
  /前端|后端|全栈|工程化|组件库|数据库|架构|性能|测试|部署|算法|数据结构/,
];

const SOFT_PATTERNS = [
  /沟通|协作|推动|主导|跨部门|项目管理|团队| owner|leadership|communication|collaboration|stakeholder/i,
];

const BUSINESS_PATTERNS = [
  /增长|转化|留存|获客|营收|成本|效率|用户|数据分析|看板|业务|招聘|投递|风控|支付|订单|crm|saas/i,
];

const SECTION_ALIASES = {
  work: ["工作经历", "工作经验", "实习经历", "Work Experience", "Experience"],
  project: ["项目经历", "项目经验", "Projects", "Project Experience"],
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getSectionText(markdown: string, aliases: string[]) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => {
    const normalized = line.replace(/^#+\s*/, "").trim();
    return aliases.some((alias) => normalized.toLowerCase().includes(alias.toLowerCase()));
  });
  if (start < 0) return "";

  const currentLevel = lines[start].match(/^#+/)?.[0].length || 2;
  const rest = lines.slice(start + 1);
  const nextSection = rest.findIndex((line) =>
    /^#{1,2}\s+/.test(line) && (line.match(/^#+/)?.[0].length || 0) <= currentLevel
  );
  return rest.slice(0, nextSection >= 0 ? nextSection : undefined).join("\n");
}

function classifyKeyword(keyword: string): JobKeywordCategory {
  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(keyword))) return "technical";
  if (SOFT_PATTERNS.some((pattern) => pattern.test(keyword))) return "soft";
  if (BUSINESS_PATTERNS.some((pattern) => pattern.test(keyword))) return "business";
  return /[A-Za-z0-9+#./-]/.test(keyword) ? "technical" : "business";
}

function buildKeywordItems(keywords: string[], resumeMarkdown: string): JobKeywordItem[] {
  const resumeLower = resumeMarkdown.toLowerCase();
  return keywords.map((keyword) => ({
    keyword,
    category: classifyKeyword(keyword),
    matched: resumeLower.includes(keyword.toLowerCase()),
  }));
}

function summarizeCategories(items: JobKeywordItem[]): KeywordCategorySummary[] {
  return (Object.keys(CATEGORY_LABELS) as JobKeywordCategory[]).map((category) => {
    const categoryItems = items.filter((item) => item.category === category);
    const matched = categoryItems.filter((item) => item.matched).length;
    const total = categoryItems.length;
    return {
      category,
      label: CATEGORY_LABELS[category],
      total,
      matched,
      missing: total - matched,
      coverage: total ? clampScore((matched / total) * 100) : 0,
    };
  });
}

function prioritizeMissingKeywords(items: JobKeywordItem[]): PrioritizedKeyword[] {
  return items
    .filter((item) => !item.matched)
    .map((item) => {
      const priority: PrioritizedKeyword["priority"] = item.category === "technical"
        ? "high"
        : item.category === "business"
          ? "medium"
          : "low";
      const reason = item.category === "technical"
        ? "技术关键词通常直接影响 ATS 和招聘方筛选。"
        : item.category === "business"
          ? "业务关键词能提升岗位语境匹配度。"
          : "软技能关键词适合补充到协作或推动类经历中。";
      return { keyword: item.keyword, category: item.category, priority, reason };
    })
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.priority] - rank[b.priority];
    })
    .slice(0, 10);
}

function buildExperienceMatch(sectionText: string, keywords: string[], emptyLabel: string): ExperienceMatchSummary {
  if (!keywords.length) {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      summary: "未提供 JD，暂不计算岗位关键词匹配。",
    };
  }

  const coverage = calculateKeywordCoverage(keywords, sectionText);
  const summary = sectionText.trim()
    ? `${emptyLabel}覆盖 ${coverage.matchedKeywords.length}/${keywords.length} 个 JD 关键词。`
    : `${emptyLabel}未检测到有效内容，建议补充与目标岗位相关的经历。`;

  return {
    score: coverage.keywordCoverage,
    matchedKeywords: coverage.matchedKeywords,
    missingKeywords: coverage.missingKeywords,
    summary,
  };
}

function buildSuggestions(
  atsSuggestions: Suggestion[],
  prioritizedKeywords: PrioritizedKeyword[],
  skillCoverage: number,
  projectMatch: ExperienceMatchSummary,
  workMatch: ExperienceMatchSummary,
  hasJobKeywords: boolean
): Suggestion[] {
  const suggestions: Suggestion[] = hasJobKeywords
    ? [...atsSuggestions]
    : atsSuggestions.filter((item) => !/JD|关键词/.test(`${item.title}${item.detail}`));
  if (prioritizedKeywords.length) {
    suggestions.unshift({
      title: "优先补充高价值缺失关键词",
      detail: `建议先处理：${prioritizedKeywords.slice(0, 5).map((item) => item.keyword).join("、")}。`,
    });
  }
  if (hasJobKeywords && skillCoverage > 0 && skillCoverage < 60) {
    suggestions.push({
      title: "补齐技能区覆盖",
      detail: "将真实掌握的 JD 技术技能补充到技能区，并在项目或工作经历中给出使用场景。",
    });
  }
  if (hasJobKeywords && projectMatch.score < 50) {
    suggestions.push({
      title: "强化项目经历匹配",
      detail: "把缺失的技术或业务关键词放进项目背景、方案和结果中，避免只堆在技能列表。",
    });
  }
  if (hasJobKeywords && workMatch.score < 50) {
    suggestions.push({
      title: "强化工作经历匹配",
      detail: "工作经历中优先体现岗位要求的职责范围、协作对象和可量化成果。",
    });
  }
  return suggestions;
}

export function analyzeJobDiagnosis(markdown: string, jobDescription: string): JobDiagnosisReport {
  const atsReport = analyzeResumeAts(markdown, jobDescription);
  const jdKeywords = extractJobKeywords(jobDescription);
  const keywordCoverage = calculateKeywordCoverage(jdKeywords, markdown);
  const keywordItems = buildKeywordItems(jdKeywords, markdown);
  const categorizedKeywords = summarizeCategories(keywordItems);
  const prioritizedKeywords = prioritizeMissingKeywords(keywordItems);
  const technicalItems = keywordItems.filter((item) => item.category === "technical");
  const matchedSkills = technicalItems.filter((item) => item.matched).map((item) => item.keyword);
  const missingSkills = technicalItems.filter((item) => !item.matched).map((item) => item.keyword);
  const skillCoverage = technicalItems.length
    ? clampScore((matchedSkills.length / technicalItems.length) * 100)
    : 0;
  const projectMatch = buildExperienceMatch(
    getSectionText(markdown, SECTION_ALIASES.project),
    jdKeywords,
    "项目经历"
  );
  const workMatch = buildExperienceMatch(
    getSectionText(markdown, SECTION_ALIASES.work),
    jdKeywords,
    "工作经历"
  );
  const overallMatchScore = jdKeywords.length
    ? clampScore(
        keywordCoverage.keywordCoverage * 0.4 +
        skillCoverage * 0.2 +
        projectMatch.score * 0.15 +
        workMatch.score * 0.15 +
        atsReport.overallScore * 0.1
      )
    : atsReport.overallScore;
  const hasJobKeywords = jdKeywords.length > 0;

  return {
    overallMatchScore,
    atsScore: atsReport.overallScore,
    keywordCoverage: keywordCoverage.keywordCoverage,
    skillCoverage,
    matchedKeywords: keywordCoverage.matchedKeywords,
    missingKeywords: keywordCoverage.missingKeywords,
    matchedSkills,
    missingSkills,
    categorizedKeywords,
    prioritizedKeywords,
    projectMatch,
    workMatch,
    atsIssues: atsReport.issues,
    suggestions: buildSuggestions(
      atsReport.suggestions,
      prioritizedKeywords,
      skillCoverage,
      projectMatch,
      workMatch,
      hasJobKeywords
    ),
  };
}
