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
});
