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

function joinChatCompletionsUrl(baseURL: string) {
  return `${baseURL.replace(/\/+$/, "")}/chat/completions`;
}

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

function getConnectionErrorMessage(status: number, providerMessage?: string) {
  if (status === 401 || status === 403) {
    return "API Key 不正确或已失效，请重新复制后粘贴。";
  }
  if (status === 402 || status === 429) {
    return "当前 Key 可能余额不足或请求额度已用完，请到服务商控制台检查。";
  }
  if (status >= 500) {
    return "服务商接口暂时不可用，请稍后再试。";
  }
  return providerMessage || `连接失败：HTTP ${status}`;
}

export async function testAiConnection(config: AiConfig): Promise<{ ok: boolean; message?: string }> {
  assertAiConfigReady(config);

  try {
    const response = await fetch(joinChatCompletionsUrl(config.baseURL.trim()), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: config.model.trim(),
        temperature: 0,
        messages: [
          {
            role: "user",
            content: "请回复 ok，用于测试 API Key 是否可用。",
          },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        message: getConnectionErrorMessage(response.status, data?.error?.message),
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "网络连接失败，请检查代理、Base URL 或本机网络。",
    };
  }
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
