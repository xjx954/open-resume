import React from "react";
import { Tag } from "antd";
import { JobDiagnosisReport, JobKeywordCategory } from "@src/types/ai";

interface Props {
  report: JobDiagnosisReport;
}

const categoryColor: Record<JobKeywordCategory, string> = {
  technical: "blue",
  business: "purple",
  soft: "green",
};

const priorityColor = {
  high: "error",
  medium: "warning",
  low: "default",
} as const;

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

const KeywordTags: React.FC<{ items: string[]; empty: string; color?: string }> = ({
  items,
  empty,
  color,
}) => (
  <div className="analysis-tags">
    {items.length
      ? items.map((item) => <Tag color={color} key={item}>{item}</Tag>)
      : <span className="analysis-empty">{empty}</span>}
  </div>
);

const JobDiagnosisReportView: React.FC<Props> = ({ report }) => {
  const hasJobKeywords = report.matchedKeywords.length > 0 || report.missingKeywords.length > 0;
  const metricItems = [
    ["总体匹配分", hasJobKeywords ? report.overallMatchScore : "未提供"],
    ["ATS 分", report.atsScore],
    ["关键词覆盖率", hasJobKeywords ? formatPercent(report.keywordCoverage) : "未提供"],
    ["技能覆盖率", hasJobKeywords && (report.matchedSkills.length || report.missingSkills.length) ? formatPercent(report.skillCoverage) : "未提供"],
  ];

  return (
    <div className="resume-analysis-report">
      <section className="analysis-card diagnosis-score-card">
        {metricItems.map(([label, value]) => (
          <div className="diagnosis-score-card__item" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="analysis-card">
        <h3>JD 关键词分类</h3>
        <div className="ats-metrics">
          {report.categorizedKeywords.map((item) => (
            <div className="ats-metrics__item" key={item.category}>
              <span>{item.label}</span>
              <strong>{item.total ? `${item.matched}/${item.total}` : "未提供"}</strong>
              <small>{item.total ? `覆盖 ${formatPercent(item.coverage)}` : "暂无关键词"}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="analysis-keywords">
        <section className="analysis-card">
          <h3>匹配技能</h3>
          <KeywordTags items={report.matchedSkills} empty="暂无匹配技能" />
        </section>
        <section className="analysis-card">
          <h3>缺失技能</h3>
          <KeywordTags items={report.missingSkills} empty="暂无缺失技能" color="warning" />
        </section>
      </div>

      <div className="analysis-keywords">
        <section className="analysis-card">
          <h3>命中关键词</h3>
          <KeywordTags items={report.matchedKeywords} empty="暂无命中关键词" />
        </section>
        <section className="analysis-card">
          <h3>缺失关键词</h3>
          <KeywordTags items={report.missingKeywords} empty="暂无明显缺失关键词" color="warning" />
        </section>
      </div>

      <section className="analysis-card">
        <h3>优先补充关键词</h3>
        {report.prioritizedKeywords.length ? (
          <div className="diagnosis-priority-list">
            {report.prioritizedKeywords.map((item) => (
              <article className="diagnosis-priority" key={item.keyword}>
                <div>
                  <Tag color={priorityColor[item.priority]}>
                    {item.priority === "high" ? "高优先级" : item.priority === "medium" ? "中优先级" : "低优先级"}
                  </Tag>
                  <Tag color={categoryColor[item.category]}>
                    {report.categorizedKeywords.find((category) => category.category === item.category)?.label}
                  </Tag>
                  <strong>{item.keyword}</strong>
                </div>
                <p>{item.reason}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="analysis-empty">暂无需要优先补充的关键词。</p>
        )}
      </section>

      <div className="analysis-keywords">
        <section className="analysis-card">
          <h3>项目经历匹配情况</h3>
          <p>{report.projectMatch.summary}</p>
          <KeywordTags items={report.projectMatch.missingKeywords.slice(0, 8)} empty="暂无项目经历缺失关键词" color="warning" />
        </section>
        <section className="analysis-card">
          <h3>工作经历匹配情况</h3>
          <p>{report.workMatch.summary}</p>
          <KeywordTags items={report.workMatch.missingKeywords.slice(0, 8)} empty="暂无工作经历缺失关键词" color="warning" />
        </section>
      </div>

      <section className="analysis-card">
        <h3>ATS 风险与改进建议</h3>
        {report.atsIssues.length ? (
          <ul className="analysis-list">
            {report.atsIssues.slice(0, 6).map((issue) => (
              <li key={`${issue.id}-${issue.section}`}>
                <strong>{issue.title}：</strong>{issue.detail}
              </li>
            ))}
          </ul>
        ) : (
          <p className="analysis-empty">暂无明显 ATS 风险。</p>
        )}
      </section>

      <section className="analysis-card">
        <h3>改进建议</h3>
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

      <p className="analysis-disclaimer">
        本诊断由本地规则引擎生成，合并 ATS 检查与 JD 匹配结果，未调用 AI。
      </p>
    </div>
  );
};

export default JobDiagnosisReportView;
