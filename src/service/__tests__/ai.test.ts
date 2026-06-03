import {
  AI_CONFIG_KEY,
  AI_ERROR_CODE,
  AiConfigurationError,
  defaultAiConfig,
  isAiConfigError,
  loadAiConfig,
  saveAiConfig,
} from "../aiConfig";
import { runInlineRewrite } from "../ai";

describe("AI config persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads the default OpenAI-compatible config when no local config exists", () => {
    expect(loadAiConfig()).toEqual(defaultAiConfig);
  });

  it("saves and reloads AI service configuration from localStorage", () => {
    saveAiConfig({
      apiKey: "sk-test",
      baseURL: "https://example.com/v1",
      model: "test-model",
    });

    expect(JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || "{}")).toEqual({
      apiKey: "sk-test",
      baseURL: "https://example.com/v1",
      model: "test-model",
    });
    expect(loadAiConfig().model).toBe("test-model");
  });
});

describe("runInlineRewrite", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "主导核心模块开发，支撑日均 10 万用户访问" } }],
      }),
    });
  });

  it("rewrites selected resume text through the chat completions API", async () => {
    const result = await runInlineRewrite(
      "负责模块开发",
      "工作经历 / 公司A",
      {
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        model: "test-model",
      }
    );

    expect(result).toBe("主导核心模块开发，支撑日均 10 万用户访问");
    expect((global as any).fetch).toHaveBeenCalledWith(
      "https://example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
        }),
      })
    );
  });

  it("requires API key, base URL, and model before rewriting", async () => {
    await expect(
      runInlineRewrite("负责模块开发", "", {
        apiKey: "",
        baseURL: "https://example.com/v1",
        model: "test-model",
      })
    ).rejects.toThrow("请先在设置中完成 AI 服务配置");
  });

  it("marks missing AI configuration with a stable error code", async () => {
    try {
      await runInlineRewrite("负责模块开发", "", {
        apiKey: "",
        baseURL: "https://example.com/v1",
        model: "test-model",
      });
      throw new Error("Expected runInlineRewrite to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AiConfigurationError);
      expect(isAiConfigError(error)).toBe(true);
      expect((error as AiConfigurationError).code).toBe(AI_ERROR_CODE.CONFIG_REQUIRED);
    }
  });
});
