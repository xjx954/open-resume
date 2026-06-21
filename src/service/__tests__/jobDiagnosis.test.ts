import { analyzeJobDiagnosis } from "../jobDiagnosis";

const resume = `
# 张三

邮箱：zhangsan@example.com
电话：13800138000
GitHub：https://github.com/zhangsan

## 工作经历

### 星河科技 - 前端工程师

- 主导 React 数据看板重构，首屏加载时间降低 35%。
- 负责 TypeScript 组件库建设，支撑 8 个业务团队复用。

## 项目经历

### 智能投递平台

- 负责 JD 关键词匹配模块，覆盖 20+ 招聘场景。
- 推动 Docker 部署流程，发布耗时降低 40%。

## 技能

- React、TypeScript、Docker、Git、CI/CD
`;

describe("analyzeJobDiagnosis", () => {
  it("returns one local report combining ATS and JD matching", () => {
    const report = analyzeJobDiagnosis(
      resume,
      "需要 React TypeScript Docker 前端工程化 数据分析 沟通协作 项目管理"
    );

    expect(report.overallMatchScore).toBeGreaterThan(0);
    expect(report.atsScore).toBeGreaterThan(0);
    expect(report.keywordCoverage).toBeGreaterThan(0);
    expect(report.matchedKeywords).toEqual(
      expect.arrayContaining(["React", "TypeScript", "Docker"])
    );
    expect(report.missingKeywords).toEqual(
      expect.arrayContaining(["前端工程化", "数据分析", "沟通协作", "项目管理"])
    );
    expect(report.matchedSkills).toEqual(
      expect.arrayContaining(["React", "TypeScript", "Docker"])
    );
    expect(report.missingSkills).toContain("前端工程化");
    expect(report.categorizedKeywords.map((item) => item.category)).toEqual(
      expect.arrayContaining(["technical", "business", "soft"])
    );
    expect(report.prioritizedKeywords[0]).toEqual(
      expect.objectContaining({ priority: "high" })
    );
    expect(report.projectMatch.summary).toBeTruthy();
    expect(report.workMatch.summary).toBeTruthy();
    expect(report.suggestions.length).toBeGreaterThan(0);
    expect(report.scoreBreakdown.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "ATS 基础分",
        "联系方式",
        "经历完整性",
        "项目完整性",
        "技能覆盖",
        "JD关键词覆盖",
        "量化成果",
        "ATS风险扣分",
        "重复词扣分",
      ])
    );
    expect(report.scoreBreakdown.every((item) => item.score <= item.maxScore)).toBe(true);
    expect(report.scoreBreakdown.find((item) => item.label === "JD关键词覆盖")).toEqual(
      expect.objectContaining({ counted: true })
    );
  });

  it("keeps the diagnosis explainable when JD is empty", () => {
    const report = analyzeJobDiagnosis(resume, "");

    expect(report.keywordCoverage).toBe(0);
    expect(report.skillCoverage).toBe(0);
    expect(report.missingKeywords).toEqual([]);
    expect(report.missingSkills).toEqual([]);
    expect(report.prioritizedKeywords).toEqual([]);
    expect(report.categorizedKeywords.every((item) => item.total === 0)).toBe(true);
    expect(report.suggestions.map((item) => `${item.title}${item.detail}`).join("\n")).not.toMatch(/JD|关键词/);
    expect(report.scoreBreakdown.find((item) => item.label === "JD关键词覆盖")).toEqual(
      expect.objectContaining({
        counted: false,
        reason: "未提供 JD，未计入总分。",
      })
    );
    expect(report.scoreBreakdown.find((item) => item.label === "技能覆盖")).toEqual(
      expect.objectContaining({
        counted: false,
        reason: "未提供 JD，未计入总分。",
      })
    );
  });
});
