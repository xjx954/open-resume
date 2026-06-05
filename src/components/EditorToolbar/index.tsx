import React from 'react';
import { RESUME_DENSITY_LABELS, ResumeDensity } from '@src/service/pdfExportHtml';

interface Props {
  zoom: number;
  isPreview: boolean;
  isSmartOnePage: boolean;
  density: ResumeDensity;
  canFitOnePage: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onZoomPreset: (preset: number) => void;
  onTogglePreview: () => void;
  onToggleSmartOnePage: () => void;
}

const MIN_ZOOM = 40;
const MAX_ZOOM = 200;

const ZOOM_PRESETS = [
  { label: '75%', value: 75 },
  { label: '100%', value: 100 },
  { label: '适应', value: -1 },
];

const EditorToolbar: React.FC<Props> = ({
  zoom,
  isPreview,
  isSmartOnePage,
  density,
  canFitOnePage,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onZoomPreset,
  onTogglePreview,
  onToggleSmartOnePage,
}) => {
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;
  const onePageStatus = !canFitOnePage
    ? '当前内容较多，建议使用两页简历或精简内容。'
    : `已适配一页：${RESUME_DENSITY_LABELS[density]}`;

  return (
    <div className="rs-preview-toolbar">
      <div className="rs-preview-toolbar__group">
        <button
          className="rs-preview-toolbar__btn"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          title="缩小预览，仅调整查看比例，不影响导出排版"
          aria-label="缩小预览"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="rs-preview-toolbar__zoom-label" title="仅调整预览大小，不影响导出排版">{zoom}%</span>
        <button
          className="rs-preview-toolbar__btn"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          title="放大预览，仅调整查看比例，不影响导出排版"
          aria-label="放大预览"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="rs-preview-toolbar__divider" />
        {ZOOM_PRESETS.map(p => (
          <button
            key={p.value}
            className={`rs-preview-toolbar__btn rs-preview-toolbar__btn--text ${zoom === p.value ? 'rs-preview-toolbar__btn--active' : ''}`}
            onClick={() => p.value === -1 ? onFitWidth() : onZoomPreset(p.value)}
            title={`${p.label}，仅调整预览大小，不影响导出排版`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rs-preview-toolbar__group">
        <button
          className={`rs-preview-toolbar__btn rs-preview-toolbar__btn--text rs-preview-toolbar__btn--wide ${isSmartOnePage ? 'rs-preview-toolbar__btn--active' : ''}`}
          onClick={onToggleSmartOnePage}
          title={isSmartOnePage || !canFitOnePage ? onePageStatus : '智能一页'}
          aria-label="智能一页"
        >
          智能一页
        </button>
        {isSmartOnePage && (
          <span className="rs-preview-toolbar__status">
            {!canFitOnePage ? '内容过多：建议两页' : `已适配一页：${RESUME_DENSITY_LABELS[density]}`}
          </span>
        )}
        <span className="rs-preview-toolbar__divider" />
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
