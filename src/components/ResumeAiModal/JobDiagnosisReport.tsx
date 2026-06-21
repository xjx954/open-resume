import React, { useMemo, useState } from "react";
import { Button, message, Modal, Tag } from "antd";
import {
  JobDiagnosisOptimizationIssue,
  JobDiagnosisOptimizationResult,
  JobDiagnosisReport,
  JobKeywordCategory,
} from "@src/types/ai";
import {
  isAiConfigError,
  loadAiConfig,
  runJobDiagnosisOptimization,
} from "@src/service/ai";
import DiagnosisOptimizationPanel from "./DiagnosisOptimizationPanel";

interface Props {
  report: JobDiagnosisReport;
  resumeMarkdown: string;
  jobDescription: string;
  onOpenSettings: () => void;
}

type DiagnosisAdviceItem = JobDiagnosisOptimizationIssue & {
  id: string;
};

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

function buildKeywordExample(keyword: string) {
  return `在项目或工作经历中补充“使用 ${keyword} 解决具体问题，并说明结果”的真实案例。`;
}

function buildAdviceItems(report: JobDiagnosisReport): DiagnosisAdviceItem[] {
  const keywordItems = report.prioritizedKeywords.map((item) => ({
    id: `keyword-${item.keyword}`,
    title: `缺少岗位关键词：${item.keyword}`,
    detail: item.reason,
    reason: item.reason,
    recommendation: "如果你确实具备相关经验，把关键词放入技能区，并在项目或工作经历中补充真实使用场景。",
    example: buildKeywordExample(item.keyword),
  }));

  const atsItems = report.atsIssues.map((issue) => ({
    id: `ats-${issue.id}-${issue.section}`,
    title: issue.title,
    detail: issue.detail,
    reason: issue.detail,
    recommendation: "优先修改会影响 ATS 解析、联系方式识别或经历完整性的内容。",
    example: "将问题内容改成清晰的文本描述，避免只依赖图片、复杂表格或模糊表达。",
  }));

  const suggestionItems = report.suggestions.map((item, index) => ({
    id: `suggestion-${index}-${item.title}`,
    title: item.title,
    detail: item.detail,
    reason: item.detail,
    recommendation: item.detail,
    example: "把建议落到某一段工作经历、项目经历或技能列表中，并使用真实项目、真实指标和真实职责。",
  }));

  const seen = new Set<string>();
  return [...keywordItems, ...atsItems, ...suggestionItems].filter((item) => {
    const key = `${item.title}-${item.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to a temporary textarea for browsers without clipboard permission.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error("复制失败，请手动选择文本复制。");
  }
}

const JobDiagnosisReportView: React.FC<Props> = ({
  report,
  resumeMarkdown,
  jobDescription,
  onOpenSettings,
}) => {
  const adviceItems = useMemo(() => buildAdviceItems(report), [report]);
  const [expandedAdviceId, setExpandedAdviceId] = useState<string | null>(null);
  const [loadingAdviceId, setLoadingAdviceId] = useState<string | null>(null);
  const [generationCounts, setGenerationCounts] = useState<Record<string, number>>({});
  const [optimization, setOptimization] = useState<{
    issue: DiagnosisAdviceItem;
    result: JobDiagnosisOptimizationResult;
  } | null>(null);
  const hasJobKeywords = report.matchedKeywords.length > 0 || report.missingKeywords.length > 0;
  const metricItems = [
    ["总体匹配分", hasJobKeywords ? report.overallMatchScore : "未提供"],
    ["ATS 分", report.atsScore],
    ["关键词覆盖率", hasJobKeywords ? formatPercent(report.keywordCoverage) : "未提供"],
    ["技能覆盖率", hasJobKeywords && (report.matchedSkills.length || report.missingSkills.length) ? formatPercent(report.skillCoverage) : "未提供"],
  ];

  const runOptimization = async (issue: DiagnosisAdviceItem) => {
    const nextGeneration = (generationCounts[issue.id] || 0) + 1;
    setLoadingAdviceId(issue.id);
    try {
      const result = await runJobDiagnosisOptimization({
        resumeMarkdown,
        jobDescription,
        issue,
        generationIndex: nextGeneration,
        config: loadAiConfig(),
      });
      setGenerationCounts((prev) => ({ ...prev, [issue.id]: nextGeneration }));
      setOptimization({ issue, result });
      message.success("AI 优化版本已生成");
    } catch (e: any) {
      if (isAiConfigError(e)) {
        Modal.confirm({
          title: "请先配置 AI 服务",
          content: "按向导选择服务商并粘贴 API Key，测试连接成功后即可使用 AI 优化建议。",
          okText: "打开设置",
          cancelText: "稍后再说",
          onOk: onOpenSettings,
        });
      } else {
        message.error(e?.message || "AI 请求失败，请检查配置后重试。");
      }
    } finally {
      setLoadingAdviceId(null);
    }
  };

  const copyOptimization = async () => {
    if (!optimization) return;
    try {
      await copyTextToClipboard(optimization.result.optimizedContent);
      message.success("已复制优化版本");
    } catch (e: any) {
      message.error(e?.message || "复制失败，请手动选择文本复制。");
    }
  };

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

      <section className="analysis-card">
        <h3>评分构成</h3>
        <div className="score-breakdown">
          {report.scoreBreakdown.map((item) => (
            <article className="score-breakdown__item" key={item.key}>
              <div className="score-breakdown__head">
                <strong>{item.label}</strong>
                <span>{item.counted ? `${item.score}/${item.maxScore}` : "未计入"}</span>
              </div>
              <div className="score-breakdown__bar">
                <i style={{ width: item.counted ? `${Math.round((item.score / item.maxScore) * 100)}%` : "0%" }} />
              </div>
              <p>{item.reason}</p>
            </article>
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

      <section className="analysis-card">
        <h3>优化建议卡片</h3>
        {adviceItems.length ? (
          <div className="diagnosis-advice-list">
            {adviceItems.map((item) => {
              const expanded = expandedAdviceId === item.id;
              const isLoading = loadingAdviceId === item.id;
              const isActiveOptimization = optimization?.issue.id === item.id;
              return (
                <article className="diagnosis-advice" key={item.id}>
                  <div className="diagnosis-advice__head">
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                    <Button
                      size="small"
                      onClick={() => setExpandedAdviceId(expanded ? null : item.id)}
                    >
                      查看优化建议
                    </Button>
                  </div>
                  {expanded ? (
                    <div className="diagnosis-advice__details">
                      <div>
                        <span>问题原因</span>
                        <p>{item.reason}</p>
                      </div>
                      <div>
                        <span>推荐修改方式</span>
                        <p>{item.recommendation}</p>
                      </div>
                      <div>
                        <span>示例写法</span>
                        <p>{item.example}</p>
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        loading={isLoading}
                        onClick={() => runOptimization(item)}
                      >
                        使用 AI 生成优化版本
                      </Button>
                    </div>
                  ) : null}
                  {isActiveOptimization && optimization ? (
                    <DiagnosisOptimizationPanel
                      issue={optimization.issue}
                      result={optimization.result}
                      loading={isLoading}
                      onCopy={copyOptimization}
                      onRegenerate={() => runOptimization(item)}
                      onClose={() => setOptimization(null)}
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="analysis-empty">暂无需要展开处理的优化建议。</p>
        )}
      </section>

      <p className="analysis-disclaimer">
        本诊断由本地规则引擎生成，合并 ATS 检查与 JD 匹配结果，未调用 AI。
      </p>
    </div>
  );
};

export default JobDiagnosisReportView;
