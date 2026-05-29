export const themes = [
  {
    id: "default",
    defaultColor: "#39393a",
    name: "默认",
    src: "/images/theme-default.svg",
    isColor: true,
    defaultUrl: "",
  },
  {
    id: "blue",
    defaultColor: "#5974D4",
    name: "极简色",
    src: "/images/theme-blue.svg",
    isColor: true,
    defaultUrl: "",
  },
  {
    id: "orange",
    defaultColor: "#39393a",
    name: "朝阳黄",
    src: "/images/theme-orange.svg",
    isColor: false,
    defaultUrl: "",
  },
  {
    id: "pupple",
    defaultColor: "#36448f",
    name: "全彩风",
    src: "/images/theme-pupple.svg",
    isColor: true,
    defaultUrl: "",
  },
  {
    id: "mono",
    defaultColor: "#222222",
    name: "黑白专业",
    src: "/images/theme-mono.svg",
    isColor: true,
    defaultUrl: "",
  },
  {
    id: "green",
    defaultColor: "#1f7a5c",
    name: "清爽技术",
    src: "/images/theme-green.svg",
    isColor: true,
    defaultUrl: "",
  },
  {
    id: "academic-blue",
    defaultColor: "#2e557a",
    name: "蓝线校招",
    src: "/images/theme-academic-blue.svg",
    isColor: true,
    defaultUrl: "",
  },
];

export const LOCAL_STORE = {
  MD_RESUME: "md-resume",
  MD_COUNT: "md-count",
  MD_THEME: "md-theme",
  MD_COLOR: "md-color",
  MD_THEME_LIST: "md-theme-list",
  MD_UPDATE_LOG: "md-update-log",
  MD_HISTORY: "md-history",
  MD_BLOCKS: "md-blocks-v2",
};

export const INIT_COLOR =
  localStorage.getItem(LOCAL_STORE.MD_COLOR) || "#39393a";


export const UPDATE_LOG_VERSION = 4;

export const INIT_CONTENT = `
# 你的姓名

求职岗位

::: left

具备 X 年经验的工程师，专注于高质量交付和持续改进。

:::

::: right

[icon:email yourname@example.com](mailto:yourname@example.com)

[icon:github github.com/yourname](https://github.com/yourname)

:::

## 工作经历

### 公司名称 - 职位（202X.07-至今）

\`关键词\` \`关键词\` \`关键词\`

- 负责核心业务模块的设计和开发，支撑日均 N 万用户使用
- 抽象通用组件和工具函数，降低新业务页面开发成本
- 优化关键路径性能，核心页面加载时间从 A 降至 B

### 公司名称 - 职位（202X.03-202X.06）

- 参与多个项目的迭代开发和需求交付
- 编写单元测试和集成测试，保证功能稳定性

## 项目经历

### 项目名称

- 背景：项目要解决什么问题，面向什么用户
- 行动：你负责的具体工作、技术选型和关键决策
- 结果：上线后的业务指标、效率提升或用户反馈

## 技能

- 前端：HTML、CSS、JavaScript、TypeScript、React
- 工程化：Webpack、Vite、Git、CI/CD
- 后端基础：Node.js、数据库

## 教育背景

### 学校名称 - 专业名称（20XX.09-20XX.06）

本科 / 硕士 | 可填写 GPA、排名、奖学金、相关课程

`;

export const TUTORIALS_GUIDE = `
## 1. 标题层级怎么写？

建议使用**一级标题**来写简历开头，格式为：姓名 + 求职岗位

例如：

\\# 张三 - 前端工程师

内容部分建议使用**二级标题**来组织：

\\## 个人优势

\\## 工作经历

\\## 项目经历

\\## 技能


## 2. 如何写左右结构？

使用自定义容器语法实现双栏布局：

\\:\\:\\: left
左侧内容（联系方式等）
\\:\\:\\:

\\:\\:\\: right
右侧内容
\\:\\:\\:


## 3. 如何更换主题和主题色？

点击顶部工具栏「选择模板」，可以切换 7 套视觉主题。部分主题标记了「可换色」，点击左下角颜色按钮可以自定义主题色。


## 4. 遇到导出失败怎么办？

建议重新点击导出 PDF。如多次失败，请检查网络连接或稍后再试。

`;

export const UPDATE_CONTENT = `
## 更新日志

后续更新内容将在此处展示。欢迎提交 Issue 或 PR 参与项目改进。

`;
