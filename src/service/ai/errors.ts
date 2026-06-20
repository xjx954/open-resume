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

export class AiRequestError extends Error {
  status: number;
  providerMessage?: string;

  constructor(status: number, providerMessage?: string) {
    super(providerMessage || `AI 请求失败：HTTP ${status}`);
    this.name = "AiRequestError";
    this.status = status;
    this.providerMessage = providerMessage;
  }
}

export function isAiRequestError(error: unknown): error is AiRequestError {
  return error instanceof AiRequestError;
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
