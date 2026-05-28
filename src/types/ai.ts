export type AiTaskType = "polish" | "match_jd" | "quantify" | "ats_keywords";

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
