import { analyzeResumeAts } from "../atsAnalyzer";

const strongResume = `
# 张三

前端工程师

邮箱：zhangsan@example.com
电话：13800138000
GitHub：https://github.com/zhangsan

## 工作经历

### 星河科技 - 前端工程师（2021.07-至今）

- 主导 React 数据看板重构，首屏加载时间降低 35%。
- 优化 TypeScript 组件库，支撑 8 个业务团队复用。

## 项目经历

### 智能投递平台

- 负责 JD 关键词匹配模块，覆盖 20+ 招聘场景。
- 推动 Docker 部署流程，发布耗时降低 40%。

## 技能

- React、TypeScript、JavaScript、Webpack、Vite、Docker、Node.js、Git、CI/CD
`;

describe("analyzeResumeAts", () => {
  it("returns an explainable local ATS report without calling AI", () => {
    const report = analyzeResumeAts(
      strongResume,
      "React TypeScript Docker 前端工程化 数据看板"
    );

    expect(report.overallScore).toBeGreaterThanOrEqual(80);
    expect(report.matchedKeywords).toEqual(
      expect.arrayContaining(["React", "TypeScript", "Docker"])
    );
    expect(report.missingKeywords).toContain("前端工程化");
    expect(report.metrics.contactMethods).toBeGreaterThanOrEqual(3);
    expect(report.metrics.quantifiedBulletCoverage).toBeGreaterThan(0);
    expect(report.metrics.jobKeywordCount).toBeGreaterThan(0);
    expect(report.suggestions.length).toBeGreaterThan(0);
  });

  it("flags missing sections, weak contact info, short resumes, and ATS risks", () => {
    const report = analyzeResumeAts(
      "# 李四\n\n<img src=\"avatar.png\" />\n\n熟悉 React React React React React React",
      "React Docker Linux"
    );

    expect(report.overallScore).toBeLessThan(70);
    expect(report.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining([
        "contact_missing",
        "work_missing",
        "project_missing",
        "resume_too_short",
        "ats_risky_markup",
      ])
    );
    expect(report.missingKeywords).toEqual(expect.arrayContaining(["Docker", "Linux"]));
    expect(report.metrics.repeatedTerms[0]).toEqual(
      expect.objectContaining({ term: "React", count: 6 })
    );
  });

  it("keeps JD keyword coverage explainable when no JD is provided", () => {
    const report = analyzeResumeAts(strongResume);

    expect(report.metrics.jobKeywordCount).toBe(0);
    expect(report.metrics.keywordCoverage).toBe(0);
    expect(report.matchedKeywords).toEqual([]);
    expect(report.missingKeywords).toEqual([]);
  });

  it("analyzes English resumes with common section headings", () => {
    const report = analyzeResumeAts(
      `
# Alex Chen

alex@example.com · +1 555 123 4567 · https://github.com/alex

## Work Experience

### Acme Inc - Frontend Engineer

- Led React migration for a dashboard used by 50K users.
- Optimized TypeScript build pipeline and reduced release time by 30%.

## Projects

### Resume Builder

- Built ATS keyword matching with Node.js and Docker deployment.
- Improved rendering stability across 12 resume templates.

## Skills

- React, TypeScript, Node.js, Docker, Git, CI/CD, Testing
`,
      "React TypeScript Docker testing performance"
    );

    expect(report.overallScore).toBeGreaterThanOrEqual(75);
    expect(report.metrics.workEntryCount).toBeGreaterThanOrEqual(1);
    expect(report.metrics.projectEntryCount).toBeGreaterThanOrEqual(1);
    expect(report.matchedKeywords).toEqual(
      expect.arrayContaining(["React", "TypeScript", "Docker"])
    );
  });

  it("returns explainable results for empty and very long resumes", () => {
    const emptyReport = analyzeResumeAts("");
    const longReport = analyzeResumeAts(`${strongResume}\n${"重复内容 ".repeat(900)}`);

    expect(emptyReport.overallScore).toBeLessThan(50);
    expect(emptyReport.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(["contact_missing", "work_missing", "project_missing", "resume_too_short"])
    );
    expect(longReport.issues.map((issue) => issue.id)).toContain("resume_too_long");
  });
});
