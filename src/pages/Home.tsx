import React from "react";
import { Link } from "react-router-dom";
import "./Home.less";

const capabilityItems = [
  "Markdown Powered",
  "ATS Friendly",
  "Real-time Preview",
  "Export to PDF",
];

const Home: React.FC = () => {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <h1>
            <span>用 Markdown</span>
            <span>快速完成专业简历</span>
          </h1>
          <p>
            专注内容，实时预览，选择模板后直接导出。把简历写作收束成一个清晰、稳定、可投递的工作流。
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
          <div className="home-resume-layer home-resume-layer--back" />
          <div className="home-resume-layer home-resume-layer--middle" />
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
                7 年前端工程经验，长期负责复杂编辑器、数据密集型 SaaS 产品和设计系统建设。
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
                  推进编辑体验、页面性能与组件体系治理，将核心页面首屏加载时间降低 38%。
                </p>
              </div>
              <div className="resume-entry">
                <div>
                  <strong>Northstar AI</strong>
                  <span>Frontend Engineer / 2018 - 2021</span>
                </div>
                <p>搭建模板渲染框架与通用组件库，支持 20+ 业务团队复用。</p>
              </div>
            </section>

            <section>
              <h3>项目经验</h3>
              <div className="resume-bullets">
                <span>Markdown 简历编辑器</span>
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

      <section className="home-capabilities" aria-label="产品能力">
        {capabilityItems.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </section>
    </main>
  );
};

export default Home;
