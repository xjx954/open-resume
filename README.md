# Open Resume

免费开源 Markdown 简历制作工具，支持双编辑模式、AI 辅助写作、5 套精品主题和一键导出 PDF。

[English](README.zh-CN.md) | 简体中文

## 功能

### 编辑
- **Markdown 编辑器** — 语法高亮 + 实时预览，所见即所得
- **可视化块编辑器** — 基于 `@dnd-kit` 的拖拽式卡片编辑，支持排序、折叠、复制、删除
- **导入/导出** — 导入或导出 `.md` 文件，随处可用
- **照片上传** — 支持简历照片上传与裁剪
- **撤销/重做** — 内置编辑历史，支持回退和恢复

### AI 辅助
- **AI 润色** — 优化措辞，提升专业度
- **经历生成** — 将模糊描述转化为量化成果
- **岗位匹配分析** — 针对 JD 进行关键词覆盖检测与结构化 AI 报告
- **段落对比** — AI 修改前后差异高亮，一键应用

*支持 OpenAI 兼容 API，提供 DeepSeek / Qwen / OpenAI 等预设，向导式配置，一键测试连接。*

### 主题与导出
- **5 套精品主题** — 极简经典、蓝色专业、中文正式、双栏专业、科研学术，各有独立配色
- **自定义主题色** — 内置取色器，可换色主题随心调整强调色
- **PDF 导出** — 一键生成 PDF，支持单页模式和水印选项
- **模板集市** — 在 `/square` 浏览和预览全部模板

### 其他
- **编辑历史** — 从 localStorage 历史中恢复之前版本
- **图标快捷输入** — 通过 `icon:xxx` 语法插入邮箱、电话、GitHub 等联系图标
- **双栏布局** — 支持 `::: sidebar / ::: main` 容器语法，实现左右分栏简历

## 快速开始

```bash
npm install        # postinstall 自动安装后端依赖
npm start          # 前端 :3000 + PDF 后端 :4000
npm run start:web  # 仅启动前端
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

### PDF 后端

PDF 导出需要 Puppeteer（无头 Chrome）。首次安装时自动下载 Chromium（约 300MB）。

| 服务   | 端口 | 接口             |
| ------ | ---- | ---------------- |
| 前端   | 3000 | React 开发服务器 |
| PDF API | 4000 | `POST /api/pdf` |

在 `.env` 中配置后端地址（复制 `.env.example`）：

```
REACT_APP_PDF_API_URL=http://localhost:4000/api/pdf
```

## 项目结构

```
src/
├── components/
│   ├── BlockEditor/         # 可视化拖拽块编辑器 + 行内 AI 润色
│   ├── HeaderBar/           # 编辑工具栏（导出、主题、AI、历史）
│   ├── HeaderCommonBar/     # 全局导航栏
│   ├── EditorToolbar/       # 预览缩放控件
│   ├── ResumeAiModal/       # AI 助手弹窗（润色/匹配/经历生成）
│   ├── AiSettingsModal/     # AI 配置向导（选服务商 → 贴 Key → 测试）
│   ├── TemplatePreview/     # 模板预览组件
│   ├── History/             # 版本历史浏览
│   └── ...
├── pages/
│   ├── Home.tsx             # 首页
│   ├── Main.tsx             # 编辑器分栏布局（Markdown + 预览）
│   ├── Square.tsx           # 模板集市
│   └── View.tsx             # 实时 HTML 预览渲染
├── store/
│   └── template.store.ts    # MobX 状态（块、主题、颜色、预览）
├── utils/
│   ├── helper.ts            # markdown-it 配置 + 自定义渲染器
│   ├── blockSerializer.ts   # Markdown ↔ ResumeBlock[] 转换
│   ├── aiApply.ts           # AI 结果一键应用到编辑器
│   ├── markdownDiff.ts      # AI 修改前后段落对比
│   └── global.ts            # 渲染管线 + 历史持久化
├── types/
│   └── resume.ts            # ResumeBlock, SectionData 等类型定义
└── service/
    ├── ai.ts                # OpenAI 兼容的对话补全
    ├── aiConfig.ts          # AI 配置持久化 + 连接测试
    ├── jobMatchAnalysis.ts  # 岗位匹配关键词提取与分析
    └── htmlToPdf.ts         # PDF 生成代理
```

## 技术栈

| 层级     | 技术                                     |
| -------- | ---------------------------------------- |
| 框架     | React 17 + TypeScript                    |
| 状态管理 | MobX                                     |
| UI 组件  | Ant Design                               |
| Markdown | markdown-it（自定义 heading-container + emoji 插件） |
| 代码编辑 | CodeMirror (`@uiw/react-codemirror`)     |
| 拖拽     | `@dnd-kit/core` + `@dnd-kit/sortable`  |
| PDF      | Puppeteer（后端无头 Chrome）             |
| 构建     | Webpack 4（ejected CRA）                 |
| 样式     | Less（5 套主题共享 `common/global.less` 排版基础） |

## 开发

```bash
npm install
npm start                   # 开发服务器，支持热重载

npm test                    # 运行测试
npm run compile:themes      # 编译 Less → CSS
npm run build:themes        # 打包 CSS → theme.js
```

## License

GPL-3.0 © xjx954
