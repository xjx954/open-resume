const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const VALID_THEMES = ['default', 'blue', 'formal-cn', 'two-column', 'academic-blue'];
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ],
}));
app.use(express.json({ limit: '5mb' }));

// Cache loaded theme CSS in memory
const themeCache = new Map();

function loadThemeCss(theme) {
  if (themeCache.has(theme)) {
    return themeCache.get(theme);
  }
  const filePath = path.join(__dirname, '..', 'public', 'themes', `${theme}.css`);
  if (!fs.existsSync(filePath)) {
    // Fall back to default theme
    const defaultPath = path.join(__dirname, '..', 'public', 'themes', 'default.css');
    if (fs.existsSync(defaultPath)) {
      const css = fs.readFileSync(defaultPath, 'utf-8');
      themeCache.set(theme, css);
      return css;
    }
    return '';
  }
  const css = fs.readFileSync(filePath, 'utf-8');
  themeCache.set(theme, css);
  return css;
}

function buildHtml({ htmlContent, theme, themeColor }) {
  const themeCss = loadThemeCss(theme);
  // Replace var(--bg) with the actual color for environments that don't support CSS variables
  const resolvedCss = themeCss.replace(/var\(--bg\)/g, themeColor);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root { --bg: ${themeColor}; }

    body {
      font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background: #fff;
    }

    .rs-view-inner {
      width: 794px;
      margin: 0 auto;
      background: #fff;
    }

${resolvedCss}
  </style>
</head>
<body>
  <div class="rs-view-inner">
    ${htmlContent}
  </div>
</body>
</html>`;
}

// Browser instance (lazy init)
let browser = null;

async function getBrowser() {
  if (browser && browser.isConnected()) {
    return browser;
  }
  browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  return browser;
}

app.post('/api/pdf', async (req, res) => {
  const { htmlContent, theme, themeColor, isOnePage, isMark, watermarkText } = req.body;

  if (!htmlContent) {
    return res.status(400).json({ message: '缺少 htmlContent' });
  }

  // Validate themeColor
  const validatedColor = themeColor || '#39393a';
  if (!HEX_COLOR_RE.test(validatedColor)) {
    return res.status(400).json({ message: 'Invalid themeColor format' });
  }

  // Validate theme
  const validatedTheme = VALID_THEMES.includes(theme) ? theme : 'default';

  // Sanitize HTML content
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);
  const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'svg', 'path', 'circle', 'rect', 'line',
      'g', 'defs', 'use', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'strong', 'em', 'b', 'i', 'u', 's', 'code', 'pre', 'blockquote',
      'section', 'header', 'footer', 'article', 'nav', 'main',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'class', 'id', 'style', 'target', 'rel',
      'width', 'height', 'viewBox', 'fill', 'd', 'xlink:href', 'aria-hidden',
      'xmlns', 'version', 'p-id', 'xmlns:xlink', 'data-pages',
    ],
  });

  const html = buildHtml({
    htmlContent: sanitizedHtml,
    theme: validatedTheme,
    themeColor: validatedColor,
  });

  let page = null;
  try {
    const browserInstance = await getBrowser();
    page = await browserInstance.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 15000,
    });

    // Add watermark if requested
    const resolvedWatermarkText = typeof watermarkText === 'string' ? watermarkText : 'Open Resume';
    if (isMark && resolvedWatermarkText.trim()) {
      await page.evaluate((text) => {
        const watermark = document.createElement('div');
        watermark.style.cssText =
          'position:fixed;top:0;left:0;width:100%;height:100%;' +
          'pointer-events:none;z-index:9999;' +
          'background:repeat url("data:image/svg+xml,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">' +
            '<text x="50%" y="50%" font-size="18" fill="rgba(0,0,0,0.06)"' +
            ' text-anchor="middle" transform="rotate(-30, 150, 100)">' +
            text.replace(/[<>&"]/g, '') +
            '</text>' +
            '</svg>'
          ) +
          '");';
        document.body.appendChild(watermark);
      }, resolvedWatermarkText);
    }

    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    };

    if (isOnePage) {
      // Fit content to one page by scaling
      const contentHeight = await page.evaluate(
        () => document.body.scrollHeight
      );
      const a4Height = 1122; // ~297mm at 96dpi
      if (contentHeight > a4Height) {
        const scale = a4Height / contentHeight;
        await page.evaluate((s) => {
          document.body.style.transform = `scale(${s})`;
          document.body.style.transformOrigin = 'top left';
          document.body.style.width = `${100 / s}%`;
        }, scale);
      }
    }

    const pdfBuffer = await page.pdf(pdfOptions);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ message: 'PDF 生成失败: ' + (err.message || '未知错误') });
  } finally {
    if (page) {
      try { await page.close(); } catch (_) { /* ignore */ }
    }
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(PORT, () => {
  console.log(`PDF server running on http://localhost:${PORT}`);
  console.log(`Endpoint: POST http://localhost:${PORT}/api/pdf`);
});

// ── Graceful shutdown ──

async function cleanup() {
  if (browser && browser.isConnected()) {
    try {
      // Close all pages first, then the browser
      const pages = await browser.pages();
      await Promise.all(pages.map(p => p.close().catch(() => {})));
      await browser.close();
    } catch {
      // Force disconnect if close fails
      try { browser.disconnect(); } catch {}
    }
    browser = null;
  }
}

async function shutdown() {
  console.log('\nPDF server shutting down...');
  await cleanup();
  server.close(() => {
    process.exit(0);
  });
  // Force exit after 3s if server.close hangs
  setTimeout(() => process.exit(0), 3000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGBREAK', shutdown);

// Clean up browser even on forced exit
process.on('exit', () => {
  if (browser) {
    try { browser.close(); } catch {}
  }
});

// Handle uncaught exceptions — don't leave browser running
process.on('uncaughtException', async (err) => {
  console.error('Uncaught exception:', err);
  await cleanup();
  process.exit(1);
});
