import { markdownParserResume } from '../helper';

describe('markdown-it heading renderers', () => {
  it('adds resume-section-title class to h2', () => {
    const html = markdownParserResume.render('## 教育背景\n\n- item');
    expect(html).toContain('resume-section-title');
  });

  it('adds entry-title class to h3', () => {
    const html = markdownParserResume.render('### 项目名称\n\n- item');
    expect(html).toContain('entry-title');
  });

  it('extracts trailing parenthesized date into entry-header wrapper', () => {
    const html = markdownParserResume.render('### 学校名称（2020.09-2024.06）\n\n- item');
    expect(html).toContain('entry-header');
    expect(html).toContain('entry-date');
    expect(html).toContain('2020.09-2024.06');
    expect(html).not.toContain('（2020.09-2024.06）');
  });

  it('does NOT create entry-header when no date', () => {
    const html = markdownParserResume.render('### 项目名称\n\n- item');
    expect(html).not.toContain('entry-header');
    expect(html).not.toContain('entry-date');
  });

  it('handles half-width parentheses dates', () => {
    const html = markdownParserResume.render('### Company - Role (2020.07-Present)\n\n- item');
    expect(html).toContain('entry-header');
    expect(html).toContain('entry-date');
    expect(html).toContain('2020.07-Present');
  });

  it('extracts any trailing parenthesized text as date', () => {
    const html = markdownParserResume.render('### 项目名称（内部）\n\n- item');
    // Trailing parenthesized content at end of h3 is always treated as date
    expect(html).toContain('entry-date');
    expect(html).toContain('内部');
  });

  it('leaves h3 unchanged when no trailing parentheses', () => {
    const html = markdownParserResume.render('### 公司名称 - 后端工程师\n\n- item');
    expect(html).toContain('entry-title');
    expect(html).toContain('公司名称 - 后端工程师');
  });
});
