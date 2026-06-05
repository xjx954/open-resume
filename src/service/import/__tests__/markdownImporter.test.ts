import { importMarkdownResume } from '../markdownImporter';
import { isIgnorableLine, normalizeMarkdown, splitSections } from '../resumeParser';

describe('normalizeMarkdown', () => {
  it('normalizes full-width spaces, CRLF, repeated spaces, and blank lines', () => {
    expect(normalizeMarkdown('### 项目　名称\r\n角色：  负责人\r\n\r\n\r\n-  内容')).toBe(
      '### 项目 名称\n角色： 负责人\n\n- 内容'
    );
  });
});

describe('isIgnorableLine', () => {
  it('ignores layout syntax, image tags, empty bullets, and blank lines', () => {
    expect(isIgnorableLine('　　')).toBe(true);
    expect(isIgnorableLine('-')).toBe(true);
    expect(isIgnorableLine('-   ')).toBe(true);
    expect(isIgnorableLine('*')).toBe(true);
    expect(isIgnorableLine('•')).toBe(true);
    expect(isIgnorableLine('-\u200B')).toBe(true);
    expect(isIgnorableLine('::: left')).toBe(true);
    expect(isIgnorableLine('<img class="resume-photo" src="avatar.png" alt="photo">')).toBe(true);
    expect(isIgnorableLine('- <img class="resume-photo" src="avatar.png" alt="photo">')).toBe(true);
    expect(isIgnorableLine('- ![avatar](avatar.png)')).toBe(true);
    expect(isIgnorableLine('left')).toBe(true);
    expect(isIgnorableLine('right')).toBe(true);
    expect(isIgnorableLine('可接受远程协作')).toBe(false);
  });
});

describe('splitSections', () => {
  it('recognizes Chinese and English section titles', () => {
    const sections = splitSections(`## Education
### A University

## Experience
### A Company

## Projects
### A Project

## Skills
React

## Awards
奖项`);

    expect(sections.sections.map(section => section.key)).toEqual([
      'education',
      'work',
      'projects',
      'skills',
      'research',
    ]);
  });
});

describe('importMarkdownResume', () => {
  it('keeps standard Open Resume markdown in editable structured form', () => {
    const result = importMarkdownResume(`# 张三

前端工程师

::: left

上海 | 5 年经验

:::

::: right

zhangsan@example.com

:::

## 工作经历

### A 公司 | 前端工程师 | 2022.01-至今

- 负责组件库建设
`);

    expect(result.schema.basicInfo.name).toBe('张三');
    expect(result.schema.basicInfo.title).toBe('前端工程师');
    expect(result.schema.basicInfo.summary).toEqual(['上海 | 5 年经验']);
    expect(result.schema.contacts).toEqual(['zhangsan@example.com']);
    expect(result.schema.sections.work.entries[0]).toMatchObject({
      name: 'A 公司',
      role: '前端工程师',
      date: '2022.01-至今',
      bullets: ['负责组件库建设'],
    });
    expect(result.markdown).toContain('### A 公司 | 前端工程师 | 2022.01-至今');
  });

  it('parses project heading format A without losing title or order', () => {
    const result = importMarkdownResume(`# 李四

## Project

### RAG Workflow：知识库问答平台 项目负责人 2024.01-2024.12

- 搭建检索增强生成流程

### RGB-D SLAM 与 SOLOv2 标注工具 核心成员 2023.03-2023.10

- 负责数据处理模块
`);

    const projects = result.schema.sections.projects.entries;
    expect(projects).toHaveLength(2);
    expect(projects[0]).toMatchObject({
      name: 'RAG Workflow：知识库问答平台',
      role: '项目负责人',
      date: '2024.01-2024.12',
      bullets: ['搭建检索增强生成流程'],
    });
    expect(projects[1]).toMatchObject({
      name: 'RGB-D SLAM 与 SOLOv2 标注工具',
      role: '核心成员',
      date: '2023.03-2023.10',
      bullets: ['负责数据处理模块'],
    });
    expect(result.markdown.indexOf('RAG Workflow')).toBeLessThan(result.markdown.indexOf('RGB-D SLAM'));
  });

  it('parses project heading format B with role and date metadata lines', () => {
    const result = importMarkdownResume(`# 王五

## 项目经历

### AI 简历导入工具
角色：前端负责人
时间：2024.05-2024.08
- 设计导入确认流程
- 输出结构化简历内容
`);

    expect(result.schema.sections.projects.entries[0]).toMatchObject({
      name: 'AI 简历导入工具',
      role: '前端负责人',
      date: '2024.05-2024.08',
      bullets: ['设计导入确认流程', '输出结构化简历内容'],
    });
  });

  it('does not drop project title when role or date cannot be parsed', () => {
    const result = importMarkdownResume(`# 赵六

## Projects

### Workflow: RAG/RGB-D + SOLOv2 数据闭环
- 保留复杂标题
`);

    expect(result.schema.sections.projects.entries[0]).toMatchObject({
      name: 'Workflow: RAG/RGB-D + SOLOv2 数据闭环',
      role: '',
      date: '',
      bullets: ['保留复杂标题'],
    });
  });

  it('puts unknown content into unparsedBlocks and unclassified instead of dropping it', () => {
    const result = importMarkdownResume(`# 孙七

## 其他说明
可接受远程协作
`);

    expect(result.schema.unparsedBlocks).toContain('## 其他说明\n可接受远程协作');
    expect(result.schema.sections.unclassified.items).toContain('## 其他说明\n可接受远程协作');
    expect(result.markdown).toContain('## 未归类内容');
    expect(result.markdown).toContain('- ## 其他说明\n可接受远程协作');
    expect(result.preview.unparsedBlocks).toEqual(result.schema.unparsedBlocks);
  });

  it('does not create unclassified content from old layout noise', () => {
    const result = importMarkdownResume(`# 钱八

<img class="resume-photo" src="avatar.png" alt="photo">

## 旧版布局
::: left
-
*
•
left
right
<img src="avatar.png">
::: right

## 教育背景
### 浙江大学 | 计算机科学 本科 | 2018.09-2022.06
- GPA 3.8/4.0
`);

    expect(result.schema.unparsedBlocks).toEqual([]);
    expect(result.schema.sections.unclassified.items).toEqual([]);
    expect(result.markdown).not.toContain('## 未归类内容');
    expect(result.markdown).not.toContain('- -');
    expect(result.schema.sections.education.entries[0]).toMatchObject({
      name: '浙江大学',
      role: '计算机科学 本科',
      date: '2018.09-2022.06',
      bullets: ['GPA 3.8/4.0'],
    });
  });

  it('drops previously generated empty unclassified sections', () => {
    const result = importMarkdownResume(`# 相静轩

AI 应用开发工程师

## 未归类内容
-
- <img src="avatar.png">
- ![avatar](avatar.png)
left
right
:::

## 教育背景 / Education
### 重庆大学 985 / 211 / 双一流，电子信息类 硕士 2022.09-2025.06
- 自动化学院，研究方向包含视觉 SLAM
`);

    expect(result.schema.unparsedBlocks).toEqual([]);
    expect(result.schema.sections.unclassified.items).toEqual([]);
    expect(result.markdown).not.toContain('## 未归类内容');
    expect(result.markdown).not.toContain('\n- \n');
    expect(result.schema.sections.education.entries[0]).toMatchObject({
      name: '重庆大学 985 / 211 / 双一流',
      role: '电子信息类 硕士',
      date: '2022.09-2025.06',
      bullets: ['自动化学院，研究方向包含视觉 SLAM'],
    });
  });

  it('filters ignorable lines before storing meaningful unparsed blocks', () => {
    const result = importMarkdownResume(`# 周九

## 其他说明
::: left
-
left
可接受远程协作
<img src="avatar.png">
:::
`);

    expect(result.schema.unparsedBlocks).toEqual(['## 其他说明\n可接受远程协作']);
    expect(result.markdown).toContain('## 未归类内容');
    expect(result.markdown).toContain('可接受远程协作');
    expect(result.markdown).not.toContain('<img');
    expect(result.markdown).not.toContain('::: left');
  });
});
