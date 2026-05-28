# Open Resume

A free, open-source Markdown resume builder with live preview, multiple themes, and one-click PDF export.

## Features

- **Markdown Editor** — Write your resume in Markdown with live preview
- **7 Visual Themes** — Switch between professional templates with one click
- **Custom Colors** — Pick your own accent color for compatible themes
- **PDF Export** — Generate and download a print-ready PDF
- **Template Center** — Choose from pre-built resume templates
- **Import/Export** — Import or export Markdown files
- **Edit History** — Recover previous versions from local history
- **Icon Shortcuts** — Insert icons (GitHub, email, phone, etc.) with simple syntax

## Quick Start

```bash
# Install dependencies (auto-installs server deps via postinstall)
npm install

# Start (frontend :3000 + PDF backend :4000)
npm start

# Frontend only
npm run start:web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### PDF Export

PDF export requires a running backend service (included in `npm start`).

| Service | Port | Endpoint |
|---|---|---|
| Frontend | 3000 | React dev server |
| PDF backend | 4000 | `POST /api/pdf` |

The backend uses Puppeteer (headless Chrome) to render HTML to PDF. On first install, it downloads Chromium (~300MB).

Configure the backend URL in `.env`:

```
REACT_APP_PDF_API_URL=http://localhost:4000/api/pdf
```

Copy `.env.example` → `.env` for the default configuration.

## Tech Stack

- React 17 + TypeScript
- MobX for state management
- Ant Design UI components
- markdown-it for Markdown parsing
- CodeMirror for code editing
- Puppeteer for PDF generation
- Webpack 4 (ejected CRA)

## License

GPL-3.0 © xjx954
