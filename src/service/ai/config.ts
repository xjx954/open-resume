import { AiConfig } from "./types";
import { createAiClient } from "./client";
import {
  AiConfigurationError,
  isAiRequestError,
} from "./errors";

export const AI_CONFIG_KEY = "open-resume-ai-config";

export const defaultAiConfig: AiConfig = {
  apiKey: "",
  baseURL: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
};

export const providerPresets = [
  {
    key: "deepseek",
    label: "DeepSeek V3",
    baseURL: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    helpUrl: "https://platform.deepseek.com/api_keys",
    description: "国内直接注册，新用户赠免费额度，性价比最高",
    tags: ["推荐", "国内直连", "免费额度"],
  },
  {
    key: "qwen",
    label: "通义千问",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    helpUrl: "https://bailian.console.aliyun.com/",
    description: "阿里云旗下，国内直接使用，百炼平台一键开通",
    tags: ["国内直连", "阿里云"],
  },
  {
    key: "glm",
    label: "智谱 GLM",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4",
    helpUrl: "https://open.bigmodel.cn/usercenter/apikeys",
    description: "清华智谱出品，GLM-4 综合能力强",
    tags: ["国内直连"],
  },
  {
    key: "moonshot",
    label: "Moonshot / Kimi",
    baseURL: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
    helpUrl: "https://platform.moonshot.cn/console/api-keys",
    description: "月之暗面 Kimi，适合中文简历润色和长文本理解",
    tags: ["国内直连", "长文本"],
  },
  {
    key: "ollama",
    label: "Ollama 本地模型",
    baseURL: "http://127.0.0.1:11434/v1",
    model: "qwen2.5:7b-instruct-q4_K_M",
    helpUrl: "https://ollama.com/library",
    description: "本机运行 OpenAI-compatible 接口，适合本地隐私场景",
    tags: ["本地模型", "需本机服务"],
  },
  {
    key: "openai",
    label: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    helpUrl: "https://platform.openai.com/api-keys",
    description: "国际主流，需海外网络环境和海外手机号注册",
    tags: ["需海外网络"],
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
    const client = createAiClient(config);
    await client.createChatCompletion({
      temperature: 0,
      messages: [
        {
          role: "user",
          content: "请回复 ok，用于测试 API Key 是否可用。",
        },
      ],
    });
    return { ok: true };
  } catch (error) {
    if (isAiRequestError(error)) {
      return {
        ok: false,
        message: getConnectionErrorMessage(error.status, error.providerMessage),
      };
    }
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
