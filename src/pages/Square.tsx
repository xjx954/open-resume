import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Empty, Input, Modal, Popconfirm, Tag } from "antd";
import { DownloadOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { downloadDirect } from "@utils/helper";
import { useStores } from "@src/store";
import { themes } from "@src/utils/const";
import { TemplateItem, TemplateWithTheme } from "@src/types/template";
import TemplatePreview from "@src/components/TemplatePreview";
import "./Square.less";

const categoryLabels: Record<string, string> = {
  tech: "技术研发",
  product: "产品运营",
  design: "设计创意",
  data: "数据分析",
  student: "学生校招",
  general: "通用正式",
};

const filterLabels: Record<string, string> = {
  all: "全部",
  tech: "技术",
  student: "学生/科研",
  general: "通用/正式",
};

const Square = () => {
  const [list, setList] = useState<TemplateWithTheme[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [template, setTemplate] = useState<TemplateWithTheme | null>(null);
  const [fullscreenTemplate, setFullscreenTemplate] = useState<TemplateWithTheme | null>(null);
  const [loadError, setLoadError] = useState("");
  const { templateStore, globalStore: { setCurTab } } = useStores();
  const { setColor, setMdContent, setTheme } = templateStore;
  const history = useHistory();

  const applyTemplate = useCallback((nextTemplate: TemplateWithTheme) => {
    const { theme, themeColor, template: md } = nextTemplate;
    setTheme(theme);
    setColor(themeColor);
    setMdContent(md);
    templateStore.markSaved();
    history.push("/editor");
    setCurTab("/editor");
  }, [history, setColor, setCurTab, setMdContent, setTheme, templateStore]);

  const handleUse = useCallback(() => {
    if (!template) return;
    applyTemplate(template);
  }, [applyTemplate, template]);

  const downloadMarkdown = useCallback((item: TemplateWithTheme) => {
    const file = new Blob([item.template]);
    const url = URL.createObjectURL(file);
    downloadDirect(url, `${item.title}.md`);
  }, []);

  useEffect(() => {
    const queryTemplate = async () => {
      try {
        setLoadError("");
        const result = await axios.get<TemplateItem[]>("/data/template.json");
        const resultList = result.data.map((item) => ({
          ...item,
          themeColor:
            themes.find((theme) => item.theme === theme.id)?.defaultColor ||
            themes[0].defaultColor,
        }));
        setList(resultList.sort((a, b) => a.previewPriority - b.previewPriority));
      } catch {
        setLoadError("模板加载失败，请检查网络后重试。");
      }
    };
    queryTemplate();
  }, []);

  const categories = useMemo(() => {
    const values = Array.from(new Set(list.map((item) => item.category)));
    return ["all", ...values.filter(Boolean)];
  }, [list]);

  const filteredList = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();
    return list.filter((item) => {
      const matchCategory = category === "all" || item.category === category;
      const searchText = [
        item.title,
        item.role,
        item.description,
        item.category,
        item.audience,
        ...(item.tags || []),
        ...(item.bestFor || []),
        ...(item.scenarios || []),
      ]
        .join(" ")
        .toLowerCase();
      return matchCategory && (!lowerKeyword || searchText.includes(lowerKeyword));
    });
  }, [category, keyword, list]);

  const featuredList = useMemo(
    () => list.filter((item) => item.featured).slice(0, 3),
    [list]
  );

  return (
    <div className="rs-square-page">
      <section className="square-hero">
        <div className="square-hero__copy">
          <h1>选择一份可以直接投递的简历模板</h1>
          <p>少量精选模板，真实简历预览。先选结构，再进入编辑器改内容。</p>
        </div>
        <Button type="primary" onClick={() => history.push("/editor")}>
          返回编辑器
        </Button>
      </section>

      <section className="square-section square-section--featured">
        <div className="square-section__header">
          <div>
            <h2>精选模板</h2>
            <p>优先打磨的 3 个模板，覆盖通用、互联网技术岗和中文正式场景。</p>
          </div>
        </div>
        <div className="featured-grid">
          {featuredList.map((item) => (
            <article className={`featured-card featured-card--${item.theme}`} key={item.id}>
              <div className="featured-card__preview">
                <TemplatePreview
                  title={`${item.title}预览`}
                  markdown={item.template}
                  theme={item.theme}
                  themeColor={item.themeColor}
                  scale={0.31}
                  mode="thumb"
                />
              </div>
              <div className="featured-card__body">
                <div className="featured-card__meta">
                  <Tag color={item.themeColor}>精选</Tag>
                  <span>{categoryLabels[item.category] || item.category}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="featured-card__actions">
                  <Button onClick={() => setTemplate(item)} icon={<EyeOutlined />}>
                    预览模板
                  </Button>
                  <Popconfirm
                    title="此操作会覆盖当前编辑器内容。若刚做过手动修改，请先导出或确认已保留历史记录。确定继续吗？"
                    onConfirm={() => applyTemplate(item)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="primary">使用模板</Button>
                  </Popconfirm>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="square-section">
        <div className="square-section__header square-section__header--toolbar">
          <div>
            <h2>全部模板</h2>
            <p>只保留 5 个精品模板，按内容结构适配不同投递场景。</p>
          </div>
          <div className="square-search">
            <SearchOutlined />
            <Input
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索岗位、标签或模板名称"
            />
          </div>
        </div>

        <div className="square-filter" role="tablist" aria-label="模板分类">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {filterLabels[item] || categoryLabels[item] || item}
            </button>
          ))}
        </div>

        {loadError ? (
          <Alert type="error" showIcon message={loadError} />
        ) : filteredList.length ? (
          <div className="rs-square-container">
            {filteredList.map((item) => (
              <article className={`rs-square rs-square--${item.theme}`} key={item.id}>
                {item.recommended && <span className="rs-square__badge">推荐</span>}
                <div className="rs-square__thumb">
                  <TemplatePreview
                    title={`${item.title}缩略预览`}
                    markdown={item.template}
                    theme={item.theme}
                    themeColor={item.themeColor}
                    scale={0.22}
                    lazy={!item.featured}
                    mode="thumb"
                  />
                </div>
                <div className="rs-square__body">
                  <div className="rs-square__eyebrow">{item.role}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="rs-square__tags">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>
                <div className="rs-square__overlay">
                  <Button onClick={() => setTemplate(item)} icon={<EyeOutlined />}>
                    预览模板
                  </Button>
                  <Popconfirm
                    title="此操作会覆盖当前编辑器内容。若刚做过手动修改，请先导出或确认已保留历史记录。确定继续吗？"
                    onConfirm={() => applyTemplate(item)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="primary">使用模板</Button>
                  </Popconfirm>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty description="没有找到匹配模板" />
        )}
      </section>

      {template && (
        <Modal
          className="square-preview-modal"
          visible={!!template}
          width={1120}
          onCancel={() => setTemplate(null)}
          footer={
            <div className="square-footer">
              <Button
                icon={<DownloadOutlined />}
                onClick={() => downloadMarkdown(template)}
              >
                下载 md
              </Button>
              <Button onClick={() => setFullscreenTemplate(template)} icon={<EyeOutlined />}>
                预览全屏
              </Button>
              <Popconfirm
                title="此操作会覆盖当前编辑器内容。若刚做过手动修改，请先导出或确认已保留历史记录。确定继续吗？"
                onConfirm={handleUse}
                okText="确定"
                cancelText="取消"
              >
                <Button type="primary">使用模板</Button>
              </Popconfirm>
            </div>
          }
        >
          <div className="square-modal">
            <div className="square-modal-left">
              <TemplatePreview
                title={`${template.title}完整预览`}
                markdown={template.template}
                theme={template.theme}
                themeColor={template.themeColor}
                scale={0.72}
                mode="modal"
              />
            </div>
            <aside className="square-modal-right">
              <span className="square-modal__label">模板预览</span>
              <h2>{template.title}</h2>
              <p>{template.description}</p>
              <div className="square-modal__section">
                <h3>适合岗位</h3>
                <div className="template-chip-list">
                  {template.bestFor.map((item) => <Tag key={item}>{item}</Tag>)}
                </div>
              </div>
              <div className="square-modal__section">
                <h3>适合人群</h3>
                <p>{template.audience}</p>
              </div>
              <div className="square-modal__section">
                <h3>推荐场景</h3>
                <ul>
                  {template.scenarios.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="square-modal__section">
                <h3>模板特点</h3>
                <ul>
                  {template.features.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </aside>
          </div>
        </Modal>
      )}

      {fullscreenTemplate && (
        <Modal
          className="square-fullscreen-modal"
          visible={!!fullscreenTemplate}
          footer={null}
          width="96vw"
          onCancel={() => setFullscreenTemplate(null)}
        >
          <TemplatePreview
            title={`${fullscreenTemplate.title}全屏预览`}
            markdown={fullscreenTemplate.template}
            theme={fullscreenTemplate.theme}
            themeColor={fullscreenTemplate.themeColor}
            scale={1}
            mode="fullscreen"
          />
        </Modal>
      )}
    </div>
  );
};

export default Square;
