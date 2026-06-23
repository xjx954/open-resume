import React from "react";
import { Link } from "react-router-dom";
import "./Home.less";

const capabilityItems = [
  {
    title: "求职诊断",
    description: "检查 ATS 风险、经历完整性和量化成果。",
  },
  {
    title: "JD 匹配",
    description: "识别命中关键词、缺失关键词和技能覆盖。",
  },
  {
    title: "可解释评分",
    description: "展示每个分数的来源和扣分原因。",
  },
  {
    title: "AI 优化建议",
    description: "针对具体问题生成优化版本，不自动覆盖。",
  },
];

const missingKeywords = ["React Query", "可观测性", "A/B Test", "性能指标"];

const workflowItems = [
  {
    title: "编辑简历",
    description: "用 Blocks 或 Markdown 整理经历、项目和技能。",
  },
  {
    title: "粘贴 JD",
    description: "放入目标岗位描述，作为匹配和关键词分析依据。",
  },
  {
    title: "生成诊断",
    description: "查看 ATS 分、匹配分、缺失关键词和经历完整性。",
  },
  {
    title: "AI 优化",
    description: "针对具体问题生成优化版本，不自动覆盖原文。",
  },
  {
    title: "导出 PDF",
    description: "确认内容后选择模板，导出可投递的 PDF 简历。",
  },
];

const Home: React.FC = () => {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">ATS 检查 · JD 匹配 · AI 优化</p>
          <h1>
            <span>诊断简历问题，</span>
            <span>匹配目标岗位</span>
          </h1>
          <p>
            粘贴目标岗位 JD，检查 ATS 风险、关键词覆盖、技能匹配和经历完整性，
            获得可解释评分与 AI 优化建议。本地诊断无需 API Key，AI 只在你主动使用时调用。
          </p>
          <div className="home-hero__actions">
            <Link className="home-btn home-btn--primary" to="/editor">
              开始诊断简历
            </Link>
            <Link className="home-btn home-btn--secondary" to="/square">
              查看模板
            </Link>
          </div>
        </div>

        <div className="home-hero__visual" aria-label="求职诊断报告示意">
          <div className="home-diagnosis-layer home-diagnosis-layer--back" />
          <div className="home-diagnosis-layer home-diagnosis-layer--middle" />
          <article className="home-diagnosis-card">
            <header className="home-diagnosis-card__header">
              <div>
                <span>求职诊断报告</span>
                <strong>前端工程师 · JD 匹配</strong>
              </div>
              <em>示例</em>
            </header>

            <section className="home-score-grid" aria-label="诊断指标">
              <div className="home-score-card home-score-card--primary">
                <span>总体匹配分</span>
                <strong>78</strong>
                <small>建议优先补齐项目关键词</small>
              </div>
              <div className="home-score-card">
                <span>ATS 分</span>
                <strong>86</strong>
                <small>结构清晰，风险较低</small>
              </div>
              <div className="home-score-card">
                <span>关键词覆盖率</span>
                <strong>62%</strong>
                <small>命中 13 / 21</small>
              </div>
              <div className="home-score-card">
                <span>技能覆盖率</span>
                <strong>70%</strong>
                <small>缺少 3 个核心技能</small>
              </div>
            </section>

            <section className="home-report-section">
              <div className="home-section-title">
                <span>缺失关键词</span>
                <small>高优先级</small>
              </div>
              <div className="home-keyword-list">
                {missingKeywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
            </section>

            <section className="home-report-section home-report-section--suggestions">
              <div className="home-section-title">
                <span>优化建议</span>
                <small>可用 AI 生成版本</small>
              </div>
              <div className="home-suggestion-list">
                <p>在项目经历中补充性能优化、指标结果和业务影响。</p>
                <p>将真实掌握的 JD 技能放入技能区，并在经历中给出使用场景。</p>
                <p>增加量化成果，避免只描述“负责”或“参与”。</p>
              </div>
            </section>
          </article>
        </div>
      </section>

      <section className="home-capabilities" aria-label="产品能力">
        {capabilityItems.map((item) => (
          <article key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </article>
        ))}
      </section>

      <section className="home-optimization" aria-label="AI 优化前后对比">
        <div className="home-section-heading">
          <span>AI 优化示例</span>
          <h2>不是泛泛润色，而是针对诊断问题改写</h2>
          <p>示例只用于说明工作流，不会自动修改你的简历，也不会在首页调用 AI。</p>
        </div>
        <div className="home-compare">
          <article>
            <span>优化前</span>
            <p>负责系统测试工作，参与缺陷跟踪和上线验证。</p>
          </article>
          <article className="home-compare__after">
            <span>优化后</span>
            <p>
              负责招聘管理系统测试，设计并执行 300+ 条核心用例，推动修复 40+ 个缺陷，
              将回归测试覆盖率提升至 95%。
            </p>
          </article>
        </div>
      </section>

      <section className="home-workflow" aria-label="简历优化流程">
        <div className="home-section-heading home-section-heading--compact">
          <span>推荐流程</span>
          <h2>从编辑到投递前检查，一条路径完成</h2>
          <p>诊断本地运行；AI 优化只在你主动点击时发生。</p>
        </div>
        <ol>
          {workflowItems.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
};

export default Home;
