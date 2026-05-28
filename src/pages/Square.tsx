import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Empty, Input, Modal, Popconfirm, Select, Tag } from "antd";
import { useHistory } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";
import { downloadDirect } from "@utils/helper";
import { renderViewStyle } from "@src/utils/global";
import { useStores } from "@src/store";
import { LOCAL_STORE, themes } from "@src/utils/const";
import { getTheme } from "@utils/changeThemes";
import { TemplateItem, TemplateWithTheme } from "@src/types/template";
import "./Square.less";

const categoryLabels: Record<string, string> = {
  tech: "技术研发",
  product: "产品运营",
  design: "设计创意",
  data: "数据分析",
  student: "应届生",
  general: "通用模板",
};

const Square = () => {
  const [list, setList] = useState<TemplateWithTheme[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [template, setTemplate] = useState<TemplateWithTheme | null>(null);
  const { templateStore, globalStore: { setCurTab } } = useStores();
  const { setColor, setMdContent, setTheme } = templateStore;
  const history = useHistory();

  const handleCancel = useCallback(() => {
    setTemplate(null);
  }, []);

  const handleUse = useCallback(() => {
    if (!template) return;
    const { theme, themeColor, template: md } = template;
    setTheme(theme);
    localStorage.setItem(LOCAL_STORE.MD_THEME, theme);
    setColor(themeColor);
    localStorage.setItem(LOCAL_STORE.MD_COLOR, themeColor);
    setMdContent(md);
    localStorage.setItem(LOCAL_STORE.MD_RESUME, md);
    history.push("/editor");
    setCurTab("/editor");

    setTimeout(async () => {
      templateStore.editorRef?.setValue(md);
      await getTheme(theme);
      document.body.style.setProperty("--bg", themeColor);
      renderViewStyle(themeColor, md);
    }, 300);
  }, [history, setColor, setCurTab, setMdContent, setTheme, template, templateStore]);

  useEffect(() => {
    const queryTemplate = async () => {
      const result = await axios.get<TemplateItem[]>("/data/template.json");
      const resultList = result.data.map((item) => ({
        ...item,
        themeColor:
          themes.find((theme) => item.theme === theme.id)?.defaultColor ||
          themes[0].defaultColor,
      }));
      setList(resultList);
    };
    queryTemplate();
  }, []);

  const categories = useMemo(() => {
    const values = Array.from(new Set(list.map((item) => item.category)));
    return values.filter(Boolean);
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
        ...(item.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return matchCategory && (!lowerKeyword || searchText.includes(lowerKeyword));
    });
  }, [category, keyword, list]);

  const recommendedList = filteredList.filter((item) => item.recommended);
  const normalList = filteredList.filter((item) => !item.recommended);
  const displayList = [...recommendedList, ...normalList];

  return (
    <div className="rs-square-page">
      <div className="square-hero">
        <div>
          <h1>模板中心</h1>
          <p>按岗位和经验阶段选择模板，套用后继续在编辑器里调整内容和主题。</p>
        </div>
        <Button type="primary" onClick={() => history.push("/editor")}>
          返回编辑器
        </Button>
      </div>

      <div className="square-toolbar">
        <Input.Search
          allowClear
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索岗位、标签或模板名称"
        />
        <Select value={category} onChange={setCategory}>
          <Select.Option value="all">全部分类</Select.Option>
          {categories.map((item) => (
            <Select.Option value={item} key={item}>
              {categoryLabels[item] || item}
            </Select.Option>
          ))}
        </Select>
      </div>

      {displayList.length ? (
        <div className="rs-square-container">
          {displayList.map((item) => {
            return (
              <div className="rs-square" key={item.id}>
                {item.recommended && <span className="rs-square__badge">推荐</span>}
                <div className="rs-square__thumb">
                  <img src={item.thumbnail} alt={item.title} />
                </div>
                <div className="rs-square__body">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="rs-square__tags">
                    <Tag color={item.themeColor}>{categoryLabels[item.category] || item.category}</Tag>
                    <Tag>{item.level}</Tag>
                  </div>
                </div>
                <div className="rs-square__footer">
                  <Button size="small" onClick={() => setTemplate(item)}>
                    查看模板
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty description="没有找到匹配模板" />
      )}

      {template && (
        <Modal
          bodyStyle={{ backgroundColor: "#fafafb" }}
          title={template.title}
          visible={!!template}
          width={760}
          onCancel={handleCancel}
          footer={
            <div className="square-footer">
              <Button
                onClick={() => {
                  const file = new Blob([template.template]);
                  const url = URL.createObjectURL(file);
                  downloadDirect(url, `${template.title}.md`);
                }}
              >
                下载 md
              </Button>
              <Popconfirm
                title="确定使用此模板替换当前编辑器内容吗？"
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
              <img src={template.thumbnail} alt={template.title} />
            </div>
            <div className="square-modal-right">
              <div className="top-info">
                <img src={template.avatar} alt={template.author} />
                <div className="top-info-content">
                  <span className="info-text">作者：{template.author}</span>
                  <span className="info-text">
                    更新时间：{dayjs(template.updateTime).format("YYYY-MM-DD")}
                  </span>
                </div>
              </div>
              <p className="template-description">{template.description}</p>
              <div className="top-list">
                <span className="info-text">
                  <span className="text">岗位方向</span>
                  <span className="value">{template.role}</span>
                </span>
                <span className="info-text">
                  <span className="text">主题</span>
                  <span className="value">{template.theme}</span>
                </span>
                <span className="info-text">
                  <span className="text">收藏</span>
                  <span className="value">{template.collect}+</span>
                </span>
              </div>
              <div className="template-tags">
                {template.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Square;
