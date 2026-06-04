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
});
