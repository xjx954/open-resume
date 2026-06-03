import { AiConfig } from "@src/types/ai";

export const AI_CONFIG_KEY = "open-resume-ai-config";

export const AI_ERROR_CODE = {
  CONFIG_REQUIRED: "AI_CONFIG_REQUIRED",
} as const;

export class AiConfigurationError extends Error {
  code = AI_ERROR_CODE.CONFIG_REQUIRED;

  constructor(message = "请先在设置中完成 AI 服务配置。") {
    super(message);
    this.name = "AiConfigurationError";
  }
}

export const defaultAiConfig: AiConfig = {
  apiKey: "",
  baseURL: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
};

export const providerPresets = [
  {
    key: "openai",
    label: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    helpUrl: "https://platform.openai.com/api-keys",
  },
  {
    key: "deepseek",
    label: "DeepSeek V3",
    baseURL: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    helpUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    key: "qwen",
    label: "通义千问",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    helpUrl: "https://bailian.console.aliyun.com/",
  },
  {
    key: "glm",
    label: "智谱 GLM",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4",
    helpUrl: "https://open.bigmodel.cn/usercenter/apikeys",
  },
];

export function loadAiConfig(): AiConfig {
  try {
    const config = localStorage.getItem(AI_CONFIG_KEY);
    return config ? { ...defaultAiConfig, ...JSON.parse(config) } : defaultAiConfig;
  } catch {
    return defaultAiConfig;
  }
}

export function saveAiConfig(config: AiConfig) {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
}

export function isAiConfigReady(config: AiConfig) {
  return !!(config.apiKey.trim() && config.baseURL.trim() && config.model.trim());
}

export function assertAiConfigReady(config: AiConfig) {
  if (!isAiConfigReady(config)) {
    throw new AiConfigurationError();
  }
}

export function isAiConfigError(error: unknown): error is AiConfigurationError {
  return (
    error instanceof AiConfigurationError ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === AI_ERROR_CODE.CONFIG_REQUIRED)
  );
}
