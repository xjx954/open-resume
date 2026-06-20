import {
  AiClient,
  AiConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";
import { AiRequestError } from "./errors";

export function buildChatCompletionsUrl(baseURL: string) {
  return `${baseURL.replace(/\/+$/, "")}/chat/completions`;
}

export function extractAssistantContent(data: ChatCompletionResponse) {
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI 未返回有效内容。");
  }
  return content;
}

export function createAiClient(config: AiConfig): AiClient {
  const apiKey = config.apiKey.trim();
  const baseURL = config.baseURL.trim();
  const model = config.model.trim();

  return {
    async createChatCompletion(request: ChatCompletionRequest) {
      const response = await fetch(buildChatCompletionsUrl(baseURL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: request.temperature,
          messages: request.messages,
        }),
      });

      const data: ChatCompletionResponse = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new AiRequestError(response.status, data.error?.message);
      }

      return extractAssistantContent(data);
    },
  };
}
