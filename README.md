# Open Resume

Open Resume 是一个面向中文/英文简历写作的开源简历编辑器，提供 Markdown/可视化编辑、模板预览、PDF 导出、AI 辅助润色和本地规则版求职诊断。

## Screenshots

> TODO: Add screenshots for the editor, template preview, AI settings, and job diagnosis report.

## Core Features

- **Markdown 编辑**：使用 Markdown 编写简历，并实时预览渲染结果。
- **可视化 Blocks 编辑**：通过结构化块编辑简历内容，支持排序、复制、删除等常用操作。
- **模板与主题预览**：提供多套简历模板和主题配置，用于快速查看不同排版效果。
- **PDF 导出**：通过本地 PDF 服务导出简历。
- **本地历史记录**：使用浏览器本地存储保留编辑历史，便于恢复。

## AI Capabilities

AI 功能服务于简历写作场景，当前包括：

- 简历整体润色
- 选中文本的行内润色
- 基于岗位 JD 的岗位匹配分析

项目支持 OpenAI-compatible API，并提供 OpenAI、DeepSeek、Qwen、GLM、Moonshot / Kimi、Ollama 本地模型等配置入口。当前 AI Key 由用户在浏览器内配置，适合本地开发和个人使用；如果要部署给多人使用，建议在后续接入后端代理，避免把 API Key 暴露在浏览器端。

## Job Diagnosis

求职诊断为本地规则引擎，不需要配置 API Key，也不会调用 AI 接口。当前会基于简历和可选 JD 输出：

- 总体匹配分与 ATS 分
- 关键词覆盖率
- 命中关键词与缺失关键词
- 匹配技能与缺失技能
- 项目经历、工作经历匹配情况
- 可解释评分构成
- 改进建议

该能力后续可接入 AI 做增强分析，但规则检查仍应作为基础能力保留。

## Local Setup

```bash
npm install
npm start
```

默认启动：

- 前端：http://localhost:3000
- PDF API：http://localhost:4000/api/pdf

如果只需要启动前端：

```bash
npm run start:web
```

常用检查：

```bash
npm test -- --watchAll=false --runInBand
npm run build
```

## AI Configuration

打开应用中的 AI 设置后，可以选择预设服务商或手动填写 OpenAI-compatible 配置：

- Base URL
- Model
- API Key

示例：

```text
OpenAI-compatible base URL: https://api.openai.com/v1
DeepSeek base URL: https://api.deepseek.com/v1
Moonshot / Kimi base URL: https://api.moonshot.cn/v1
Ollama base URL: http://127.0.0.1:11434/v1
Ollama model: qwen2.5:7b-instruct-q4_K_M
```

不要把真实 API Key 提交到仓库。当前前端 AI 流程不读取 `.env` 中的 AI Key，用户应在本地浏览器设置中配置。

## Tech Stack

- React 17
- TypeScript
- MobX
- Ant Design
- Less
- Markdown-it
- CodeMirror
- dnd-kit
- Puppeteer PDF service
- Ejected CRA / Webpack 4

## Roadmap

- AI Key 后端代理，降低浏览器端暴露风险
- AI 流式输出
- Markdown / Blocks 双模式一致性增强
- Vite 迁移评估与实施
- 更完整的 ATS / 求职诊断规则
- 项目截图、在线 Demo 和更完善的使用文档

## Contributing

欢迎提交 Issue 和 PR。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，并确保不要提交 `build/`、`.env`、API Key 或无关生成文件。

## License

GPL-3.0
