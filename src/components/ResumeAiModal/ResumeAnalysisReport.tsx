import React from "react";
import { Button, message, Tag } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { GeneratedBullet, ResumeAnalysisReport, Suggestion } from "@src/types/ai";

interface Props {
  report: ResumeAnalysisReport;
}

const radarLabels: Array<[keyof ResumeAnalysisReport["radarScores"], string]> = [
  ["technical", "技术匹配度"],
  ["project", "项目深度"],
  ["impact", "成果量化"],
  ["keywordCoverage", "关键词覆盖"],
  ["engineering", "工程能力"],
];

function stars(score: number) {
  const count = Math.max(0, Math.min(5, Math.round(score / 20)));
  return `${"★".repeat(count)}${"☆".repeat(5 - count)}`;
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
  message.success("已复制");
}

const TextList: React.FC<{ title: string; items: string[]; empty: string }> = ({ title, items, empty }) => (
  <section className="analysis-card">
    <h3>{title}</h3>
    {items.length ? (
      <ul className="analysis-list">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    ) : (
      <p className="analysis-empty">{empty}</p>
    )}
  </section>
);

const SuggestionList: React.FC<{ suggestions: Suggestion[] }> = ({ suggestions }) => (
  <section className="analysis-card">
    <h3>优化建议</h3>
    {suggestions.length ? suggestions.map((item, index) => (
      <article className="analysis-suggestion" key={`${item.title}-${index}`}>
        <div>
          <strong>{item.title || "建议"}</strong>
          <p>{item.detail}</p>
        </div>
        <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(`${item.title}\n${item.detail}`)}>
          复制
        </Button>
      </article>
    )) : <p className="analysis-empty">暂无明确建议。</p>}
  </section>
);

const GeneratedBullets: React.FC<{ bullets: GeneratedBullet[] }> = ({ bullets }) => (
  <section className="analysis-card">
    <h3>AI 生成补充内容</h3>
    {bullets.length ? bullets.map((item, index) => (
      <article className="analysis-bullet" key={`${item.sourceKeyword}-${index}`}>
        <div>
          <div className="analysis-bullet__keyword">来源关键词：{item.sourceKeyword}</div>
          <p>{item.content}</p>
        </div>
        <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(item.content)}>
          复制
        </Button>
      </article>
    )) : <p className="analysis-empty">暂无可直接补充内容。</p>}
  </section>
);

const ResumeAnalysisReportView: React.FC<Props> = ({ report }) => {
  return (
    <div className="resume-analysis-report">
      <section className="analysis-card analysis-card--coverage">
        <div>
          <h3>关键词覆盖率</h3>
          <p>基于岗位描述和当前简历本地计算。</p>
        </div>
        <strong>{report.keywordCoverage}%</strong>
      </section>

      <div className="analysis-keywords">
        <section className="analysis-card">
          <h3>已匹配关键词</h3>
          <div className="analysis-tags">
            {report.matchedKeywords.length
              ? report.matchedKeywords.map((item) => <Tag key={item}>{item}</Tag>)
              : <span className="analysis-empty">暂无匹配关键词</span>}
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
        <h3>竞争力分析</h3>
        <div className="analysis-radar">
          {radarLabels.map(([key, label]) => (
            <div className="analysis-radar__row" key={key}>
              <span>{label}</span>
              <strong>{stars(report.radarScores[key])}</strong>
            </div>
          ))}
        </div>
      </section>

      <TextList title="优势分析" items={report.advantages} empty="暂无明显优势结论。" />
      <TextList title="待提升项" items={report.improvementAreas} empty="暂无明显待提升项。" />
      <SuggestionList suggestions={report.suggestions} />
      <GeneratedBullets bullets={report.generatedBullets} />

      <p className="analysis-disclaimer">
        本分析由 AI 根据当前简历和岗位描述生成，用于辅助优化简历，不代表招聘方实际筛选规则。
      </p>
    </div>
  );
};

export default ResumeAnalysisReportView;
