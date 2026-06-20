import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import AiSettingsModal from "../index";
import { AI_CONFIG_KEY } from "@src/service/aiConfig";

describe("AiSettingsModal", () => {
  beforeEach(() => {
    localStorage.clear();
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "ok" } }],
      }),
    });
  });

  it("guides first-time users with a recommended provider and hides advanced fields", () => {
    const { getByText, getByPlaceholderText, queryByLabelText } = render(
      <AiSettingsModal visible onCancel={() => undefined} />
    );

    expect(getByText("选择服务商")).toBeInTheDocument();
    expect(getByText("🔥 推荐")).toBeInTheDocument();
    expect(getByText("DeepSeek V3")).toBeInTheDocument();
    expect(
      getByPlaceholderText("粘贴你的 API Key，通常以 sk- 开头")
    ).toBeInTheDocument();
    expect(queryByLabelText("接口地址（Base URL）")).not.toBeInTheDocument();
    expect(queryByLabelText("模型名称（Model）")).not.toBeInTheDocument();
    expect(
      getByText(/API Key 会以明文形式保存在本机浏览器 localStorage/)
    ).toBeInTheDocument();
  });

  it("saves the selected provider preset when users paste an API key", () => {
    const { getByPlaceholderText } = render(
      <AiSettingsModal visible onCancel={() => undefined} />
    );

    fireEvent.change(
      getByPlaceholderText("粘贴你的 API Key，通常以 sk- 开头"),
      {
        target: { value: "sk-user" },
      }
    );

    expect(JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || "{}")).toEqual({
      apiKey: "sk-user",
      baseURL: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
    });
  });

  it("tests the connection and shows a connected status", async () => {
    const { getByPlaceholderText, getByText } = render(
      <AiSettingsModal visible onCancel={() => undefined} />
    );

    fireEvent.change(
      getByPlaceholderText("粘贴你的 API Key，通常以 sk- 开头"),
      {
        target: { value: "sk-user" },
      }
    );
    fireEvent.click(getByText("🧪 测试连接"));

    await waitFor(() => {
      expect(
        getByText("✅ AI 服务已连接 · DeepSeek V3")
      ).toBeInTheDocument();
    });

    expect((global as any).fetch).toHaveBeenCalledWith(
      "https://api.deepseek.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-user",
        }),
      })
    );
  });

  it("keeps provider presets extensible without changing config shape", () => {
    const { getByText, getByPlaceholderText } = render(
      <AiSettingsModal visible onCancel={() => undefined} />
    );

    expect(getByText("Moonshot / Kimi")).toBeInTheDocument();
    expect(getByText("Ollama 本地模型")).toBeInTheDocument();

    fireEvent.click(getByText("Moonshot / Kimi"));
    fireEvent.change(
      getByPlaceholderText(/API Key/),
      {
        target: { value: "sk-moonshot" },
      }
    );
    expect(JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || "{}")).toEqual({
      apiKey: "sk-moonshot",
      baseURL: "https://api.moonshot.cn/v1",
      model: "moonshot-v1-8k",
    });

    fireEvent.click(getByText("Ollama 本地模型"));
    expect(JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || "{}")).toEqual({
      apiKey: "sk-moonshot",
      baseURL: "http://127.0.0.1:11434/v1",
      model: "qwen2.5:7b-instruct-q4_K_M",
    });
  });

  it("still allows advanced manual base URL and model overrides", () => {
    const { getByLabelText, getByText } = render(
      <AiSettingsModal visible onCancel={() => undefined} />
    );

    fireEvent.click(getByText(/高级设置/));
    fireEvent.change(getByLabelText(/Base URL/), {
      target: { value: "http://localhost:9999/v1" },
    });
    fireEvent.change(getByLabelText(/Model/), {
      target: { value: "custom-model" },
    });

    expect(JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || "{}")).toEqual({
      apiKey: "",
      baseURL: "http://localhost:9999/v1",
      model: "custom-model",
    });
  });
});
