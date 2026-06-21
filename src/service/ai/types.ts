import { AiConfig } from "@src/types/ai";

export type {
  AiClient,
  AiConfig,
  AiTaskOption,
  AiTaskType,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  ChatMessageRole,
  GeneratedBullet,
  JobDiagnosisOptimizationIssue,
  JobDiagnosisOptimizationParams,
  JobDiagnosisOptimizationResult,
  ResumeAnalysisReport,
  ResumeAnalysisResult,
  Suggestion,
} from "@src/types/ai";

export interface InlineRewriteParams {
  selectedText: string;
  resumeContext: string;
  userInstruction?: string;
  fieldContext?: string;
  generationIndex?: number;
  config: AiConfig;
}
