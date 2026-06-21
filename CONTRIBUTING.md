# Contributing

感谢你对 Open Resume 的关注。这个项目优先保证编辑体验、模板质量、AI 辅助写作和 PDF 导出稳定可用。

## Local Setup

```bash
npm install
npm start
```

默认会启动前端和本地 PDF 服务：

- Frontend: http://localhost:3000
- PDF API: http://localhost:4000/api/pdf

如果只需要前端开发服务：

```bash
npm run start:web
```

## Tests

提交前建议运行：

```bash
npm test -- --watchAll=false --runInBand
npm run build
```

如果只修改文档，至少运行一次 `npm run build`，确认仓库仍可构建。

## Commit Convention

建议使用清晰的提交前缀：

- `feat:` 新功能
- `fix:` 修复问题
- `docs:` 文档修改
- `refactor:` 不改变行为的代码整理
- `test:` 测试相关修改
- `chore:` 工程配置或维护任务

示例：

```text
docs: improve open source onboarding
fix: keep ai settings error message readable
```

## Pull Requests

PR 请说明：

- 修改了什么
- 为什么需要修改
- 如何验证
- 是否有兼容风险

涉及 UI 的改动请附截图或说明。涉及 AI、PDF、编辑器核心流程的改动请补充相关测试。

## Security Notes

- 不要提交 `.env`。
- 不要提交任何真实 API Key、Token 或私有服务地址。
- 不要把浏览器 localStorage 中的 AI 配置粘贴到 Issue 或 PR。
- 多人部署时应优先使用后端代理保存和调用 AI Key。

## Generated Files

不要提交以下内容：

- `build/`
- `node_modules/`
- 覆盖率目录
- 本地日志文件
- 临时调试文件
- 与当前 PR 无关的生成文件
