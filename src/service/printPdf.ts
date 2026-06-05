import {
  A4_WIDTH_PX,
  RESUME_DENSITY_CSS,
  RESUME_PAGE_CSS,
} from './pdfExportHtml';

export interface PrintPdfParams {
  htmlContent: string;
  themeColor: string;
  isMark: boolean;
  watermarkText?: string;
  isOnePage?: boolean;
}

function getThemeCss() {
  return document.getElementById('rs-themes-data')?.innerHTML || '';
}

function buildWatermark(text: string) {
  const safeText = text.replace(/[<>&"]/g, '');
  if (!safeText) return '';

  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><text x="50%" y="50%" font-size="18" fill="rgba(0,0,0,0.06)" text-anchor="middle" transform="rotate(-30, 150, 100)">${safeText}</text></svg>`
  );

  return `<div style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;background:repeat url(&quot;data:image/svg+xml,${svg}&quot;);"></div>`;
}

export function printPdfFallback({
  htmlContent,
  themeColor,
  isMark,
  watermarkText = 'Open Resume',
  isOnePage = false,
}: PrintPdfParams) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    throw new Error('Browser print is not available.');
  }

  const themeCss = getThemeCss();
  const watermark = isMark ? buildWatermark(watermarkText) : '';

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    :root { --bg: ${themeColor}; }
    @page { size: A4; margin: 0; }
    html, body { margin: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .rs-view-inner { width: ${A4_WIDTH_PX}px; margin: 0 auto; background: #fff; }
    ${themeCss}
    ${RESUME_DENSITY_CSS}
    ${RESUME_PAGE_CSS}
  </style>
</head>
<body>
  <div class="rs-view-inner">${htmlContent}</div>
  ${watermark}
</body>
</html>`);
  doc.close();

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 500);
  };

  const applyOnePageLayout = () => {
    if (!isOnePage) return;
    const root = doc.querySelector('.rs-view-inner') as HTMLElement | null;
    if (!root) return;
    doc.body.style.width = `${A4_WIDTH_PX}px`;
    root.style.width = `${A4_WIDTH_PX}px`;
    root.style.margin = '0';
  };

  win.focus();
  win.onafterprint = cleanup;
  setTimeout(() => {
    applyOnePageLayout();
    win.print();
    setTimeout(cleanup, 3000);
  }, 100);
}
