import React from 'react';

interface Props {
  zoom: number;
  isPreview: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onTogglePreview: () => void;
}

const MIN_ZOOM = 40;
const MAX_ZOOM = 200;

const EditorToolbar: React.FC<Props> = ({
  zoom,
  isPreview,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onTogglePreview,
}) => {
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  return (
    <div className="rs-preview-toolbar">
      <div className="rs-preview-toolbar__group">
        <button
          className="rs-preview-toolbar__btn"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          title="缩小"
          aria-label="缩小预览"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="rs-preview-toolbar__zoom-label">{zoom}%</span>
        <button
          className="rs-preview-toolbar__btn"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          title="放大"
          aria-label="放大预览"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="rs-preview-toolbar__divider" />
        <button
          className="rs-preview-toolbar__btn"
          onClick={onFitWidth}
          title="适应宽度"
          aria-label="适应宽度"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>

      <div className="rs-preview-toolbar__group">
        <button
          className={`rs-preview-toolbar__btn ${isPreview ? 'rs-preview-toolbar__btn--active' : ''}`}
          onClick={onTogglePreview}
          title={isPreview ? '切换到编辑模式' : '切换到预览模式'}
          aria-label="切换预览模式"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isPreview ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
