import React from "react";
import { render } from "@testing-library/react";
import ResumeAnalysisReportView from "../ResumeAnalysisReport";
import { ResumeAnalysisReport } from "@src/types/ai";

const report: ResumeAnalysisReport = {
  keywordCoverage: 60,
  matchedKeywords: ["Python", "FastAPI", "Linux"],
  missingKeywords: ["Docker", "RAG"],
  advantages: ["测试开发背景明显"],
  improvementAreas: ["缺少 Docker 经验描述"],
  suggestions: [{ title: "补充 Docker", detail: "在项目经历中补充容器化部署。" }],
  generatedBullets: [
    {
      targetSection: "projects",
      sourceKeyword: "Docker",
      content: "使用 Docker 完成服务容器化部署，提高环境部署效率。",
      insertable: false,
    },
  ],
  radarScores: {
    technical: 80,
    project: 70,
    impact: 40,
    keywordCoverage: 60,
    engineering: 75,
  },
};

describe("ResumeAnalysisReportView", () => {
  it("renders an explainable job match report without score-system language", () => {
    const { container, getByText } = render(<ResumeAnalysisReportView report={report} />);
    const text = container.textContent || "";

    expect(getByText("关键词覆盖率")).toBeInTheDocument();
    expect(getByText("60%")).toBeInTheDocument();
    expect(getByText("已匹配关键词")).toBeInTheDocument();
    expect(getByText("缺失关键词")).toBeInTheDocument();
    expect(getByText("优势分析")).toBeInTheDocument();
    expect(getByText("待提升项")).toBeInTheDocument();
    expect(getByText("AI 生成补充内容")).toBeInTheDocument();
    expect(getByText("来源关键词：Docker")).toBeInTheDocument();
    expect(getByText("RAG")).toBeInTheDocument();
    expect(text).toContain("本分析由 AI 根据当前简历和岗位描述生成");
    expect(text).not.toContain("ATS Score");
    expect(text).not.toContain("JD Match Score");
    expect(text).not.toContain("Overall Score");
    expect(text).not.toContain("总分");
    expect(text).not.toContain("ATS评分");
    expect(text).not.toContain("ATS检测");
  });
});
