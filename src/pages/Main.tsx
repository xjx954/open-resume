import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import SplitPane from "react-split-pane";
import { message, Radio } from "antd";
import Editor from "./Editor";
import BlockEditor from "@src/components/BlockEditor";
import View from "./View";
import EditorToolbar from "@src/components/EditorToolbar";
import { useStores } from "@src/store";
import { observer } from "mobx-react";
import { renderResumePreviewMode } from "@src/utils/global";
import "./Main.less";
import ColorPicker from "./ColorPicker";

const DEFAULT_ZOOM = 100;
const ZOOM_STEP = 10;
const PAPER_WIDTH = 794;
const SIDEBAR_DEFAULT = 600;
const SIDEBAR_MIN = 400;
const SIDEBAR_MAX = 1200;
const MOBILE_BREAKPOINT = 900;

function useNarrowViewport() {
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isNarrow;
}

const Main: React.FC = observer(() => {
  const location = useLocation();
  const history = useHistory();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlMdMode = query.get("mode") === "md";
  const { templateStore } = useStores();

  // Use local state as the primary toggle to avoid timing issues with URL updates
  const [editorMode, setEditorMode] = useState<"block" | "md">(
    urlMdMode ? "md" : "block"
  );

  // Sync from external URL changes (e.g., browser back/forward)
  useEffect(() => {
    setEditorMode(urlMdMode ? "md" : "block");
  }, [urlMdMode]);

  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const isNarrowViewport = useNarrowViewport();
  const viewWrapperRef = useRef<HTMLDivElement>(null);
  const previewBeforeOnePageRef = useRef<boolean | null>(null);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + ZOOM_STEP, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - ZOOM_STEP, 40));
  }, []);

  const handleFitWidth = useCallback(() => {
    const wrapper = viewWrapperRef.current;
    if (!wrapper) return;
    const availableWidth = wrapper.clientWidth - 64;
    const scale = Math.round((availableWidth / PAPER_WIDTH) * 100);
    const clamped = Math.min(Math.max(scale, 40), 200);
    setZoom(clamped);
  }, []);

  const handleZoomPreset = useCallback((preset: number) => {
    setZoom(preset);
  }, []);

  const handleTogglePreview = useCallback(() => {
    const nextPreview = !templateStore.isPreview;
    renderResumePreviewMode(nextPreview, templateStore.color, templateStore.mdContent);
    templateStore.setPreview(nextPreview);
    if (nextPreview) {
      message.success('预览模式');
    } else {
      message.success('编辑模式');
    }
  }, [templateStore]);

  const handleToggleSmartOnePage = useCallback(() => {
    const nextMode = templateStore.pdfLayoutMode === 'smart-one-page' ? 'normal' : 'smart-one-page';
    templateStore.setPdfLayoutMode(nextMode);
    if (nextMode === 'smart-one-page') {
      previewBeforeOnePageRef.current = templateStore.isPreview;
    }
    if (nextMode === 'smart-one-page' && !templateStore.isPreview) {
      renderResumePreviewMode(true, templateStore.color, templateStore.mdContent);
      templateStore.setPreview(true);
    }
    if (nextMode === 'normal' && previewBeforeOnePageRef.current === false) {
      renderResumePreviewMode(false, templateStore.color, templateStore.mdContent);
      templateStore.setPreview(false);
    }
    if (nextMode === 'normal') {
      previewBeforeOnePageRef.current = null;
    }
    message.success(nextMode === 'smart-one-page' ? '智能一页' : '普通分页预览');
  }, [templateStore]);

  const handleModeChange = useCallback((mode: "block" | "md") => {
    // When switching from Markdown to visual mode, flush the current
    // editor content to blocks immediately to avoid data loss from the
    // debounced 2s save timer.
    if (mode === "block" && editorMode === "md" && templateStore.editorRef) {
      const currentMd = templateStore.editorRef.getValue();
      templateStore.setMdContent(currentMd);
    }
    // Update local state immediately so the UI responds without waiting for URL roundtrip
    setEditorMode(mode);
    const nextQuery = new URLSearchParams(location.search);
    if (mode === "md") {
      nextQuery.set("mode", "md");
    } else {
      nextQuery.delete("mode");
    }
    const search = nextQuery.toString();
    history.replace({
      pathname: location.pathname,
      search: search ? `?${search}` : "",
    });
  }, [history, location.pathname, location.search, editorMode, templateStore]);

  const editorContent = (
    <div className="rs-editor-panel">
      <div className="rs-editor-mode-switch">
        <Radio.Group
          size="small"
          value={editorMode}
          onChange={e => handleModeChange(e.target.value)}
        >
          <Radio.Button value="block">可视化编辑</Radio.Button>
          <Radio.Button value="md">Markdown</Radio.Button>
        </Radio.Group>
      </div>
      <div className="rs-editor-panel__body" key={editorMode}>
        {editorMode === "md" ? <Editor /> : <BlockEditor />}
      </div>
    </div>
  );

  const previewContent = (
    <div className="rs-preview-panel">
      <EditorToolbar
        zoom={zoom}
        isPreview={templateStore.isPreview}
        isSmartOnePage={templateStore.pdfLayoutMode === 'smart-one-page'}
        density={templateStore.pdfDensity}
        canFitOnePage={templateStore.pdfCanFitOnePage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitWidth={handleFitWidth}
        onZoomPreset={handleZoomPreset}
        onTogglePreview={handleTogglePreview}
        onToggleSmartOnePage={handleToggleSmartOnePage}
      />
      <div className="rs-view-wrapper" ref={viewWrapperRef}>
        <View zoom={zoom} />
      </div>
    </div>
  );

  if (isNarrowViewport) {
    return (
      <div className="rs-container rs-container--mobile">
        {editorContent}
        {previewContent}
        <ColorPicker />
      </div>
    );
  }

  return (
    <div className="rs-container">
      <SplitPane split="vertical" defaultSize={SIDEBAR_DEFAULT} minSize={SIDEBAR_MIN} maxSize={SIDEBAR_MAX}>
        {editorContent}
        {previewContent}
      </SplitPane>
      <ColorPicker />
    </div>
  );
});

export default Main;
