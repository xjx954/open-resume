# Open Resume 用户体验痛点修复方案

## 背景

Open Resume 是一个基于 React 的 Markdown 简历编辑器，核心工作闭环为「写内容 → 实时预览 → 导出 PDF」。通过对代码库的全面梳理和真实用户视角的体验走查，识别出 **14 个痛点**，按严重程度分为 5 个阶段修复。

本文档为各痛点的详细修复方案。

---

## 痛点总览

| 优先级 | 编号 | 痛点 | 严重程度 |
|--------|------|------|----------|
| 关键 | #1 | PDF 导出依赖后端服务器 | 阻断核心闭环 |
| 关键 | #2 | 纯 localStorage 存储，无多简历支持 | 数据丢失风险 |
| 高 | #3 | Block Editor 单手风琴交互 | 编辑效率严重受损 |
| 高 | #4 | Block/Markdown 双模式分裂 | 用户困惑 |
| 高 | #5 | AI 功能需自备 API Key | 高门槛 |
| 高 | #6 | 缺乏结构化字段（日期、技能等级、照片等） | 内容格式混乱 |
| 高 | #7 | 模板广场仅为「换皮」 | 无内容结构差异 |
| 中 | #8 | 无撤销/重做 | 编辑无保障 |
| 中 | #9 | 新手引导缺失 | 上手困难 |
| 中 | #10 | 编辑器宽度上限 480px | 大屏浪费 |
| 中 | #11 | 无键盘快捷键 | 操作效率低 |
| 低 | #12 | 水印文字硬编码 | 不可自定义 |
| 低 | #13 | 简历项目无法命名 | 恒显「未命名简历」 |
| 低 | #14 | 仅中文 UI | 海外用户无法使用 |

---

## Phase 1: 快速见效（预计 2-3 天，无新依赖）

### 1.1 客户端 PDF 导出 — 痛点 #1

**当前状态：** PDF 导出必须在本地启动 Express/Puppeteer 服务（端口 4000）。如果服务未运行，用户会得到「未配置 PDF 生成服务」的晦涩错误。普通用户无法独立完成这个配置。

**方案：** 增加浏览器原生打印 `window.print()` 作为 fallback，当后端不可达时自动降级。

**实现细节：**

1. **新建 `src/service/printPdf.ts`：**
   - 创建隐藏 iframe
   - 注入简历 HTML + 当前主题 CSS（从 `<style id="rs-themes-data">` 读取）+ `@page { size: A4; margin: 0; }` 规则
   - 调用 `iframe.contentWindow.print()`，利用浏览器内置「另存为 PDF」功能
   - 打印对话框关闭后自动清理 iframe

2. **修改 `src/components/HeaderBar/index.tsx` 的 `exportPdf` 函数：**
   - 先检查 `REACT_APP_PDF_API_URL` 是否已配置
   - 如已配置，尝试 GET `/api/health` 检测服务可达性
   - 可达 → 走现有 Puppeteer 流程（质量更高）
   - 不可达或无配置 → 走 `window.print()` fallback
   - 导出 Modal 增加说明文字

3. **新建 `public/themes/common/print.less`：** 定义 `@page` 和 `@media print` 规则

4. **修改 `gulpfile.js`：** 增加 `print.less` 的编译任务

**关键文件：** `src/service/printPdf.ts`（新建）| `src/components/HeaderBar/index.tsx` | `public/themes/common/print.less`（新建）| `gulpfile.js`

---

### 1.2 移除编辑器宽度上限 — 痛点 #10

**当前状态：** `src/pages/Main.tsx` 中 `SIDEBAR_MAX = 480`，大屏幕下编辑区域浪费严重，SectionBlock 的嵌套表单（子条目 > 卡片 > 字段）在窄空间里很拥挤。

**方案：** 一行改动。

```typescript
// src/pages/Main.tsx 第 23 行
// Before:
const SIDEBAR_MAX = 480;
// After:
const SIDEBAR_MAX = 800;
```

可选增强：将用户拖拽到的宽度持久化到 localStorage。

**关键文件：** `src/pages/Main.tsx`

---

### 1.3 Block Editor 多模块同时展开 — 痛点 #3

**当前状态：** `src/components/BlockEditor/index.tsx` 使用单一 `expandedId` 状态实现互斥的 accordion 交互。用户编辑「工作经历」时想回头看「教育背景」，必须先折叠当前模块再展开另一个。真实写简历时经常需要跨模块参考。

**方案：** 用 `Set<string>` 替代单一的 `string | null`。

```typescript
// src/components/BlockEditor/index.tsx 第 324-352 行

// Before:
const [expandedId, setExpandedId] = useState<string | null>(() => {
  const header = blocks.find(b => b.type === 'header');
  return header ? header.id : null;
});

const toggleCollapse = useCallback((id: string) => {
  userToggledRef.current.add(id);
  setExpandedId(prev => (prev === id ? null : id));
}, []);

// After:
const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
  const header = blocks.find(b => b.type === 'header');
  return new Set(header ? [header.id] : []);
});

const toggleCollapse = useCallback((id: string) => {
  userToggledRef.current.add(id);
  setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}, []);
```

SortableBlock 的 `collapsed` prop 从 `expandedId !== block.id` 改为 `!expandedIds.has(block.id)`。

**额外增强：**
- BlockEditor 顶部增加「全部展开」/「全部折叠」按钮
- 删除 block 时自动从 `expandedIds` 中移除其 ID（在 `useEffect` 中添加）

**关键文件：** `src/components/BlockEditor/index.tsx`

---

### 1.4 撤销/重做 — 痛点 #8

**当前状态：** Block Editor 中无 Cmd+Z / Cmd+Y。唯一恢复方式是去历史记录手动找时间点。

**方案：** 在 MobX store 中增加 snapshot-based undo stack。

```typescript
// src/store/template.store.ts

class TemplateStore {
  // 新增成员
  private undoStack: ResumeBlock[][] = [];
  private redoStack: ResumeBlock[][] = [];
  private readonly MAX_UNDO = 50;
  private isUndoRedoing = false; // 防止 undo/redo 自身触发的 setBlocks 再次入栈

  // 在每个 setBlocks / addBlock / removeBlock / reorderBlock / updateBlock 中，
  // 在修改 this.blocks 之前调用：
  private pushUndo() {
    if (this.isUndoRedoing) return;
    this.undoStack.push(
      this.blocks.map(b => ({ ...b, data: JSON.parse(JSON.stringify(b.data)) }))
    );
    if (this.undoStack.length > this.MAX_UNDO) {
      this.undoStack.shift();
    }
    this.redoStack = []; // 新操作清空 redo
  }

  undo = () => {
    if (this.undoStack.length === 0) return;
    this.isUndoRedoing = true;
    this.redoStack.push(/* 当前 blocks 深拷贝 */);
    const prev = this.undoStack.pop()!;
    this.setBlocks(prev); // setBlocks 内会 persist + syncPreview
    this.isUndoRedoing = false;
  };

  redo = () => {
    if (this.redoStack.length === 0) return;
    this.isUndoRedoing = true;
    this.undoStack.push(/* 当前 blocks 深拷贝 */);
    const next = this.redoStack.pop()!;
    this.setBlocks(next);
    this.isUndoRedoing = false;
  };
}
```

**关键文件：** `src/store/template.store.ts`

---

### 1.5 键盘快捷键 — 痛点 #11

**当前状态：** 除 CodeMirror 自带快捷键外，整个应用没有自定义快捷键。

**方案：** 在 `BlockEditor` 组件中增加全局 `keydown` 监听。

| 快捷键 | 操作 |
|--------|------|
| `Ctrl+Z` / `Cmd+Z` | 撤销 |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | 重做 |
| `Ctrl+D` | 复制当前展开/选中的 block |
| `Delete` | 删除当前展开/选中的 block |
| `Ctrl+S` | 手动保存（显示「已保存」提示） |
| `Ctrl+P` | 导出 PDF |

```typescript
// src/components/BlockEditor/index.tsx 新增 useEffect
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    // 如果焦点在 input/textarea 内，不拦截
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
    
    const mod = e.metaKey || e.ctrlKey;
    // Ctrl+Z → undo
    if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); templateStore.undo(); }
    // Ctrl+Shift+Z → redo
    else if (mod && e.key === 'z' && e.shiftKey) { e.preventDefault(); templateStore.redo(); }
    // ...其余快捷键
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

同时更新 `src/components/Shortcuts/index.tsx` 添加快捷键速查表。

**关键文件：** `src/components/BlockEditor/index.tsx` | `src/components/Shortcuts/index.tsx`

---

## Phase 2: 存储体系升级（预计 2-3 天）

### 2.1 IndexedDB 持久化 + 多简历管理 — 痛点 #2

**当前状态：** 所有数据仅存 localStorage，清除浏览器缓存即丢失。一次只能编辑一份简历，历史记录仅 8 条。

**方案：** 引入 IndexedDB 作为主存储，新增简历管理器 UI。

#### 数据模型

```typescript
// src/service/storage.ts（新建）

interface SavedResume {
  id: string;                    // UUID
  name: string;                  // 用户命名的简历名称
  blocks: ResumeBlock[];         // 块数据（source of truth）
  mdContent: string;             // Markdown 内容（冗余，方便搜索）
  theme: string;                 // 主题 ID
  color: string;                 // 主题色
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 最后修改时间戳
  lastPreview?: string;          // 前 100 字符摘要
}

// API
saveResume(id: string, data: SavedResume): Promise<void>
loadResume(id: string): Promise<SavedResume | null>
listResumes(): Promise<SavedResume[]>     // 按 updatedAt 降序
deleteResume(id: string): Promise<void>
migrateFromLocalStorage(): Promise<void>  // 一次性迁移
```

#### 迁移策略

在应用启动时（`App.tsx` 或 store 初始化）：
1. 检查 IndexedDB 中是否有数据
2. 若无，检查 localStorage 中是否存在旧数据（`md-resume`、`md-theme`、`md-color`、`md-history`）
3. 若有，调用 `migrateFromLocalStorage()` 将它们导入 IndexedDB，创建第一条简历记录
4. 旧 localStorage 数据保留（不删除），作为向后兼容

#### 简历管理器 UI

新建 `src/components/ResumeManager/index.tsx`：
- 以 Modal 形式从 HeaderBar 打开
- 列表展示所有已保存简历：名称、最后修改时间、主题标识、内容预览摘要
- 操作按钮：**切换到此简历**、**复制**、**导出 JSON**、**删除**
- 底部操作栏：**新建简历** 按钮
- 空状态：引导文字 + 新建按钮

#### Store 修改

`src/store/template.store.ts` 修改：
- 每次 `setBlocks` → 同时写 IndexedDB（保留写 localStorage 作为双写兼容）
- 初始化时优先读 IndexedDB，fallback localStorage
- 新增 `loadResume(savedResume: SavedResume)` 方法
- 历史记录上限从 8 扩展到 50（存在 IndexedDB 中，不再仅 localStorage）

`src/store/resume-collection.store.ts` 新建：
- 管理简历列表的 MobX store
- `list: SavedResume[]`、`currentId: string`
- `loadList()`、`switchTo(id)`、`createNew()`、`deleteResume(id)`

#### HeaderBar 集成

- 新增「我的简历」按钮（图标 + 下拉/Modal），替代固定的「未命名简历」
- 显示当前简历名称（可从 header block 的 name 字段解析，或从管理器获取）

**关键文件：** `src/service/storage.ts`（新建）| `src/store/resume-collection.store.ts`（新建）| `src/components/ResumeManager/index.tsx`（新建）| `src/store/template.store.ts` | `src/components/HeaderBar/index.tsx`

---

## Phase 3: 数据模型与引导（预计 2 天）

### 3.1 结构化字段支持 — 痛点 #6

**当前状态：** 日期靠自由文本输入格式混乱；技能无等级体系；联系方式类型仅 7 种；无照片支持。

**方案：** 扩展类型定义 + 利用 Ant Design 4 已有组件增强 UI。

#### 类型扩展（`src/types/resume.ts`）

```typescript
// ContactItem 扩展
export interface ContactItem {
  icon: string;
  label: string;
  link?: string;
  type?: 'email' | 'phone' | 'github' | 'blog' | 'juejin' 
       | 'zhihu' | 'csdn' | 'linkedin' | 'website' | 'custom';
}

// HeaderData 扩展
export interface HeaderData {
  name: string;
  title: string;
  photo?: string; // base64 编码的头像
}

// SectionEntry 扩展
export interface SectionEntry {
  id: string;
  title: string;
  subtitle?: string;
  items: SectionItem[];
  dateRange?: { start: string; end: string }; // 结构化日期范围
  skillLevel?: number; // 1-5（仅技能模块使用）
}
```

#### UI 增强

**`TwoColumnBlock.tsx`：**
- `ICON_OPTIONS` 增加 `linkedin`（LinkedIn）和 `website`（个人网站）
- 左侧「个人总结」区新增照片上传（`<input type="file" accept="image/*">` → FileReader → base64）

**`SectionBlock.tsx`：**
- 智能识别模块类型：
  - 当 `title` 包含「教育」「工作」「项目」「经历」→ EntryCard 显示两个 `DatePicker.MonthPicker`（开始/结束），自动从现有 `subtitle` 文本解析已有日期
  - 当 `title` 包含「技能」→ 每行 item 旁显示 Ant Design `Rate` 组件（1-5 星）
- 日期选择结果写回 `subtitle`（保持 Markdown 兼容）：`2020.07 - 至今`

**`HeaderBlock.tsx`：**
- 增加头像上传字段（照片显示为 base64 缩略图预览）

#### 图标补充

`src/utils/svgMap.ts` 新增：
- `linkedin`：LinkedIn logo SVG
- `website`：地球/链接图标 SVG

#### 序列化兼容

- 日期范围 → Markdown：`### 公司名 - 职位（2020.07 - 至今）`（与现有 markdown-it H3 日期解析逻辑完全兼容）
- 技能等级 → Markdown：不序列化（纯 UI 层增强，Markdown 无损失）
- 照片 → Markdown：`![photo](data:image/...;base64,...)`（放在 header name 之前）
- 所有新字段均为 **optional**，旧数据正常加载

**关键文件：** `src/types/resume.ts` | `src/components/BlockEditor/TwoColumnBlock.tsx` | `src/components/BlockEditor/SectionBlock.tsx` | `src/components/BlockEditor/HeaderBlock.tsx` | `src/utils/svgMap.ts`

---

### 3.2 新手引导向导 — 痛点 #9

**当前状态：** 首页仅一句口号 + 一张装饰卡片，没有实际截图或流程说明。`TUTORIALS_GUIDE` 常量定义了教程内容但无 UI 入口。

**方案：** 新建 OnboardingWizard 组件。

**设计：**
- 使用 Ant Design `Modal`（宽度 720px）+ `Steps` 组件
- 5 个步骤，每步有：标题、示意图（可用现有 SVG 素材）、简洁文字说明
- 首次访问自动弹出
- HeaderBar 增加 `?` 图标按钮可随时重开

**步骤内容：**

| 步骤 | 标题 | 内容 |
|------|------|------|
| 1 | 欢迎使用 Open Resume | 产品简介 + 两种编辑器模式（Block / Markdown）说明及切换方式 |
| 2 | 简历模块 | 介绍 4 种 Block 类型：基本信息、联系方式、简历模块、高级内容 |
| 3 | 预览与导出 | 演示实时预览、预览模式、PDF 导出（两种方式） |
| 4 | 主题与配色 | 演示 7 套主题切换、颜色自定义、模板广场 |
| 5 | AI 助手 | 介绍 4 种 AI 任务、如何配置 API Key |

**控制逻辑：**
- localStorage flag `onboarding-completed`：首次访问时未设 → 自动弹出
- 向导完成或关闭时 → 设置 flag
- HeaderBar `QuestionCircleOutlined` 按钮 → 无视 flag 直接打开

**关键文件：** `src/components/OnboardingWizard/index.tsx`（新建）| `src/components/HeaderBar/index.tsx`

---

### 3.3 动态简历名称 — 痛点 #13

**当前状态：** 顶栏恒定显示「未命名简历 .md」。

**方案：** 从 `templateStore.blocks` 解析实际名称。

```typescript
// src/components/HeaderBar/index.tsx 第 291 行附近

// 解析逻辑
const resumeName = useMemo(() => {
  const header = templateStore.blocks.find(b => b.type === 'header');
  if (header) {
    const name = (header.data as HeaderData).name;
    if (name) return `${name}简历`;
  }
  // fallback: 用简历管理器中的名称
  const current = resumeCollectionStore.currentResume;
  if (current) return current.name;
  return '未命名简历';
}, [templateStore.blocks, resumeCollectionStore.currentResume]);
```

注意：如果 Phase 2 先完成了，名称优先用管理器中用户设的名称；如果直接从 header block 解析，也可以做成可点击编辑的（Phase 2 完成后支持重命名）。

**关键文件：** `src/components/HeaderBar/index.tsx`

---

## Phase 4: 深层改进（预计 3-4 天）

### 4.1 Block / Markdown 模式切换优化 — 痛点 #4

**当前状态：** Markdown 模式隐藏在 URL query param (`?mode=md`) 中。Block ↔ Markdown 双向转换是尽力而为的，复杂结构可能丢失。

**方案：**

**A. 显式模式切换器：**
- `src/pages/Main.tsx` 中编辑面板顶部增加 Ant Design `Segmented` 或 `Radio.Group`
- 两个选项：「可视化编辑」|「Markdown 编辑」
- 切换时更新 URL query param（保持 URL 可分享）
- 不在 URL 传参时默认 Block Editor（当前行为不变）

**B. 切换前的安全校验：**
- `src/utils/blockSerializer.ts` 新增函数：
  ```typescript
  function computeRoundTripLoss(blocks: ResumeBlock[]): { 
    lossy: boolean; 
    changeCount: number 
  }
  ```
  原理：`markdownToBlocks(blocksToMarkdown(blocks))` 的结果与原始 `blocks` 做比较（比较 block 数量、类型序列、文本内容差异数量）
- 切换模式时若 `lossy === true`，弹出 `Modal.confirm()`：
  - 「切换模式可能导致部分格式发生变化。是否继续？」
  - 展示简要差异（如「3 个 raw-markdown block 将被合并」「部分嵌套列表格式可能丢失」）
- 用户取消则不切换

**C. 改进序列化器：**
- 提升 subtitle 检测准确率（当前启发式算法对某些边界 case 不准确）
- 将「隔离开的 H3」（无父 H2）的解析逻辑改为更合理的处理

**关键文件：** `src/pages/Main.tsx` | `src/utils/blockSerializer.ts` | `src/components/BlockEditor/index.tsx`

---

### 4.2 可自定义水印 — 痛点 #12

**当前状态：** 导出 PDF 的水印文字硬编码为 "Open Resume"。

**方案：**

1. **`HeaderBar` 导出 Modal**（第 389-417 行）：
   - 将「添加水印」的 `Switch` 改为 `Input` + `Switch` 组合
   - 「水印文字」Input（默认值 "Open Resume"），为空则 `isMark = false`
   - 或者保留 Switch 但增加水印文字 Input（Switch 控制是否显示水印，Input 控制文字内容）

2. **接口扩展**（`src/service/htmlToPdf.ts`）：
   ```typescript
   export interface PdfParams {
     // ... existing fields
     watermarkText?: string; // 新增
   }
   ```

3. **服务端**（`server/index.js` 第 157-173 行）：
   - 读取 `req.body.watermarkText`
   - 将 SVG 中的 `'Open Resume'` 替换为用户提供的文字
   - 为空字符串时不注入 watermark div

4. **客户端打印**（`src/service/printPdf.ts`）：
   - 同样支持在 iframe 中 overlay 自定义水印文字

**关键文件：** `src/components/HeaderBar/index.tsx` | `src/service/htmlToPdf.ts` | `server/index.js` | `src/service/printPdf.ts`

---

### 4.3 AI 功能降低门槛 — 痛点 #5

**当前状态：** 用户必须自行获取 API Key 并手动填入 Base URL 和 Model 名称才能使用 AI 功能。绝大多数普通用户不知道如何操作。

**方案（分两步实现）：**

#### Step A: 预设提供商配置（优先实现）

`src/components/ResumeAiModal/index.tsx` 模型配置 Tab 中：

- 在「模型配置」Tab 顶部添加 `Select` 预设下拉：
  ```
  选项 1: DeepSeek V3 — api.deepseek.com / deepseek-chat
  选项 2: 通义千问 — dashscope.aliyuncs.com / qwen-plus
  选项 3: 智谱 GLM — open.bigmodel.cn / glm-4
  选项 4: OpenAI — api.openai.com / gpt-4o-mini（默认）
  选项 5: 自定义
  ```
- 选择预设后自动填入 Base URL 和 Model，用户只需填写 API Key
- 添加链接：「如何获取免费 API Key？」→ 指向对应平台

#### Step B: 服务端 AI 代理（可选后续）

在 `server/index.js` 增加 `POST /api/ai` 端点：
- 服务端配置 `AI_API_KEY` 环境变量
- 前端若检测到 `REACT_APP_AI_PROXY_URL` 配置，通过代理调用
- 服务端可设置请求频率限制和用量统计

#### AI 结果预览增强

- 在 Markdown 编辑模式下，AI 结果可「插入当前位置」（利用 CodeMirror 的 `replaceRange`，当前已实现）
- 在 Block 编辑模式下，提供一个「预览」按钮在应用前查看差异

**关键文件：** `src/components/ResumeAiModal/index.tsx` | `src/service/ai.ts` | `server/index.js`（Step B）

---

### 4.4 模板内容结构多样化 — 痛点 #7

**当前状态：** `/square` 模板广场 7 套模板实质是同一内容结构套了 7 套不同的配色方案。用户不能获得不同行业或风格的**内容结构**参考。

**方案（分两步实现）：**

#### Step A: CSS 布局变体

新建 2 个主题，通过 CSS 覆盖实现不同布局，但使用相同的 Markdown 内容：

1. **侧边栏主题（sidebar）：**
   - 左侧 1/3 彩色侧边栏（`position: absolute` 或 CSS Grid `grid-template-columns: 1fr 2fr`）
   - 侧边栏内放 contacts + 技能 + 语言等信息
   - 右侧 2/3 放工作经历 + 项目 + 教育
   - 通过不同的 `.rs-view` 类名选择器触发布局切换

2. **时间轴主题（timeline）：**
   - Section Entry（H3）条目前增加时间轴竖线（`border-left`）+ 圆点（`::before` 伪元素）
   - 每个 Entry 缩进排版

在 `const.ts` 的 `themes` 数组中新增 `layoutType` 字段区分布局类型。

#### Step B: 预设内容模板

`data/template.json` 扩展：
- 每个模板可携带 `initialContent`（预设 Markdown 内容片段）
- 模板元数据增加 `industry`（行业）、`experienceLevel`（经验级别）
- 模板列表页面增加筛选：按行业、按经验级别

新增 5 个行业模板：
| 模板 | 行业 | 特点 |
|------|------|------|
| 技术岗标准简历 | 技术 | 突出技术栈、项目经验、开源贡献 |
| 应届生简历 | 通用 | 教育背景优先、实习/竞赛经历、校园活动 |
| 设计岗作品集简历 | 设计 | 作品集链接、设计工具技能矩阵 |
| 金融/咨询简历 | 金融 | 量化成果、证书、学历优先 |
| 管理岗简历 | 管理 | 团队规模、业务指标、战略项目 |

**关键文件：** `public/themes/*.less`（新建布局主题）| `src/utils/const.ts` | `data/template.json` | `src/pages/Square.tsx`

---

## Phase 5: 国际化（持续进行）

### 5.1 中英文双语支持 — 痛点 #14

**当前状态：** 整个 UI 硬编码中文，海外用户或外企求职者无法使用。

**方案：** 轻量自定义 i18n（不引入 `react-intl` 等重依赖）。

#### 架构

```
src/i18n/
  zh-CN.ts    — 中文翻译 key-value 对
  en-US.ts    — 英文翻译 key-value 对
  index.ts    — React Context + useI18n hook
```

```typescript
// src/i18n/index.ts
type Locale = 'zh-CN' | 'en-US';

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

// 使用方式
const { t } = useI18n();
<span>{t('blockEditor.addSection')}</span>  // → "添加模块" / "Add Section"
```

#### 实施策略

**渐进式迁移**（不是一次性全部翻译）：
1. 首先覆盖 `HeaderBar`、`HeaderCommonBar`、`BlockEditor` 中的高频标签
2. 然后覆盖 `OnboardingWizard`、`ResumeManager`、`ResumeAiModal`
3. 后续补全剩余组件

语言偏好存储在 localStorage，`HeaderCommonBar` 增加语言切换下拉。

#### 翻译 Key 命名规范

按组件/页面组织：
```
headerBar.exportPdf, headerBar.aiOptimize, headerBar.preview
blockEditor.addSection, blockEditor.header, blockEditor.twoColumn
home.cta.start, home.cta.browse
...
```

**关键文件：** `src/i18n/index.ts`（新建）| `src/i18n/zh-CN.ts`（新建）| `src/i18n/en-US.ts`（新建）| `src/App.tsx` | `src/components/HeaderCommonBar/index.tsx`

---

## 实现顺序与依赖关系

```
Phase 1: 快速见效（2-3天）         Phase 2: 存储升级（2-3天）
├── 1.1 客户端 PDF 导出            ├── 2.1 IndexedDB + 多简历管理
├── 1.2 编辑器宽度上限             └── （可并行于 Phase 1）
├── 1.3 多模块同时展开
├── 1.4 撤销/重做
└── 1.5 键盘快捷键
         │                              │
         └──────────┬───────────────────┘
                    │
         Phase 3: 数据模型与引导（2天）
         ├── 3.1 结构化字段
         ├── 3.2 新手引导
         └── 3.3 简历名称
                    │
         Phase 4: 深层改进（3-4天）
         ├── 4.1 模式切换优化
         ├── 4.2 自定义水印
         ├── 4.3 AI 预设提供商
         └── 4.4 模板布局多样化
                    │
         Phase 5: i18n（持续）
         └── 5.1 中英文双语
```

Phase 1 与 Phase 2 相互独立，可**并行开发**。其余阶段按序推进。

---

## 验证方案

### 每阶段的通用回归检查

每次改动完成后的必检项：

1. **Block Editor**：增删改查 block、拖拽排序、预览实时更新、颜色变化
2. **Markdown 编辑器**：输入、实时预览、导入/导出 .md 文件
3. **主题系统**：切换 7 套主题、颜色选择器、主题在 localStorage 中的持久化
4. **向后兼容**：旧的 localStorage 数据能否正常加载（不清除浏览器数据直接 npm start）
5. **PDF 导出**：有后端时走 Puppeteer、无后端时走浏览器打印
6. **历史记录**：自动保存、手动恢复

### Phase 1 专项验证

- 关闭后端服务 → 点击导出 PDF → 确认自动走浏览器打印 fallback → 确认 `@page` 规则生效
- 拖拽编辑器右边框至 > 480px → 确认不再受限
- 展开 3 个 section block → 确认它们各自独立折叠
- 修改 5 步操作 → Ctrl+Z 5 次 → 确认逐次撤销 → Ctrl+Shift+Z 3 次 → 确认逐次恢复
- 新操作后 → 确认 redo stack 已清空
- Ctrl+S → 确认显示成功提示

### Phase 2 专项验证

- 创建 3 份简历 → 在管理器中切换 → 确认内容、主题、颜色均正确恢复
- 清除 localStorage → 刷新页面 → 确认 IndexedDB 数据仍在 → 确认旧数据正常显示
- 导出简历 JSON → 删除 → 重新导入 JSON → 确认内容一致
- 首次迁移场景：清除 IndexedDB 但保留 localStorage 旧数据 → 启动 → 确认自动迁移

### Phase 3 专项验证

- 新建「工作经历」section → 添加 Entry → 确认出现月份选择器 → 选择日期 → 确认 subtitle 自动更新
- 新建「技能」section → 添加 item → 确认出现星级评分 → 点击评分 → 确认状态保留
- 添加 Linkedin 联系方式 → 确认预览中图标正确渲染
- 首次访问 → 确认 OnboardingWizard 自动弹出 → 完成/关闭 → 刷新 → 确认不再弹出
- HeaderBar → 确认显示从 header block 解析的名称

### Phase 4 专项验证

- Block 模式切换到 Markdown 模式 → 再切回 → 确认内容一致（无 lossy 警告）
- 构造复杂格式（嵌套列表、特殊字符）→ 切换模式 → 确认有警告提示
- 导出 PDF 时填入自定义水印文字 → 确认 PDF 中显示正确
- 选择 DeepSeek 预设 → 输入免费 API Key → 运行润色 → 确认生成结果

### Phase 5 专项验证

- 切换语言为 English → 确认 HeaderBar、BlockEditor、预览面板标签全部切换
- 切换回中文 → 确认复原
- 刷新 → 确认语言偏好保留

---

## 附录：关键技术栈参考

| 层 | 技术 | 版本 |
|----|------|------|
| 前端框架 | React + TypeScript | 17.x |
| 状态管理 | MobX | 6.x |
| UI 组件库 | Ant Design | 4.x |
| Markdown 解析 | markdown-it | - |
| 拖拽 | @dnd-kit/core | - |
| CSS 预处理 | Less + Gulp | Less 3.x |
| 打包 | Webpack (ejected CRA) | 4.x |
| 后端 | Express + Puppeteer | - |
