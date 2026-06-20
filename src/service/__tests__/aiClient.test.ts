import { createAiClient } from "../aiClient";

describe("createAiClient", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "AI result" } }],
      }),
    });
  });

  it("posts chat completions to an OpenAI-compatible endpoint", async () => {
    const client = createAiClient({
      apiKey: "sk-test",
      baseURL: "https://example.com/v1/",
      model: "test-model",
    });

    await expect(
      client.createChatCompletion({
        temperature: 0.2,
        messages: [{ role: "user", content: "Hello" }],
      })
    ).resolves.toBe("AI result");

    expect((global as any).fetch).toHaveBeenCalledWith(
      "https://example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer sk-test",
        }),
      })
    );

    const body = JSON.parse((global as any).fetch.mock.calls[0][1].body);
    expect(body).toEqual({
      model: "test-model",
      temperature: 0.2,
      messages: [{ role: "user", content: "Hello" }],
    });
  });

  it("uses provider error messages before generic HTTP errors", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "Invalid API key" } }),
    });

    const client = createAiClient({
      apiKey: "bad-key",
      baseURL: "https://example.com/v1",
      model: "test-model",
    });

    await expect(
      client.createChatCompletion({
        temperature: 0,
        messages: [{ role: "user", content: "Hello" }],
      })
    ).rejects.toThrow("Invalid API key");
  });

  it("rejects empty assistant content", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "" } }],
      }),
    });

    const client = createAiClient({
      apiKey: "sk-test",
      baseURL: "https://example.com/v1",
      model: "test-model",
    });

    await expect(
      client.createChatCompletion({
        temperature: 0,
        messages: [{ role: "user", content: "Hello" }],
      })
    ).rejects.toThrow("AI 未返回有效内容");
  });
});
