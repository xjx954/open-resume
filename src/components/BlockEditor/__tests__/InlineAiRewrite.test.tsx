import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import InlineAiRewrite from "../InlineAiRewrite";
import { runInlineRewrite } from "@src/service/ai";
import { AI_CONFIG_KEY } from "@src/service/aiConfig";

jest.mock("@src/service/ai", () => ({
  runInlineRewrite: jest.fn(),
}));

jest.mock("@src/store", () => ({
  useStores: () => ({
    templateStore: {
      mdContent: "# 张三\n\n## 工作经历\n\n- 负责模块开发",
    },
  }),
}));

const mockedRunInlineRewrite = runInlineRewrite as jest.MockedFunction<typeof runInlineRewrite>;
const instructionPlaceholder = "可以在这里输入您的想法，例如：突出技术深度、量化成果、压缩为一句话";

function renderWithSelectedText() {
  const view = render(
    <div className="rs-block-editor">
      <div className="block-card">
        <span className="block-card-title__label">工作经历</span>
        <div className="block-entry-card">
          <span className="block-entry-card__title">星河科技 - 前端工程师</span>
          <textarea defaultValue="负责模块开发和上线维护" />
        </div>
      </div>
      <InlineAiRewrite />
    </div>
  );

  const textarea = view.container.querySelector("textarea") as HTMLTextAreaElement;
  textarea.focus();
  textarea.setSelectionRange(0, 6);
  document.dispatchEvent(new Event("selectionchange"));
  return { ...view, textarea };
}

beforeEach(() => {
  localStorage.clear();
  mockedRunInlineRewrite.mockReset();
  mockedRunInlineRewrite.mockResolvedValue("主导核心模块开发，支撑上线稳定性");
});

describe("InlineAiRewrite", () => {
  it("opens a local rewrite panel without calling AI immediately", async () => {
    const { getByText, queryByText } = renderWithSelectedText();

    fireEvent.click(await waitFor(() => getByText("AI 润色")));

    expect(getByText("局部润色")).toBeInTheDocument();
    expect(getByText("已参考整份简历上下文，仅优化当前选中内容。")).toBeInTheDocument();
    expect(getByText("正在润色：工作经历 / 星河科技 - 前端工程师")).toBeInTheDocument();
    expect(getByText("负责模块开发")).toBeInTheDocument();
    expect(queryByText("生成结果将显示在这里")).toBeInTheDocument();
    expect(mockedRunInlineRewrite).not.toHaveBeenCalled();
  });

  it("fills the user instruction from a quick action and sends resume context", async () => {
    localStorage.setItem(
      AI_CONFIG_KEY,
      JSON.stringify({
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        model: "test-model",
      })
    );

    const { getByText, getByPlaceholderText } = renderWithSelectedText();

    fireEvent.click(await waitFor(() => getByText("AI 润色")));
    fireEvent.click(getByText("突出成果"));
    expect(getByPlaceholderText(instructionPlaceholder)).toHaveValue("突出成果");

    fireEvent.click(getByText("生成"));

    await waitFor(() => {
      expect(mockedRunInlineRewrite).toHaveBeenCalledWith({
        selectedText: "负责模块开发",
        resumeContext: "# 张三\n\n## 工作经历\n\n- 负责模块开发",
        userInstruction: "突出成果",
        fieldContext: "工作经历 / 星河科技 - 前端工程师",
        generationIndex: 1,
        config: {
          apiKey: "sk-test",
          baseURL: "https://example.com/v1",
          model: "test-model",
        },
      });
    });
    expect(await waitFor(() => getByText("主导核心模块开发，支撑上线稳定性"))).toBeInTheDocument();
  });

  it("shows settings guidance in the panel when AI is not configured", async () => {
    const { getByText, queryByText } = renderWithSelectedText();

    fireEvent.click(await waitFor(() => getByText("AI 润色")));

    expect(getByText("请先在设置中配置 AI 服务")).toBeInTheDocument();
    expect(getByText("去设置")).toBeInTheDocument();
    expect(queryByText("API Key")).not.toBeInTheDocument();
  });

  it("keeps the panel state and allows retry after generation failure", async () => {
    localStorage.setItem(
      AI_CONFIG_KEY,
      JSON.stringify({
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        model: "test-model",
      })
    );
    mockedRunInlineRewrite
      .mockRejectedValueOnce(new Error("服务暂时不可用"))
      .mockResolvedValueOnce("主导核心模块开发");

    const { getByText, getByPlaceholderText } = renderWithSelectedText();

    fireEvent.click(await waitFor(() => getByText("AI 润色")));
    fireEvent.change(getByPlaceholderText(instructionPlaceholder), {
      target: { value: "更专业" },
    });
    fireEvent.click(getByText("生成"));

    expect(await waitFor(() => getByText("服务暂时不可用"))).toBeInTheDocument();
    expect(getByPlaceholderText(instructionPlaceholder)).toHaveValue("更专业");

    fireEvent.click(getByText("重新生成"));

    await waitFor(() => expect(mockedRunInlineRewrite).toHaveBeenCalledTimes(2));
    expect(mockedRunInlineRewrite.mock.calls[1][0].generationIndex).toBe(2);
  });

  it("disables apply actions until a result exists", async () => {
    localStorage.setItem(
      AI_CONFIG_KEY,
      JSON.stringify({
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        model: "test-model",
      })
    );

    const { getByText } = renderWithSelectedText();

    fireEvent.click(await waitFor(() => getByText("AI 润色")));

    expect(getByText("替换原文")).toBeDisabled();
    expect(getByText("插入下方")).toBeDisabled();
  });
});
