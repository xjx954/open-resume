export type AiTaskType = "polish" | "job_match" | "ats_check";

export interface AiConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

export type ChatMessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
}

export interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export interface AiClient {
  createChatCompletion(request: ChatCompletionRequest): Promise<string>;
}

export interface AiTaskOption {
  type: AiTaskType;
  title: string;
  description: string;
}

export interface Suggestion {
  title: string;
  detail: string;
}

export interface GeneratedBullet {
  targetSection: string;
  targetEntryHint?: string;
  sourceKeyword: string;
  content: string;
  insertable?: boolean;
}

export interface ResumeAnalysisReport {
  keywordCoverage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  advantages: string[];
  improvementAreas: string[];
  suggestions: Suggestion[];
  generatedBullets: GeneratedBullet[];
  radarScores: {
    technical: number;
    project: number;
    impact: number;
    keywordCoverage: number;
    engineering: number;
  };
}

export type ResumeAnalysisResult =
  | { kind: "report"; report: ResumeAnalysisReport }
  | { kind: "fallback"; rawText: string };

export type AtsIssueSeverity = "high" | "medium" | "low";

export interface AtsIssue {
  id: string;
  title: string;
  detail: string;
  severity: AtsIssueSeverity;
  section: string;
}

export interface AtsRepeatedTerm {
  term: string;
  count: number;
}

export interface AtsAnalyzerMetrics {
  contactMethods: number;
  workEntryCount: number;
  projectEntryCount: number;
  skillKeywordCount: number;
  resumeLength: number;
  repeatedTerms: AtsRepeatedTerm[];
  actionVerbCount: number;
  quantifiedBulletCoverage: number;
  keywordCoverage: number;
  jobKeywordCount: number;
  atsRiskCount: number;
}

export interface AtsAnalysisReport {
  overallScore: number;
  issues: AtsIssue[];
  suggestions: Suggestion[];
  missingKeywords: string[];
  matchedKeywords: string[];
  metrics: AtsAnalyzerMetrics;
}

export type JobKeywordCategory = "technical" | "business" | "soft";

export interface JobKeywordItem {
  keyword: string;
  category: JobKeywordCategory;
  matched: boolean;
}

export interface PrioritizedKeyword {
  keyword: string;
  category: JobKeywordCategory;
  priority: "high" | "medium" | "low";
  reason: string;
}

export interface KeywordCategorySummary {
  category: JobKeywordCategory;
  label: string;
  total: number;
  matched: number;
  missing: number;
  coverage: number;
}

export interface ExperienceMatchSummary {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
}

export interface JobDiagnosisReport {
  overallMatchScore: number;
  atsScore: number;
  keywordCoverage: number;
  skillCoverage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  missingSkills: string[];
  categorizedKeywords: KeywordCategorySummary[];
  prioritizedKeywords: PrioritizedKeyword[];
  projectMatch: ExperienceMatchSummary;
  workMatch: ExperienceMatchSummary;
  atsIssues: AtsIssue[];
  suggestions: Suggestion[];
}
