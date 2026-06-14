import {
  AI_CONFIG_KEY,
  AI_ERROR_CODE,
  AiConfigurationError,
  defaultAiConfig,
  isAiConfigError,
  loadAiConfig,
  saveAiConfig,
  testAiConnection,
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

describe("testAiConnection", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "ok" } }],
      }),
    });
  });

  it("checks the configured chat completions endpoint", async () => {
    await expect(
      testAiConnection({
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        model: "test-model",
      })
    ).resolves.toEqual({ ok: true });

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

  it("turns provider errors into user-facing messages", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "Invalid API key" } }),
    });

    await expect(
      testAiConnection({
        apiKey: "bad-key",
        baseURL: "https://example.com/v1",
        model: "test-model",
      })
    ).resolves.toEqual({
      ok: false,
      message: "API Key 不正确或已失效，请重新复制后粘贴。",
    });
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
    const result = await runInlineRewrite({
      selectedText: "负责模块开发",
      resumeContext: "# 张三\n\n## 工作经历\n\n- 负责模块开发",
      userInstruction: "突出成果",
      fieldContext: "工作经历 / 公司A",
      generationIndex: 1,
      config: {
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        model: "test-model",
      },
    });

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

    const body = JSON.parse((global as any).fetch.mock.calls[0][1].body);
    const content = body.messages.map((message: { content: string }) => message.content).join("\n");
    expect(content).toContain("用户完整简历上下文");
    expect(content).toContain("# 张三");
    expect(content).toContain("当前正在优化的字段/模块");
    expect(content).toContain("工作经历 / 公司A");
    expect(content).toContain("用户选中的原文");
    expect(content).toContain("负责模块开发");
    expect(content).toContain("用户的优化要求");
    expect(content).toContain("突出成果");
    expect(content).toContain("只能输出优化后的 selectedText");
  });

  it("uses a resume-focused default instruction when the user instruction is empty", async () => {
    await runInlineRewrite({
      selectedText: "负责模块开发",
      resumeContext: "# 张三",
      userInstruction: "   ",
      fieldContext: "项目经历",
      generationIndex: 1,
      config: {
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        model: "test-model",
      },
    });

    const body = JSON.parse((global as any).fetch.mock.calls[0][1].body);
    const content = body.messages.map((message: { content: string }) => message.content).join("\n");
    expect(content).toContain("专业、简洁、适合简历表达");
  });

  it("asks for different wording on repeated generations without changing facts", async () => {
    await runInlineRewrite({
      selectedText: "负责模块开发",
      resumeContext: "# 张三",
      userInstruction: "更专业",
      fieldContext: "项目经历",
      generationIndex: 3,
      config: {
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        model: "test-model",
      },
    });

    const body = JSON.parse((global as any).fetch.mock.calls[0][1].body);
    const content = body.messages.map((message: { content: string }) => message.content).join("\n");
    expect(content).toContain("这是第 3 次生成，请给出不同措辞但保持事实一致。");
  });

  it("requires API key, base URL, and model before rewriting", async () => {
    await expect(
      runInlineRewrite({
        selectedText: "负责模块开发",
        resumeContext: "",
        userInstruction: "",
        fieldContext: "",
        generationIndex: 1,
        config: {
          apiKey: "",
          baseURL: "https://example.com/v1",
          model: "test-model",
        },
      })
    ).rejects.toThrow("请先在设置中完成 AI 服务配置");
  });

  it("marks missing AI configuration with a stable error code", async () => {
    try {
      await runInlineRewrite({
        selectedText: "负责模块开发",
        resumeContext: "",
        userInstruction: "",
        fieldContext: "",
        generationIndex: 1,
        config: {
          apiKey: "",
          baseURL: "https://example.com/v1",
          model: "test-model",
        },
      });
      throw new Error("Expected runInlineRewrite to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AiConfigurationError);
      expect(isAiConfigError(error)).toBe(true);
      expect((error as AiConfigurationError).code).toBe(AI_ERROR_CODE.CONFIG_REQUIRED);
    }
  });
});
