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
  MD_BLOCKS: "md-blocks",
};

export const INIT_COLOR =
  localStorage.getItem(LOCAL_STORE.MD_COLOR) || "#39393a";


export const UPDATE_LOG_VERSION = 4;

export const INIT_CONTENT = `
# 你的姓名 - 求职岗位

::: left

个人简介或一句话描述你的职业优势

:::

::: right

[icon:email yourname@example.com](mailto:yourname@example.com)

[icon:github github.com/yourname](https://github.com/yourname)

icon:phone 138-0000-0000

:::

## 个人优势

- 熟练使用相关技术栈，具备独立开发和解决问题的能力
- 注重代码质量和可维护性，有良好的编码习惯
- 良好的团队协作和沟通能力

## 工作经历

### 公司名称 - 职位（202X.07-至今）

- 负责核心业务模块的开发和维护
- 参与系统架构设计和技术方案评审
- 优化页面性能和用户体验

### 公司名称 - 职位（202X.03-202X.06）

- 参与多个项目的迭代开发
- 编写单元测试和集成测试

## 项目经历

### 项目名称

- 负责前端架构设计和核心功能开发
- 解决关键技术难点，提升系统稳定性

## 技能

- 前端：HTML、CSS、JavaScript、TypeScript、React
- 工程化：Webpack、Vite、Git、CI/CD
- 后端基础：Node.js、数据库

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
