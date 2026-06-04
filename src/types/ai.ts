export type AiTaskType = "polish" | "job_match";

export interface AiConfig {
  apiKey: string;
  baseURL: string;
  model: string;
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
