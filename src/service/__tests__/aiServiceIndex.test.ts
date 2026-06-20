import {
  buildChatCompletionsUrl,
  defaultAiConfig,
  providerPresets,
  runInlineRewrite,
  runJobMatchAnalysis,
  runResumeAiTask,
} from "../ai/index";
import { runInlineRewrite as runInlineRewriteCompat } from "../ai";
import { loadAiConfig } from "../aiConfig";

describe("AI service module structure", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("exposes task runners and config through the service index", () => {
    expect(typeof runResumeAiTask).toBe("function");
    expect(typeof runInlineRewrite).toBe("function");
    expect(typeof runJobMatchAnalysis).toBe("function");
    expect(buildChatCompletionsUrl("https://example.com/v1/")).toBe(
      "https://example.com/v1/chat/completions"
    );
    expect(defaultAiConfig.model).toBe("gpt-4o-mini");
    expect(providerPresets.map((preset) => preset.key)).toEqual(
      expect.arrayContaining(["deepseek", "moonshot", "ollama", "openai"])
    );
  });

  it("keeps legacy imports compatible", () => {
    expect(runInlineRewriteCompat).toBe(runInlineRewrite);
    expect(loadAiConfig()).toEqual(defaultAiConfig);
  });
});
