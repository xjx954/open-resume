import { AtsAnalysisReport, AtsIssue, AtsIssueSeverity, Suggestion } from "@src/types/ai";
import {
  calculateKeywordCoverage,
  extractJobKeywords,
} from "./jobMatchAnalysis";

const ACTION_VERBS = [
  "主导",
  "负责",
  "推动",
  "优化",
  "设计",
  "搭建",
  "落地",
  "交付",
  "提升",
  "降低",
  "重构",
  "实现",
  "建设",
  "lead",
  "led",
  "built",
  "designed",
  "optimized",
  "improved",
  "reduced",
  "delivered",
  "launched",
];

const SECTION_ALIASES = {
  work: ["工作经历", "工作经验", "实习经历", "Work Experience", "Experience"],
  project: ["项目经历", "项目经验", "Projects", "Project Experience"],
  skills: ["技能", "专业技能", "技术栈", "Skills", "Technical Skills"],
};

const RISK_PATTERNS = [
  { id: "ats_risky_table", title: "存在表格结构", pattern: /\|.+\|/ },
  { id: "ats_risky_image", title: "存在图片或头像", pattern: /!\[|<img\b/i },
  { id: "ats_risky_markup", title: "存在 HTML 标签", pattern: /<[^>]+>/ },
  { id: "ats_risky_custom_container", title: "存在自定义 Markdown 容器", pattern: /^:::/m },
  { id: "ats_risky_icon", title: "存在图标语法", pattern: /\[icon:/i },
];

const MARKDOWN_PUNCTUATION_PATTERN = new RegExp("[`*_>#\\[\\]():/|-]", "g");

function normalizeText(markdown: string) {
  return markdown.replace(MARKDOWN_PUNCTUATION_PATTERN, " ").replace(/\s+/g, " ").trim();
}

function getSectionText(markdown: string, aliases: string[]) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => {
    const normalized = line.replace(/^#+\s*/, "").trim();
    return aliases.some((alias) => normalized.toLowerCase().includes(alias.toLowerCase()));
  });
  if (start < 0) return "";

  const currentLevel = (lines[start].match(/^#+/)?.[0].length || 2);
  const rest = lines.slice(start + 1);
  // Keep this parser conservative: stop at the next H2-like section.
  const nextSection = rest.findIndex((line) => /^#{1,2}\s+/.test(line) && (line.match(/^#+/)?.[0].length || 0) <= currentLevel);
  return rest.slice(0, nextSection >= 0 ? nextSection : undefined).join("\n");
}

function countEntries(sectionText: string) {
  const headings = sectionText.match(/^###\s+/gm)?.length || 0;
  const bullets = sectionText.match(/^\s*[-*]\s+/gm)?.length || 0;
  return Math.max(headings, Math.floor(bullets / 2));
}

function countContactMethods(text: string) {
  const checks = [
    /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text),
    /(?:\+?86[-\s]?)?1[3-9]\d{9}/.test(text) || /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text),
    /(github|linkedin|gitee|个人网站|portfolio|https?:\/\/)/i.test(text),
  ];
  return checks.filter(Boolean).length;
}

function getSkillKeywordCount(skillsText: string) {
  const tokens = skillsText.match(/[A-Za-z][A-Za-z0-9+#./-]*|[\u4e00-\u9fa5]{2,}/g) || [];
  return new Set(tokens.map((token) => token.toLowerCase())).size;
}

function getRepeatedTerms(text: string) {
  const words = text.match(/[A-Za-z][A-Za-z0-9+#./-]*|[\u4e00-\u9fa5]{2,}/g) || [];
  const counts = new Map<string, { term: string; count: number }>();
  words.forEach((word) => {
    if (word.length < 2) return;
    const key = word.toLowerCase();
    const current = counts.get(key) || { term: word, count: 0 };
    current.count += 1;
    counts.set(key, current);
  });
  return Array.from(counts.values())
    .filter((item) => item.count >= 5)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function getBulletLines(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line));
}

function getQuantifiedBulletCoverage(markdown: string) {
  const bullets = getBulletLines(markdown);
  if (!bullets.length) return 0;
  const quantified = bullets.filter((line) =>
    /(\d+[%+]?|[一二三四五六七八九十百千万]+|提升|降低|增长|减少|覆盖|支撑|节省|缩短)/.test(line)
  ).length;
  return Math.round((quantified / bullets.length) * 100);
}

function getActionVerbCount(text: string) {
  return ACTION_VERBS.reduce((count, verb) => {
    const matches = text.match(new RegExp(verb, "gi"));
    return count + (matches?.length || 0);
  }, 0);
}

function addIssue(
  issues: AtsIssue[],
  condition: boolean,
  issue: AtsIssue
) {
  if (condition) issues.push(issue);
}

function suggestion(title: string, detail: string): Suggestion {
  return { title, detail };
}

function severityPenalty(severity: AtsIssueSeverity) {
  if (severity === "high") return 12;
  if (severity === "medium") return 7;
  return 4;
}

export function analyzeResumeAts(markdown: string, jobDescription = ""): AtsAnalysisReport {
  const plainText = normalizeText(markdown);
  const workText = getSectionText(markdown, SECTION_ALIASES.work);
  const projectText = getSectionText(markdown, SECTION_ALIASES.project);
  const skillsText = getSectionText(markdown, SECTION_ALIASES.skills);
  const contactMethods = countContactMethods(markdown);
  const workEntryCount = countEntries(workText);
  const projectEntryCount = countEntries(projectText);
  const skillKeywordCount = getSkillKeywordCount(skillsText);
  const resumeLength = plainText.replace(/\s/g, "").length;
  const repeatedTerms = getRepeatedTerms(plainText);
  const actionVerbCount = getActionVerbCount(plainText);
  const quantifiedBulletCoverage = getQuantifiedBulletCoverage(markdown);
  const jdKeywords = extractJobKeywords(jobDescription);
  const keywordCoverage = calculateKeywordCoverage(jdKeywords, markdown);
  const atsRisks = RISK_PATTERNS.filter((risk) => risk.pattern.test(markdown));
  const issues: AtsIssue[] = [];

  addIssue(issues, contactMethods < 2, {
    id: "contact_missing",
    title: "联系方式不完整",
    detail: "建议至少包含邮箱、手机号、GitHub/LinkedIn/作品集中的两类联系方式。",
    severity: "high",
    section: "联系方式",
  });
  addIssue(issues, workEntryCount < 1, {
    id: "work_missing",
    title: "工作经历不完整",
    detail: "建议补充公司/职位/时间，并用要点描述职责、行动和结果。",
    severity: "high",
    section: "工作经历",
  });
  addIssue(issues, projectEntryCount < 1, {
    id: "project_missing",
    title: "项目经历不完整",
    detail: "建议至少保留一个项目，说明背景、负责内容、技术方案和结果。",
    severity: "high",
    section: "项目经历",
  });
  addIssue(issues, skillKeywordCount < 6, {
    id: "skill_keywords_low",
    title: "技能关键词偏少",
    detail: "建议补充与目标岗位相关的技术栈、工具链和工程能力关键词。",
    severity: "medium",
    section: "技能",
  });
  addIssue(issues, resumeLength < 320, {
    id: "resume_too_short",
    title: "简历内容偏短",
    detail: "当前内容可能不足以支撑 ATS 和招聘方判断，建议补充经历细节。",
    severity: "medium",
    section: "整体长度",
  });
  addIssue(issues, resumeLength > 3500, {
    id: "resume_too_long",
    title: "简历内容偏长",
    detail: "建议压缩重复描述，突出最近和最匹配岗位的经历。",
    severity: "low",
    section: "整体长度",
  });
  addIssue(issues, repeatedTerms.length > 0, {
    id: "repeated_terms",
    title: "存在高频重复词",
    detail: `高频词包括：${repeatedTerms.map((item) => `${item.term}(${item.count})`).join("、")}。建议减少机械重复。`,
    severity: "low",
    section: "表达",
  });
  addIssue(issues, actionVerbCount < 4, {
    id: "action_verbs_low",
    title: "行动动词不足",
    detail: "建议更多使用“主导、优化、推动、落地、提升”等动词突出贡献。",
    severity: "medium",
    section: "表达",
  });
  addIssue(issues, quantifiedBulletCoverage < 35, {
    id: "quantified_results_low",
    title: "量化成果覆盖率偏低",
    detail: "建议在项目和工作经历中加入比例、规模、耗时、用户量、效率提升等数字。",
    severity: "medium",
    section: "成果",
  });
  addIssue(issues, jdKeywords.length > 0 && keywordCoverage.keywordCoverage < 50, {
    id: "jd_keyword_coverage_low",
    title: "JD 关键词覆盖不足",
    detail: "建议优先补充缺失的岗位关键词，并放在真实经历语境中。",
    severity: "medium",
    section: "岗位匹配",
  });
  atsRisks.forEach((risk) => {
    issues.push({
      id: risk.id,
      title: risk.title,
      detail: "ATS 对复杂排版、图片、表格、HTML 或自定义容器的解析可能不稳定，建议保留纯文本主路径。",
      severity: "medium",
      section: "ATS 风险",
    });
  });

  const suggestions: Suggestion[] = [
    suggestion("优先补齐硬性信息", "先完善联系方式、工作经历、项目经历和技能区，这些是 ATS 与招聘方最常扫描的区域。"),
    suggestion("把职责改成结果", "每条经历尽量包含动作、对象和结果，例如“优化构建流程，发布时间降低 30%”。"),
    suggestion("围绕 JD 调整关键词", "不要堆砌关键词，把缺失关键词放进真实项目、技能或工作成果中。"),
  ];

  const score = Math.max(
    0,
    Math.min(
      100,
      100 - issues.reduce((total, issue) => total + severityPenalty(issue.severity), 0)
    )
  );

  return {
    overallScore: score,
    issues,
    suggestions,
    missingKeywords: keywordCoverage.missingKeywords,
    matchedKeywords: keywordCoverage.matchedKeywords,
    metrics: {
      contactMethods,
      workEntryCount,
      projectEntryCount,
      skillKeywordCount,
      resumeLength,
      repeatedTerms,
      actionVerbCount,
      quantifiedBulletCoverage,
      keywordCoverage: keywordCoverage.keywordCoverage,
      jobKeywordCount: jdKeywords.length,
      atsRiskCount: atsRisks.length,
    },
  };
}
