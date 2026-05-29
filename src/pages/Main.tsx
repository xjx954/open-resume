import React, { useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import SplitPane from "react-split-pane";
import { message } from "antd";
import Editor from "./Editor";
import BlockEditor from "@src/components/BlockEditor";
import View from "./View";
import EditorToolbar from "@src/components/EditorToolbar";
import { useStores } from "@src/store";
import { observer } from "mobx-react";
import { renderResumePreviewMode } from "@src/utils/global";
import "./Main.less";
import ColorPicker from "./ColorPicker";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const DEFAULT_ZOOM = 100;
const ZOOM_STEP = 10;
const PAPER_WIDTH = 794;
const SIDEBAR_DEFAULT = 400;
const SIDEBAR_MIN = 360;
const SIDEBAR_MAX = 480;

const Main: React.FC = observer(() => {
  const query = useQuery();
  const isMdMode = query.get("mode") === "md";
  const { templateStore } = useStores();

  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const viewWrapperRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="rs-container">
      <SplitPane split="vertical" defaultSize={SIDEBAR_DEFAULT} minSize={SIDEBAR_MIN} maxSize={SIDEBAR_MAX}>
        {isMdMode ? <Editor /> : <BlockEditor />}
        <div className="rs-preview-panel">
          <EditorToolbar
            zoom={zoom}
            isPreview={templateStore.isPreview}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitWidth={handleFitWidth}
            onZoomPreset={handleZoomPreset}
            onTogglePreview={handleTogglePreview}
          />
          <div className="rs-view-wrapper" ref={viewWrapperRef}>
            <View zoom={zoom} />
          </div>
        </div>
      </SplitPane>
      <ColorPicker />
    </div>
  );
});

export default Main;
