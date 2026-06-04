# Open Resume

A free, open-source Markdown resume builder with dual editing modes, AI-assisted writing, 5 premium themes, and one-click PDF export.

[简体中文](README.md) | English

## Features

### Editing
- **Markdown Editor** — Syntax highlighting + live preview
- **Visual Block Editor** — Drag-and-drop card-based editor with `@dnd-kit`; reorder, collapse, duplicate, or delete blocks
- **Import/Export** — Import or export `.md` files to keep work portable
- **Photo Upload** — Resume photo upload with cropping
- **Undo/Redo** — Built-in edit history with rollback support

### AI Assistance
- **Polish** — Improve phrasing and professionalism
- **Quantity** — Turn vague descriptions into quantified achievements
- **JD Match Analysis** — Keyword coverage detection + structured AI report against a job description
- **Paragraph Diff** — Before/after comparison with one-click apply

*OpenAI-compatible API support with DeepSeek / Qwen / OpenAI presets, guided setup wizard, and one-click connection test.*

### Themes & Export
- **5 Premium Themes** — Minimal Classic, Blue Professional, Formal Chinese, Two-Column Pro, Academic Blue
- **Custom Colors** — Built-in color picker for customizable themes
- **PDF Export** — One-click PDF with single-page mode and watermark options
- **Template Gallery** — Browse and preview all templates at `/square`

### More
- **Edit History** — Restore previous versions from localStorage history
- **Icon Shortcuts** — Insert contact icons (email, phone, GitHub, etc.) with `icon:xxx` syntax
- **Two-Column Layout** — `::: sidebar / ::: main` container syntax for split-column resumes

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
│   ├── BlockEditor/         # Visual drag-and-drop block editor + inline AI rewrite
│   ├── HeaderBar/           # Editor toolbar (export, theme, AI, history)
│   ├── HeaderCommonBar/     # Site navigation header
│   ├── EditorToolbar/       # Preview zoom controls
│   ├── ResumeAiModal/       # AI assistant modal (polish / match / quantify)
│   ├── AiSettingsModal/     # AI setup wizard (select provider → paste key → test)
│   ├── TemplatePreview/     # Template preview component
│   ├── History/             # Version history browser
│   └── ...
├── pages/
│   ├── Home.tsx             # Landing page
│   ├── Main.tsx             # Editor split-pane layout (Markdown + preview)
│   ├── Square.tsx           # Template marketplace
│   └── View.tsx             # Live HTML preview renderer
├── store/
│   └── template.store.ts    # MobX state (blocks, theme, color, preview)
├── utils/
│   ├── helper.ts            # markdown-it config + custom renderers
│   ├── blockSerializer.ts   # Markdown ↔ ResumeBlock[] converter
│   ├── aiApply.ts           # AI result one-click apply
│   ├── markdownDiff.ts      # AI before/after paragraph diff
│   └── global.ts            # Render pipeline + history persistence
├── types/
│   └── resume.ts            # ResumeBlock, SectionData, etc.
└── service/
    ├── ai.ts                # OpenAI-compatible chat completions
    ├── aiConfig.ts          # AI config persistence + connection test
    ├── jobMatchAnalysis.ts  # JD keyword extraction & analysis
    └── htmlToPdf.ts         # PDF generation proxy
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
| Styles | Less (5 themes share `common/global.less` foundation) |

## Development

```bash
npm install
npm start                   # dev server with hot reload

npm test                    # run test suite
npm run compile:themes      # compile Less → CSS
npm run build:themes        # bundle CSS → theme.js
```

## License

GPL-3.0 © xjx954
