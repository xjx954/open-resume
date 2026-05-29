# Open Resume

A free, open-source Markdown resume builder with live preview, dual editing modes, AI optimization, 7 themes, and one-click PDF export.

English | [简体中文](README.zh-CN.md)

## Features

### Editing
- **Markdown Editor** — Write in Markdown with syntax highlighting and live preview
- **Visual Block Editor** — Drag-and-drop card-based editor with `@dnd-kit`; reorder, duplicate, collapse, or delete resume blocks
- **Import/Export** — Import or export `.md` files to keep work portable

### AI Optimization
- **Polish** — Improve phrasing and professionalism
- **JD Match** — Tailor resume to a specific job description
- **Quantity** — Turn vague bullet points into quantified achievements
- **ATS Keywords** — Suggest keywords to pass applicant tracking systems

*Requires an OpenAI-compatible API key configured in the AI modal.*

### Themes & Export
- **7 Visual Themes** — Switch between professional templates with one click, each with its own color identity
- **Custom Colors** — Pick your own accent color via a built-in color picker
- **PDF Export** — One-click PDF generation with one-page mode and watermark options
- **Template Gallery** — Browse and preview available templates at `/square`

### Utilities
- **Edit History** — Restore previous versions from localStorage history
- **Icon Shortcuts** — Insert contact icons (email, phone, GitHub, etc.) with `icon:xxx` syntax

## Quick Start

```bash
npm install        # auto-installs server deps via postinstall
npm start          # frontend :3000 + PDF backend :4000
npm run start:web  # frontend only
```

Open [http://localhost:3000](http://localhost:3000).

### PDF Backend

PDF export uses Puppeteer (headless Chrome). Chromium is downloaded on first install (~300MB).

| Service  | Port | Endpoint       |
| -------- | ---- | -------------- |
| Frontend | 3000 | React dev server |
| PDF API  | 4000 | `POST /api/pdf` |

Configure in `.env` (copy `.env.example`):

```
REACT_APP_PDF_API_URL=http://localhost:4000/api/pdf
```

## Project Structure

```
src/
├── components/
│   ├── BlockEditor/        # Visual drag-and-drop block editor
│   ├── HeaderBar/          # Editor toolbar (export, theme, AI, history)
│   ├── HeaderCommonBar/    # Site navigation header
│   ├── EditorToolbar/      # Preview zoom controls
│   ├── ResumeAiModal/      # AI optimization modal
│   ├── History/            # Version history browser
│   └── ...
├── pages/
│   ├── Home.tsx            # Landing page
│   ├── Main.tsx            # Editor split-pane layout
│   ├── Square.tsx          # Template marketplace
│   └── View.tsx            # Live HTML preview renderer
├── store/
│   └── template.store.ts   # MobX state (blocks, theme, color, preview)
├── utils/
│   ├── helper.ts           # markdown-it config + custom renderers
│   ├── blockSerializer.ts  # Markdown ↔ ResumeBlock[] converter
│   └── global.ts           # Render pipeline + history persistence
├── types/
│   └── resume.ts           # ResumeBlock, SectionData, etc.
└── service/
    ├── ai.ts               # OpenAI-compatible chat completions
    └── htmlToPdf.ts        # PDF generation proxy
```

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | React 17 + TypeScript |
| State | MobX |
| UI | Ant Design |
| Markdown | markdown-it (custom heading-container + emoji plugins) |
| Code Editor | CodeMirror (`@uiw/react-codemirror`) |
| DnD | `@dnd-kit/core` + `@dnd-kit/sortable` |
| PDF | Puppeteer (backend headless Chrome) |
| Build | Webpack 4 (ejected CRA) |
| Styles | Less (7 themes share `common/global.less` foundation) |

## Development

```bash
npm install
npm start                 # dev server with hot reload

npm test                  # run test suite
npm run compile:themes    # compile Less → CSS
npm run build:themes      # bundle CSS → theme.js
```

## License

GPL-3.0 © xjx954
