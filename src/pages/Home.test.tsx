import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import Home from "./Home";

describe("Home", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("positions the product as an AI job-search assistant", () => {
    const { getByText } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(getByText("ATS 检查 · JD 匹配 · AI 优化")).toBeInTheDocument();
    expect(getByText("诊断简历问题，")).toBeInTheDocument();
    expect(getByText("匹配目标岗位")).toBeInTheDocument();
    expect(getByText("开始诊断简历")).toBeInTheDocument();
    expect(getByText("查看模板")).toBeInTheDocument();
  });

  it("shows diagnosis preview, capabilities, and workflow", () => {
    const { getByText } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(getByText("求职诊断报告")).toBeInTheDocument();
    expect(getByText("总体匹配分")).toBeInTheDocument();
    expect(getByText("ATS 分")).toBeInTheDocument();
    expect(getByText("关键词覆盖率")).toBeInTheDocument();
    expect(getByText("技能覆盖率")).toBeInTheDocument();
    expect(getByText("求职诊断")).toBeInTheDocument();
    expect(getByText("JD 匹配")).toBeInTheDocument();
    expect(getByText("可解释评分")).toBeInTheDocument();
    expect(getByText("AI 优化建议")).toBeInTheDocument();
    expect(getByText("AI 优化示例")).toBeInTheDocument();
    expect(getByText("优化前")).toBeInTheDocument();
    expect(getByText("优化后")).toBeInTheDocument();
    expect(getByText("编辑简历")).toBeInTheDocument();
    expect(getByText("粘贴 JD")).toBeInTheDocument();
    expect(getByText("导出 PDF")).toBeInTheDocument();
  });
});
