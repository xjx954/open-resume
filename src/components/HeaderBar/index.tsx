import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dropdown,
  Menu,
  message,
  Modal,
  Form,
  Switch,
  Input,
  FormInstance,
  Tag,
  Spin,
} from "antd";
import {
  SettingOutlined,
  FileTextOutlined,
  EyeOutlined,
  FilePdfOutlined,
  RobotOutlined,
  CheckCircleFilled,
  HistoryOutlined,
  SkinOutlined,
} from "@ant-design/icons";
import "./index.less";
import { getTheme } from "@utils/changeThemes";
import { downloadDirect, markdownParserArticle, sanitizeHtml } from "@utils/helper";
import { generatePdfBlob } from "@src/service/htmlToPdf";
import { printPdfFallback } from "@src/service/printPdf";
import { getCleanExportHtml, waitForResumeLayout } from "@src/service/pdfExportHtml";
import { useStores } from "@src/store";
import { updateTemplate, renderViewStyle, renderResumePreviewMode } from "@src/utils/global";
import { LOCAL_STORE, UPDATE_CONTENT, UPDATE_LOG_VERSION } from '@src/utils/const';
import { observer } from "mobx-react";
import { themes } from '@utils/const';
import Shortcuts from "@src/components/Shortcuts";
import History from "@src/components/History";
import ResumeAiModal from "@src/components/ResumeAiModal";
import AiSettingsModal from "@src/components/AiSettingsModal";
import ResumeImportModal from "@src/components/ResumeImportModal";

const is_update = +(localStorage.getItem(LOCAL_STORE.MD_UPDATE_LOG) || 0) >= UPDATE_LOG_VERSION ? false : true;

interface ExportFormValues {
  name: string;
  isMark: boolean;
  watermarkText?: string;
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeAxiosError = error as { response?: { data?: { message?: string } }; message?: string };
    return maybeAxiosError.response?.data?.message || maybeAxiosError.message || '未知错误';
  }
  return '未知错误';
}

const HeaderBar = observer(() => {
  const { templateStore } = useStores();
  const { setTempTheme, tempTheme, theme, color, setColor, setTheme, setPreview, mdContent, isPreview } = templateStore;
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [isUpdateVisible, setIsUpdateVisible] = useState(is_update);
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [isAiVisible, setIsAiVisible] = useState(false);
  const [isAiSettingsVisible, setIsAiSettingsVisible] = useState(false);
  const [shortcutsVisible, setShortcutsVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);

  const formRef = useRef<FormInstance>(null);
  const templateListRef = useRef<HTMLDivElement>(null);

  const currentTheme = themes.find(t => t.id === theme);
  const resumeName = useMemo(() => {
    const header = templateStore.blocks.find(block => block.type === 'header');
    const name = header?.type === 'header' ? header.data.name?.trim() : '';
    return name ? `${name}简历` : '未命名简历';
  }, [templateStore.blocks]);

  const handleOk = async () => {
    setIsThemeLoading(true);
    try {
      await updateTemplate(tempTheme, setColor, mdContent);
      setTheme(tempTheme);
      setIsTemplateModalVisible(false);
    } finally {
      setIsThemeLoading(false);
    }
  };

  const applyImportedMarkdown = useCallback((nextContent: string) => {
    templateStore.setMdContent(nextContent);
    templateStore.editorRef?.setValue(nextContent);
    setPreview(false);
    renderViewStyle(color, nextContent);
    setImportVisible(false);
    message.success("导入旧简历成功");
  }, [color, setPreview, templateStore]);

  const exportMdFile = useCallback(() => {
    const file = new Blob([mdContent]);
    const url = URL.createObjectURL(file);
    downloadDirect(url, "resume.md");
  }, [mdContent]);

  const scrollTemplates = (direction: "left" | "right") => {
    const el = templateListRef.current;
    if (!el) return;
    const distance = Math.max(el.clientWidth - 120, 300);
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  const handleExport = async () => {
    try {
      const values = await formRef.current?.validateFields();
      if (values) {
        setIsExportVisible(false);
        exportPdf(values as ExportFormValues);
      }
    } catch {
      // validation failed — keep modal open
    }
  };

  const applyAiResult = (content: string, mode: "insert" | "replace") => {
    const editor = templateStore.editorRef;
    const currentContent = editor?.getValue() || mdContent;
    const nextContent = mode === "replace" ? content : `${currentContent}\n\n${content}`;

    if (mode === "insert" && editor?.replaceRange && editor?.getCursor) {
      editor.replaceRange(`\n\n${content}`, editor.getCursor());
      const insertedContent = editor.getValue();
      templateStore.setMdContent(insertedContent);
      renderViewStyle(color, insertedContent);
    } else {
      editor?.setValue(nextContent);
      templateStore.setMdContent(nextContent);
      renderViewStyle(color, nextContent);
    }
    setPreview(false);
  };

  const exportPdf = async ({
    name,
    isMark,
    watermarkText,
  }: ExportFormValues) => {
    await waitForResumeLayout();
    const content = localStorage.getItem(LOCAL_STORE.MD_RESUME);

    if (content) {
      const htmlContent = getCleanExportHtml(document.querySelector('.resume-pages'));
      let hide = message.loading("正在为你生成简历...", 0);
      const themeColor = getComputedStyle(document.body).getPropertyValue("--bg").trim() || color;
      const isOnePage = templateStore.pdfLayoutMode === 'smart-one-page' && templateStore.pdfCanFitOnePage;
      if (templateStore.pdfLayoutMode === 'smart-one-page' && !templateStore.pdfCanFitOnePage) {
        message.warning('当前内容较多，建议使用两页简历或精简内容。');
      }
      try {
        const blobUrl = await generatePdfBlob({
          htmlContent,
          theme,
          themeColor,
          isMark,
          watermarkText,
          isOnePage,
        });
        downloadDirect(blobUrl, name ? `${name}.pdf` : "resume.pdf");
        hide();
        message.success("恭喜你，导出成功!");
      } catch (e: unknown) {
        hide();
        const errMsg = getErrorMessage(e);
        console.error('PDF export failed:', e);
        try {
          printPdfFallback({
            htmlContent,
            themeColor,
            isMark,
            watermarkText,
            isOnePage,
          });
          message.warning(`PDF 服务不可用，已切换到浏览器打印: ${errMsg}`);
        } catch (fallbackError: unknown) {
          message.error(`生成简历出错: ${getErrorMessage(fallbackError)}`);
        }
      }
    }
  };

  const togglePreview = useCallback(() => {
    const nextPreview = !isPreview;
    renderResumePreviewMode(nextPreview, color, mdContent);
    setPreview(nextPreview);
    message.success(nextPreview ? '预览模式' : '编辑模式');
  }, [color, isPreview, mdContent, setPreview]);

  useEffect(() => {
    getTheme(theme);
  }, [theme]);

  useEffect(() => {
    const openExport = () => setIsExportVisible(true);
    window.addEventListener('open-resume:export-pdf', openExport);
    return () => window.removeEventListener('open-resume:export-pdf', openExport);
  }, []);

  useEffect(() => {
    const openAiSettings = () => setIsAiSettingsVisible(true);
    window.addEventListener('open-resume:ai-settings', openAiSettings);
    return () => window.removeEventListener('open-resume:ai-settings', openAiSettings);
  }, []);

  // ------ Overflow menu (File, Shortcuts, AI settings) ------

  const overflowMenu = (
    <Menu className="header-overflow-menu">
      <Menu.ItemGroup title="文件">
        <Menu.Item key="import-md" onClick={() => setImportVisible(true)}>
          <FileTextOutlined style={{ marginRight: 8 }} />导入旧简历
        </Menu.Item>
        <Menu.Item key="export-md" onClick={exportMdFile}>
          <FileTextOutlined style={{ marginRight: 8 }} />导出 Markdown
        </Menu.Item>
      </Menu.ItemGroup>
      <Menu.Divider />
      <Menu.Item key="shortcuts" onClick={() => setShortcutsVisible(true)}>
        icon快捷键
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="ai-settings" onClick={() => setIsAiSettingsVisible(true)}>
        <SettingOutlined style={{ marginRight: 8 }} />AI 服务配置
      </Menu.Item>
    </Menu>
  );

  // ------ Template browser content ------

  const templateContent = (
    <div className="template-browser">
      <button
        className="template-nav template-nav--left"
        type="button"
        aria-label="向左查看更多模板"
        onClick={() => scrollTemplates("left")}
      >
        ‹
      </button>
      <div className="template-viewport" ref={templateListRef}>
        <div className="template-wrapper">
          {themes.map((item) => {
            return (
              <div
                className={`template ${item.id === tempTheme ? "active" : ""}`}
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  setTempTheme(item.id);
                }}
              >
                <img className="template-img" src={item.src} alt={item.name} />
                <p className="template-title">{item.name}
                  {item.isColor && <Tag color="#2db7f5">可换色</Tag>}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <button
        className="template-nav template-nav--right"
        type="button"
        aria-label="向右查看更多模板"
        onClick={() => scrollTemplates("right")}
      >
        ›
      </button>
    </div>
  );

  return (
    <div className="rs-editor-toolbar">
      {/* —— Left: Logo + resume name —— */}
      <div className="rs-editor-toolbar__left">
        <img
          className="rs-editor-toolbar__logo"
          src="/images/app-logo.svg"
          alt="Open Resume"
        />
        <div className="rs-editor-toolbar__doc-info">
          <span className="rs-editor-toolbar__doc-name">{resumeName}</span>
          <span className="rs-editor-toolbar__doc-ext">.md</span>
        </div>
      </div>

      {/* —— Center: Template + save status —— */}
      <div className="rs-editor-toolbar__center">
        {currentTheme && (
          <span className="rs-editor-toolbar__theme-badge">
            {currentTheme.name}
          </span>
        )}
        <span className="rs-editor-toolbar__save-status">
          <CheckCircleFilled style={{ fontSize: 10, color: '#22c55e' }} />
          已保存
        </span>
      </div>

      {/* —— Right: Action buttons —— */}
      <div className="rs-editor-toolbar__right">
        <button
          type="button"
          className="rs-editor-toolbar__btn rs-editor-toolbar__btn--ghost"
          onClick={() => setIsAiVisible(true)}
        >
          <RobotOutlined />
          <span>AI 助手</span>
        </button>

        <button
          type="button"
          className={`rs-editor-toolbar__btn rs-editor-toolbar__btn--ghost ${isPreview ? 'rs-editor-toolbar__btn--active' : ''}`}
          onClick={togglePreview}
        >
          <EyeOutlined />
          <span>{isPreview ? '编辑' : '预览'}</span>
        </button>

        <button
          type="button"
          className="rs-editor-toolbar__btn rs-editor-toolbar__btn--ghost"
          onClick={() => setIsTemplateModalVisible(true)}
        >
          <SkinOutlined />
          <span>模板</span>
        </button>

        <button
          type="button"
          className="rs-editor-toolbar__btn rs-editor-toolbar__btn--ghost"
          onClick={() => setHistoryVisible(true)}
        >
          <HistoryOutlined />
          <span>历史</span>
        </button>

        <button
          type="button"
          className="rs-editor-toolbar__btn rs-editor-toolbar__btn--primary"
          onClick={() => setIsExportVisible(true)}
        >
          <FilePdfOutlined />
          <span>导出 PDF</span>
        </button>

        <Dropdown overlay={overflowMenu} trigger={["click"]} placement="bottomRight">
          <button
            type="button"
            className="rs-editor-toolbar__btn rs-editor-toolbar__btn--ghost"
          >
            <SettingOutlined />
            <span>更多</span>
          </button>
        </Dropdown>
      </div>

      {/* —— Modals —— */}

      <Modal
        title="请选择模板"
        visible={isTemplateModalVisible}
        onOk={handleOk}
        onCancel={() => {
          setTempTheme(theme);
          setIsTemplateModalVisible(false);
        }}
        cancelText="取消"
        okText="确定"
        width={1100}
        confirmLoading={isThemeLoading}
      >
        <Spin spinning={isThemeLoading}>
          {templateContent}
        </Spin>
      </Modal>

      <Modal
        title="更新日志"
        visible={isUpdateVisible}
        cancelText="取消"
        okText="确定"
        width={700}
        onOk={() => {
          localStorage.setItem(LOCAL_STORE.MD_UPDATE_LOG, `${UPDATE_LOG_VERSION}`);
          setIsUpdateVisible(false);
        }}
        onCancel={() => {
          localStorage.setItem(LOCAL_STORE.MD_UPDATE_LOG, `${UPDATE_LOG_VERSION}`);
          setIsUpdateVisible(false);
        }}
      >
        <div className="rs-article-container" dangerouslySetInnerHTML={{
          __html: sanitizeHtml(markdownParserArticle.render(UPDATE_CONTENT))
        }}></div>
      </Modal>

      {isExportVisible && (
        <Modal
          title="导出确认"
          visible={isExportVisible}
          onOk={handleExport}
          onCancel={() => setIsExportVisible(false)}
          cancelText="取消"
          okText="确认"
        >
          <Form
            ref={formRef}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 14 }}
            layout="horizontal"
            initialValues={{ isMark: true, watermarkText: 'Open Resume' }}
            onFinish={(values: ExportFormValues) => exportPdf(values)}
          >
            <Form.Item name="name" label="简历名称">
              <Input placeholder="不填则系统命名" />
            </Form.Item>
            <Form.Item name="isMark" label="添加水印" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="watermarkText" label="水印文字">
              <Input placeholder="Open Resume" />
            </Form.Item>
          </Form>
        </Modal>
      )}

      <ResumeAiModal
        visible={isAiVisible}
        markdown={templateStore.editorRef?.getValue() || mdContent}
        blockMode={!templateStore.editorRef}
        onCancel={() => setIsAiVisible(false)}
        onApply={applyAiResult}
        onOpenSettings={() => setIsAiSettingsVisible(true)}
      />
      <AiSettingsModal
        visible={isAiSettingsVisible}
        onCancel={() => setIsAiSettingsVisible(false)}
      />
      <ResumeImportModal
        visible={importVisible}
        onCancel={() => setImportVisible(false)}
        onConfirm={applyImportedMarkdown}
      />
      <Shortcuts visible={shortcutsVisible} onClose={() => setShortcutsVisible(false)} />
      <History visible={historyVisible} onClose={() => setHistoryVisible(false)} />
    </div>
  );
});

export default HeaderBar;
