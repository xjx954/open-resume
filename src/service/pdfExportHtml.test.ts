import {
  A4_HEIGHT_PX,
  chooseResumeDensity,
  getCleanExportHtml,
  paginateMeasuredBlocks,
} from './pdfExportHtml';

describe('pdf export html helpers', () => {
  test('clones export html, removes split markers, and keeps preformatted newlines', () => {
    document.body.innerHTML = `
      <div class="resume-pages" style="transform: scale(0.75); transform-origin: top left;">
        <div class="resume-page">
          <h1>Resume</h1>
          <pre><code>line 1
line 2</code></pre>
          <div class="rs-view resume-density-tight" style="width: 1200px; transform: scale(0.6); transform-origin: top left; color: red;">
            content
          </div>
          <div class="rs-line-split"></div>
        </div>
      </div>
    `;

    const root = document.querySelector('.resume-pages') as HTMLElement;
    const html = getCleanExportHtml(root);

    expect(html).toContain('line 1\nline 2');
    expect(html).not.toContain('rs-line-split');
    expect(html).not.toContain('transform');
    expect(html).not.toContain('1200px');
    expect(html).toContain('resume-page');
    expect(html).toContain('resume-density-tight');
    expect(html).toContain('color: red');
    expect(root.querySelector('.rs-line-split')).not.toBeNull();
  });

  test('chooses the first density preset that fits one page', () => {
    expect(chooseResumeDensity({
      normal: 1400,
      compact: 1200,
      tight: 1080,
      'ultra-tight': 980,
    })).toEqual({
      density: 'tight',
      contentHeight: 1080,
      pageHeight: A4_HEIGHT_PX,
      canFitOnePage: true,
    });
  });

  test('keeps ultra-tight and recommends two pages when no density fits', () => {
    expect(chooseResumeDensity({
      normal: 2200,
      compact: 1900,
      tight: 1500,
      'ultra-tight': 1300,
    })).toEqual({
      density: 'ultra-tight',
      contentHeight: 1300,
      pageHeight: A4_HEIGHT_PX,
      canFitOnePage: false,
    });
  });

  test('paginates top-level blocks without losing content', () => {
    const pages = paginateMeasuredBlocks([
      { html: '<section>A</section>', height: 600 },
      { html: '<section>B</section>', height: 600 },
      { html: '<section>C</section>', height: 300 },
    ], 1000, 0);

    expect(pages.map(page => page.html)).toEqual([
      '<section>A</section>',
      '<section>B</section><section>C</section>',
    ]);
  });

  test('splits oversized blocks by child fragments', () => {
    const pages = paginateMeasuredBlocks([
      {
        html: '<section><h2>Project</h2><p>one</p><p>two</p></section>',
        height: 1300,
        wrapperTag: 'section',
        wrapperAttributes: 'class="block h2_block"',
        children: [
          { html: '<h2>Project</h2>', height: 120 },
          { html: '<p>one</p>', height: 540 },
          { html: '<p>two</p>', height: 540 },
        ],
      },
    ], 700, 0);

    expect(pages.map(page => page.html)).toEqual([
      '<section class="block h2_block"><h2>Project</h2><p>one</p></section>',
      '<section class="block h2_block"><p>two</p></section>',
    ]);
  });

  test('keeps nested section blocks when splitting an oversized parent block', () => {
    const pages = paginateMeasuredBlocks([
      {
        html: '<div class="h1_block block"><h1>Name</h1><div class="h2_block block">Education</div><div class="h2_block block">Projects</div></div>',
        height: 1500,
        wrapperTag: 'div',
        wrapperAttributes: 'class="h1_block block"',
        children: [
          { html: '<h1>Name</h1>', height: 120 },
          { html: '<div class="h2_block block">Education</div>', height: 540 },
          { html: '<div class="h2_block block">Projects</div>', height: 540 },
        ],
      },
    ], 700, 0);

    expect(pages.map(page => page.html).join('')).toContain('Name');
    expect(pages.map(page => page.html).join('')).toContain('Education');
    expect(pages.map(page => page.html).join('')).toContain('Projects');
    expect(pages).toHaveLength(2);
  });

  test('splits a block into remaining page space before continuing on next page', () => {
    const pages = paginateMeasuredBlocks([
      { html: '<section>Intro</section>', height: 500 },
      {
        html: '<section><h2>Experience</h2><p>one</p><p>two</p></section>',
        height: 600,
        wrapperTag: 'section',
        wrapperAttributes: 'class="block h2_block"',
        children: [
          { html: '<h2>Experience</h2>', height: 100 },
          { html: '<p>one</p>', height: 250 },
          { html: '<p>two</p>', height: 250 },
        ],
      },
    ], 800, 0);

    expect(pages.map(page => page.html)).toEqual([
      '<section>Intro</section><section class="block h2_block"><h2>Experience</h2><p>one</p></section>',
      '<section class="block h2_block"><p>two</p></section>',
    ]);
  });
});
