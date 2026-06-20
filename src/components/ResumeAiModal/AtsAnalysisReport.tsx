import React from "react";
import { Tag } from "antd";
import { AtsAnalysisReport } from "@src/types/ai";

interface Props {
  report: AtsAnalysisReport;
}

const severityColor = {
  high: "error",
  medium: "warning",
  low: "default",
} as const;

const severityText = {
  high: "高",
  medium: "中",
  low: "低",
} as const;

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

const AtsAnalysisReportView: React.FC<Props> = ({ report }) => {
  const { metrics } = report;
  const metricItems = [
    ["联系方式", `${metrics.contactMethods}/3`],
    ["工作经历", `${metrics.workEntryCount} 项`],
    ["项目经历", `${metrics.projectEntryCount} 项`],
    ["技能关键词", `${metrics.skillKeywordCount} 个`],
    ["简历长度", `${metrics.resumeLength} 字`],
    ["行动动词", `${metrics.actionVerbCount} 次`],
    ["量化覆盖", formatPercent(metrics.quantifiedBulletCoverage)],
    ["JD 覆盖", metrics.jobKeywordCount > 0 ? formatPercent(metrics.keywordCoverage) : "未提供"],
    ["ATS 风险", `${metrics.atsRiskCount} 项`],
  ];

  return (
    <div className="resume-analysis-report">
      <section className="analysis-card analysis-card--coverage">
        <div>
          <h3>总体评分</h3>
          <p>基于本地规则引擎生成，未调用 AI。</p>
        </div>
        <strong>{report.overallScore}</strong>
      </section>

      <section className="analysis-card">
        <h3>检查指标</h3>
        <div className="ats-metrics">
          {metricItems.map(([label, value]) => (
            <div className="ats-metrics__item" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="analysis-card">
        <h3>问题列表</h3>
        {report.issues.length ? (
          <div className="ats-issues">
            {report.issues.map((issue) => (
              <article className="ats-issue" key={`${issue.id}-${issue.section}`}>
                <div>
                  <Tag color={severityColor[issue.severity]}>
                    {severityText[issue.severity]}风险
                  </Tag>
                  <strong>{issue.title}</strong>
                </div>
                <p>{issue.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="analysis-empty">暂无明显 ATS 风险。</p>
        )}
      </section>

      <section className="analysis-card">
        <h3>优化建议</h3>
        {report.suggestions.length ? (
          <ul className="analysis-list">
            {report.suggestions.map((item, index) => (
              <li key={`${item.title}-${index}`}>
                <strong>{item.title}：</strong>{item.detail}
              </li>
            ))}
          </ul>
        ) : (
          <p className="analysis-empty">暂无明确建议。</p>
        )}
      </section>

      <div className="analysis-keywords">
        <section className="analysis-card">
          <h3>命中关键词</h3>
          <div className="analysis-tags">
            {report.matchedKeywords.length
              ? report.matchedKeywords.map((item) => <Tag key={item}>{item}</Tag>)
              : <span className="analysis-empty">暂无命中关键词</span>}
          </div>
        </section>
        <section className="analysis-card">
          <h3>缺失关键词</h3>
          <div className="analysis-tags">
            {report.missingKeywords.length
              ? report.missingKeywords.map((item) => <Tag color="warning" key={item}>{item}</Tag>)
              : <span className="analysis-empty">暂无明显缺失关键词</span>}
          </div>
        </section>
      </div>

      <section className="analysis-card">
        <h3>重复词统计</h3>
        <div className="analysis-tags">
          {metrics.repeatedTerms.length
            ? metrics.repeatedTerms.map((item) => (
              <Tag key={item.term}>{item.term} × {item.count}</Tag>
            ))
            : <span className="analysis-empty">暂无高频重复词。</span>}
        </div>
      </section>

      <p className="analysis-disclaimer">
        本检查由本地规则引擎生成，用于发现可解释的简历结构和 ATS 风险，后续可在此基础上接入 AI 增强分析。
      </p>
    </div>
  );
};

export default AtsAnalysisReportView;
