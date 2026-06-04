import {
  blocksToMarkdown,
  markdownToBlocks,
  blockToMarkdown,
} from '../blockSerializer';
import { ResumeBlock, HeaderData, TwoColumnData, SectionData, RawMarkdownData } from '@src/types/resume';

describe('blockToMarkdown', () => {
  it('serializes header block', () => {
    const block: ResumeBlock = {
      id: '1',
      type: 'header',
      data: { name: '张三', title: '前端工程师' } as HeaderData,
    };
    expect(blockToMarkdown(block)).toBe('# 张三\n\n前端工程师');
  });

  it('serializes header block without title', () => {
    const block: ResumeBlock = {
      id: '1',
      type: 'header',
      data: { name: '张三', title: '' } as HeaderData,
    };
    expect(blockToMarkdown(block)).toBe('# 张三');
  });

  it('serializes two-column block', () => {
    const block: ResumeBlock = {
      id: '1',
      type: 'two-column',
      data: {
        left: {
          text: '个人简介',
          contacts: [],
        },
        right: {
          text: '',
          contacts: [
            { icon: 'email', label: 'test@example.com', link: 'mailto:test@example.com' },
            { icon: 'phone', label: '138-0000-0000' },
          ],
        },
      } as TwoColumnData,
    };
    const md = blockToMarkdown(block);
    expect(md).toContain('::: left');
    expect(md).toContain('::: right');
    expect(md).toContain(':::');
    expect(md).toContain('个人简介');
    expect(md).toContain('[icon:email test@example.com](mailto:test@example.com)');
    expect(md).toContain('icon:phone 138-0000-0000');
  });

  it('serializes section block with bullets', () => {
    const block: ResumeBlock = {
      id: '1',
      type: 'section',
      data: {
        level: 2 as const,
        title: '个人优势',
        items: [
          { type: 'bullet' as const, content: '熟练掌握 React' },
          { type: 'bullet' as const, content: '良好的团队协作' },
        ],
        entries: [],
      } as SectionData,
    };
    const md = blockToMarkdown(block);
    expect(md).toBe('## 个人优势\n\n- 熟练掌握 React\n- 良好的团队协作');
  });

  it('serializes section block with entries', () => {
    const block: ResumeBlock = {
      id: '1',
      type: 'section',
      data: {
        level: 2 as const,
        title: '工作经历',
        items: [],
        entries: [
          {
            id: 'e1',
            title: '某科技公司 - 前端工程师',
            subtitle: '2020-至今',
            items: [
              { type: 'bullet' as const, content: '负责核心业务开发' },
            ],
          },
        ],
      } as SectionData,
    };
    const md = blockToMarkdown(block);
    expect(md).toContain('## 工作经历');
    expect(md).toContain('### 某科技公司 - 前端工程师');
    expect(md).toContain('2020-至今');
    expect(md).toContain('- 负责核心业务开发');
  });

  it('serializes raw-markdown block', () => {
    const block: ResumeBlock = {
      id: '1',
      type: 'raw-markdown',
      data: { markdown: '## 自定义内容\n\n一些**复杂**格式' } as RawMarkdownData,
    };
    expect(blockToMarkdown(block)).toBe('## 自定义内容\n\n一些**复杂**格式');
  });
});

describe('blocksToMarkdown', () => {
  it('joins multiple blocks with double newlines', () => {
    const blocks: ResumeBlock[] = [
      {
        id: '1',
        type: 'header',
        data: { name: '张三', title: '前端工程师' } as HeaderData,
      },
      {
        id: '2',
        type: 'section',
        data: {
          level: 2,
          title: '技能',
          items: [{ type: 'bullet', content: 'React' }],
        } as SectionData,
      },
    ];
    const md = blocksToMarkdown(blocks);
    expect(md).toBe('# 张三\n\n前端工程师\n\n## 技能\n\n- React');
  });
});

describe('markdownToBlocks — header', () => {
  it('parses H1 with name and title', () => {
    const blocks = markdownToBlocks('# 张三 - 前端工程师');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('header');
    expect((blocks[0].data as HeaderData).name).toBe('张三');
    expect((blocks[0].data as HeaderData).title).toBe('前端工程师');
  });

  it('parses H1 without title', () => {
    const blocks = markdownToBlocks('# 张三');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('header');
    expect((blocks[0].data as HeaderData).name).toBe('张三');
    expect((blocks[0].data as HeaderData).title).toBe('');
  });

  it('parses new format: # Name followed by title on separate line', () => {
    const md = ['# 张三', '', '前端工程师', '', '## 技能', '', '- React'].join('\n');
    const blocks = markdownToBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('header');
    const headerData = blocks[0].data as HeaderData;
    expect(headerData.name).toBe('张三');
    expect(headerData.title).toBe('前端工程师');
    expect(blocks[1].type).toBe('section');
  });

  it('parses new format: H1 with dash still works for backward compatibility', () => {
    const blocks = markdownToBlocks('# 张三 - 前端工程师\n\n## 技能\n\n- React');
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('header');
    const headerData = blocks[0].data as HeaderData;
    expect(headerData.name).toBe('张三');
    expect(headerData.title).toBe('前端工程师');
  });
});

describe('markdownToBlocks — two-column', () => {
  it('parses ::: left / ::: right container', () => {
    const md = [
      '::: left',
      '',
      '个人简介',
      '',
      ':::',
      '',
      '::: right',
      '',
      '[icon:email test@example.com](mailto:test@example.com)',
      '',
      'icon:phone 138-0000-0000',
      '',
      ':::',
    ].join('\n');

    const blocks = markdownToBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('two-column');

    const data = blocks[0].data as TwoColumnData;
    expect(data.left.text).toContain('个人简介');
    expect(data.right.contacts).toHaveLength(2);
    expect(data.right.contacts[0]).toEqual({
      icon: 'email',
      label: 'test@example.com',
      link: 'mailto:test@example.com',
    });
    expect(data.right.contacts[1]).toEqual({
      icon: 'phone',
      label: '138-0000-0000',
    });
  });
});

describe('markdownToBlocks — sections', () => {
  it('parses H2 with bullet items', () => {
    const md = [
      '## 个人优势',
      '',
      '- 熟练掌握 React',
      '- 良好的团队协作能力',
    ].join('\n');

    const blocks = markdownToBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('section');

    const data = blocks[0].data as SectionData;
    expect(data.level).toBe(2);
    expect(data.title).toBe('个人优势');
    expect(data.items).toHaveLength(2);
    expect(data.items[0]).toEqual({ type: 'bullet', content: '熟练掌握 React' });
    expect(data.items[1]).toEqual({ type: 'bullet', content: '良好的团队协作能力' });
  });

  it('wraps standalone H3 as section with entry', () => {
    const md = [
      '### 某科技公司 - 前端工程师',
      '2020-至今',
      '',
      '- 负责核心业务开发',
      '- 参与架构设计',
    ].join('\n');

    const blocks = markdownToBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('section');

    const data = blocks[0].data as SectionData;
    expect(data.level).toBe(2);
    expect(data.title).toBe('某科技公司 - 前端工程师');
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].title).toBe('某科技公司 - 前端工程师');
    expect(data.entries[0].subtitle).toBe('2020-至今');
    expect(data.entries[0].items).toHaveLength(2);
  });

  it('parses H2 with nested H3 entries', () => {
    const md = [
      '## 工作经历',
      '',
      '### 公司A - 前端（2020-至今）',
      '',
      '- 负责核心业务',
      '',
      '### 公司B - 实习生（2019-2020）',
      '',
      '- 参与项目迭代',
    ].join('\n');

    const blocks = markdownToBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('section');

    const data = blocks[0].data as SectionData;
    expect(data.level).toBe(2);
    expect(data.title).toBe('工作经历');
    expect(data.entries).toHaveLength(2);
    expect(data.entries[0].title).toBe('公司A - 前端（2020-至今）');
    expect(data.entries[0].items).toHaveLength(1);
    expect(data.entries[1].title).toBe('公司B - 实习生（2019-2020）');
    expect(data.entries[1].items).toHaveLength(1);
  });

  it('parses consecutive sections', () => {
    const md = [
      '## 技能',
      '- React',
      '- TypeScript',
      '',
      '## 工作经历',
      '- 负责核心业务',
    ].join('\n');

    const blocks = markdownToBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('section');
    expect((blocks[0].data as SectionData).title).toBe('技能');
    expect(blocks[1].type).toBe('section');
    expect((blocks[1].data as SectionData).title).toBe('工作经历');
  });
});

describe('markdownToBlocks — raw-markdown fallback', () => {
  it('collects unrecognized content as raw-markdown', () => {
    const md = '这是一段无法识别的文本\n没有标题也没有容器';
    const blocks = markdownToBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('raw-markdown');
    expect((blocks[0].data as RawMarkdownData).markdown).toBe('这是一段无法识别的文本\n没有标题也没有容器');
  });

  it('handles mixed recognized and unrecognized content', () => {
    const md = [
      '# 张三 - 前端',
      '',
      '这是一段介于标题和章节之间的自由文本',
      '',
      '## 技能',
      '- React',
    ].join('\n');

    const blocks = markdownToBlocks(md);
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    expect(blocks[0].type).toBe('header');
    expect(blocks[1].type).toBe('raw-markdown');
    expect(blocks[2].type).toBe('section');
  });
});

describe('round-trip: markdown → blocks → markdown', () => {
  it('preserves standard resume structure', () => {
    const original = [
      '# 张三 - 前端工程师',
      '',
      '::: left',
      '',
      '个人简介',
      '',
      ':::',
      '',
      '::: right',
      '',
      '[icon:email test@example.com](mailto:test@example.com)',
      '',
      ':::',
      '',
      '## 个人优势',
      '',
      '- 熟练掌握 React',
      '- 良好的团队协作能力',
      '',
      '## 工作经历',
      '',
      '### 公司A - 前端工程师（2020-至今）',
      '',
      '- 负责核心业务开发',
      '- 参与架构设计',
      '',
      '### 公司B - 前端实习生（2019-2020）',
      '',
      '- 参与项目迭代',
    ].join('\n');

    const blocks = markdownToBlocks(original);
    const roundTripped = blocksToMarkdown(blocks);

    // Every block type should be present
    const types = blocks.map(b => b.type);
    expect(types).toContain('header');
    expect(types).toContain('two-column');

    // work-history section should exist and contain 2 entries
    const workSection = blocks.find(
      b => b.type === 'section' && (b.data as SectionData).title === '工作经历',
    );
    expect(workSection).toBeDefined();
    const workData = workSection!.data as SectionData;
    expect(workData.entries).toHaveLength(2);
    expect(workData.entries[0].title).toBe('公司A - 前端工程师（2020-至今）');
    expect(workData.entries[1].title).toBe('公司B - 前端实习生（2019-2020）');

    // Re-parse round-tripped output
    const blocks2 = markdownToBlocks(roundTripped);
    // Same number of blocks
    expect(blocks2.length).toBe(blocks.length);

    // Verify round-trip preserves entries
    const workSection2 = blocks2.find(
      b => b.type === 'section' && (b.data as SectionData).title === '工作经历',
    );
    expect(workSection2).toBeDefined();
    expect((workSection2!.data as SectionData).entries).toHaveLength(2);
  });

  it('preserves raw-markdown content after round-trip', () => {
    const md = '一些 **Markdown** 内容\n\n- 不是真正的列表项';
    const blocks = markdownToBlocks(md);
    expect(blocks[0].type).toBe('raw-markdown');
    const roundTripped = blocksToMarkdown(blocks);
    expect(roundTripped).toBe(md);
  });

  it('preserves sidebar/main containers as raw markdown for theme-specific layouts', () => {
    const md = [
      '# 张三',
      '',
      '::: sidebar',
      '',
      '## 技能',
      '',
      '技能分类：Python / React',
      '',
      ':::',
      '',
      '::: main',
      '',
      '## 工作经历',
      '',
      '### 公司 | 职位 | 2024.01-至今',
      '',
      '- 负责核心业务',
      '',
      ':::',
    ].join('\n');

    const blocks = markdownToBlocks(md);
    const roundTripped = blocksToMarkdown(blocks);
    expect(roundTripped).toContain('::: sidebar');
    expect(roundTripped).toContain('::: main');
    expect(roundTripped).toContain('### 公司 | 职位 | 2024.01-至今');
  });
});

describe('empty and edge cases', () => {
  it('returns empty array for empty string', () => {
    expect(markdownToBlocks('')).toEqual([]);
  });

  it('returns empty string for empty blocks array', () => {
    expect(blocksToMarkdown([])).toBe('');
  });

  it('handles whitespace-only input', () => {
    const blocks = markdownToBlocks('   \n\n  \n');
    expect(blocks).toEqual([]);
  });

  it('handles Windows-style line endings', () => {
    const blocks = markdownToBlocks('# 张三 - 前端工程师\r\n\r\n## 技能\r\n\r\n- React');
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('header');
    expect(blocks[1].type).toBe('section');
  });
});
