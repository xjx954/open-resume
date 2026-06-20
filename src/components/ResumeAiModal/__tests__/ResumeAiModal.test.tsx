import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import ResumeAiModal from "../index";

describe("ResumeAiModal", () => {
  it("exposes polish, job match analysis, and local job diagnosis tasks", () => {
    const { queryByText } = render(
      <ResumeAiModal
        visible
        markdown="# 张三"
        onCancel={() => undefined}
        onApply={() => undefined}
        onOpenSettings={() => undefined}
      />
    );

    expect(queryByText("简历润色")).toBeInTheDocument();
    expect(queryByText("岗位匹配分析")).toBeInTheDocument();
    expect(queryByText("求职诊断")).toBeInTheDocument();
  });

  it("shows paragraph diff preview in polish mode", () => {
    const { getAllByText, getByText } = render(
      <ResumeAiModal
        visible
        markdown={"# 张三\n\n负责业务开发"}
        onCancel={() => undefined}
        onApply={() => undefined}
        onOpenSettings={() => undefined}
      />
    );

    expect(getByText("段落级改动预览")).toBeInTheDocument();
    expect(getByText("原文")).toBeInTheDocument();
    expect(getAllByText("AI 结果").length).toBeGreaterThanOrEqual(1);
  });

  it("runs job diagnosis locally without calling AI", async () => {
    const originalFetch = global.fetch;
    const fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    const { getByText } = render(
      <ResumeAiModal
        visible
        markdown={"# 张三\n\n邮箱：zhangsan@example.com\n\n## 工作经历\n\n- 负责 React 页面开发\n\n## 项目经历\n\n- 使用 Docker 部署项目\n\n## 技能\n\n- React、TypeScript、Docker"}
        onCancel={() => undefined}
        onApply={() => undefined}
        onOpenSettings={() => undefined}
      />
    );

    fireEvent.change(getByText("岗位 JD（可选）").parentElement!.querySelector("textarea")!, {
      target: { value: "需要 React TypeScript Docker 前端工程化 沟通协作" },
    });
    fireEvent.click(getByText("求职诊断"));
    fireEvent.click(getByText("开始诊断"));

    await waitFor(() => {
      expect(getByText("总体匹配分")).toBeInTheDocument();
    });
    expect(getByText("ATS 分")).toBeInTheDocument();
    expect(getByText("关键词覆盖率")).toBeInTheDocument();
    expect(getByText("技能覆盖率")).toBeInTheDocument();
    expect(getByText("JD 关键词分类")).toBeInTheDocument();
    expect(getByText("优先补充关键词")).toBeInTheDocument();
    expect(getByText("项目经历匹配情况")).toBeInTheDocument();
    expect(getByText("工作经历匹配情况")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    (global as any).fetch = originalFetch;
  });
});
