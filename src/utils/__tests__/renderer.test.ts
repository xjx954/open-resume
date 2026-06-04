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
    expect(html).toContain('</h3><span class="entry-date resume-entry-date">2020.09-2024.06</span></div>');
    expect(html).not.toContain('</div></h3>');
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

  it('renders pipe-separated H3 as a stable three-column entry row', () => {
    const html = markdownParserResume.render('### 星河科技 | AI 应用工程师 | 2024.03-至今\n\n- item');
    expect(html).toContain('resume-entry-row resume-entry-row-3');
    expect(html).toContain('<span class="resume-entry-main">星河科技</span>');
    expect(html).toContain('<span class="resume-entry-role">AI 应用工程师</span>');
    expect(html).toContain('<span class="resume-entry-date">2024.03-至今</span>');
  });

  it('renders pipe-separated H3 as a stable two-column entry row', () => {
    const html = markdownParserResume.render('### 智能测评平台 | 2024.06-2024.12\n\n- item');
    expect(html).toContain('resume-entry-row resume-entry-row-2');
    expect(html).toContain('<span class="resume-entry-main">智能测评平台</span>');
    expect(html).toContain('<span class="resume-entry-date">2024.06-2024.12</span>');
  });

  it('renders sidebar and main containers for the two-column resume layout', () => {
    const html = markdownParserResume.render(
      '::: sidebar\n\n## 技能\n\n- Python\n\n:::\n\n::: main\n\n## 工作经历\n\n- item\n\n:::'
    );
    expect(html).toContain('resume-layout resume-layout--two-column');
    expect(html).toContain('resume-sidebar');
    expect(html).toContain('resume-main');
  });

  it('keeps main sections inside the two-column main container', () => {
    const html = markdownParserResume.render(
      '# Name\n\n::: sidebar\n\n## Contact\n\nShanghai\n\n## Education\n\n### School | Degree | 2020-2024\n\n- item\n\n:::\n\n::: main\n\n## Work\n\n### Company | Role | 2024-Present\n\n- item\n\n:::'
    );
    const mainStart = html.indexOf('<main class="resume-main">');
    const workStart = html.indexOf('Work');
    const layoutEnd = html.indexOf('</main></div>');

    expect(mainStart).toBeGreaterThan(-1);
    expect(workStart).toBeGreaterThan(mainStart);
    expect(layoutEnd).toBeGreaterThan(workStart);
    expect(html).not.toContain('<main class="resume-main"></main>');
  });
});
