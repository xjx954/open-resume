import React from "react";
import { render } from "@testing-library/react";
import ResumeAiModal from "../index";

describe("ResumeAiModal", () => {
  it("only exposes polish and job match analysis tasks", () => {
    const { container, queryByText } = render(
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
    expect(container.textContent).not.toContain("ATS 建议");
    expect(container.textContent).not.toContain("ATS评分");
    expect(container.textContent).not.toContain("ATS检测");
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
});
