import React from "react";
import { Link } from "react-router-dom";
import { themes } from "@utils/const";
import "./Home.less";

const trustItems = [
  "100% 本地编辑",
  "Markdown Powered",
  "Real-time Preview",
  "ATS Friendly",
  "Export to PDF",
];

const features = [
  {
    icon: "MD",
    title: "Markdown 驱动",
    description: "用稳定的纯文本管理简历内容，导入、导出和版本保存都更清晰。",
  },
  {
    icon: "RT",
    title: "实时预览",
    description: "左侧编辑内容，右侧同步渲染成最终简历，排版效果随时可见。",
  },
  {
    icon: "ATS",
    title: "ATS 兼容",
    description: "保持清楚的信息结构，减少花哨样式对招聘筛选系统的干扰。",
  },
  {
    icon: "AI",
    title: "AI 优化建议",
    description: "辅助润色表达、量化经历、匹配 JD，并补全关键岗位词。",
  },
  {
    icon: "PDF",
    title: "一键导出 PDF",
    description: "保留主题样式和页面结构，快速生成可直接投递的 PDF 文件。",
  },
  {
    icon: "UI",
    title: "多模板切换",
    description: "同一份内容快速切换不同视觉风格，适配技术、产品和校招场景。",
  },
];

const templateScenes = [
  {
    title: "技术工程师",
    role: "清晰呈现项目、技术栈和影响结果",
    themeId: "default",
  },
  {
    title: "产品与运营",
    role: "突出业务指标、协作经历和增长成果",
    themeId: "blue",
  },
  {
    title: "校招与实习",
    role: "强化教育背景、项目实践和潜力表达",
    themeId: "academic-blue",
  },
];

function getThemeThumb(themeId: string) {
  return themes.find((item) => item.id === themeId)?.src || themes[0].src;
}

const Home: React.FC = () => {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <h1>
            <span>用 Markdown 和 AI，</span>
            <span>写出可直接投递的专业简历</span>
          </h1>
          <p>
            专注内容，实时预览排版效果。支持模板切换、AI 润色、ATS
            关键词优化和一键导出 PDF。
          </p>
          <div className="home-hero__actions">
            <Link className="home-btn home-btn--primary" to="/editor">
              立即开始
            </Link>
            <Link className="home-btn home-btn--secondary" to="/square">
              查看模板
            </Link>
          </div>
        </div>

        <div className="home-hero__visual" aria-label="简历预览示意">
          <div className="home-resume-shadow home-resume-shadow--one" />
          <div className="home-resume-shadow home-resume-shadow--two" />
          <article className="home-resume-card">
            <header className="home-resume-card__header">
              <div>
                <strong>林一帆</strong>
                <span>Senior Frontend Engineer</span>
              </div>
              <ul>
                <li>lin@example.com</li>
                <li>github.com/lin</li>
                <li>Shanghai</li>
              </ul>
            </header>
            <section>
              <h3>个人优势</h3>
              <p>
                7 年前端工程经验，擅长复杂编辑器、数据密集型 SaaS
                产品和工程化体系建设。
              </p>
            </section>
            <section>
              <h3>工作经历</h3>
              <div className="resume-entry">
                <div>
                  <strong>Linear Cloud</strong>
                  <span>Frontend Lead / 2021 - Now</span>
                </div>
                <p>
                  负责设计系统、协作编辑与性能治理，将核心页面首屏加载时间降低
                  38%。
                </p>
              </div>
              <div className="resume-entry">
                <div>
                  <strong>Northstar AI</strong>
                  <span>Frontend Engineer / 2018 - 2021</span>
                </div>
                <p>搭建组件库与模板渲染框架，支持 20+ 业务团队复用。</p>
              </div>
            </section>
            <section>
              <h3>项目经历</h3>
              <div className="resume-bullets">
                <span>Markdown 编辑器</span>
                <span>实时 PDF 预览</span>
                <span>ATS 关键词优化</span>
              </div>
            </section>
            <footer>
              <span>React</span>
              <span>TypeScript</span>
              <span>Design System</span>
            </footer>
          </article>
        </div>
      </section>

      <section className="home-trust" aria-label="产品能力">
        {trustItems.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </section>

      <section className="home-section home-section--features">
        <div className="home-section__header">
          <h2>把简历写作变成稳定的工作流</h2>
          <p>从内容编辑、实时预览到模板切换和 PDF 导出，保持简洁但完整。</p>
        </div>
        <div className="home-feature-grid">
          {features.map((item) => (
            <article className="home-feature" key={item.title}>
              <span className="home-feature__icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-section--templates">
        <div className="home-section__header home-section__header--split">
          <div>
            <h2>像模板市场，而不是占位图库</h2>
            <p>选择一个接近目标岗位的结构，再把内容改成你的经历。</p>
          </div>
          <Link className="home-section__link" to="/square">
            查看全部模板
          </Link>
        </div>
        <div className="home-template-grid">
          {templateScenes.map((item) => (
            <Link className="home-template" to="/square" key={item.title}>
              <div className="home-template__preview">
                <img src={getThemeThumb(item.themeId)} alt={item.title} />
                <div className="home-template__paper">
                  <strong>{item.title}</strong>
                  <span />
                  <span />
                  <em />
                  <span />
                  <span />
                </div>
              </div>
              <div className="home-template__body">
                <strong>{item.title}</strong>
                <p>{item.role}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-final">
        <h2>从一份清楚的内容开始，生成一份专业的简历。</h2>
        <Link className="home-btn home-btn--primary" to="/editor">
          立即开始
        </Link>
      </section>
    </main>
  );
};

export default Home;
