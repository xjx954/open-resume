export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1122;

export type PdfLayoutMode = 'normal' | 'smart-one-page';
export type ResumeDensity = 'normal' | 'compact' | 'tight' | 'ultra-tight';

export const RESUME_DENSITY_ORDER: ResumeDensity[] = ['normal', 'compact', 'tight', 'ultra-tight'];

export const RESUME_DENSITY_LABELS: Record<ResumeDensity, string> = {
  normal: '正常模式',
  compact: '紧凑模式',
  tight: '高紧凑模式',
  'ultra-tight': '极限紧凑模式',
};

export const RESUME_DENSITY_CSS = `
.rs-view.resume-density-normal {
  --resume-page-padding-x: 44px;
  --resume-page-padding-y: 48px;
  --resume-body-font-size: 14.2px;
  --resume-line-height: 1.44;
  --resume-section-gap: 12px;
  --resume-entry-gap: 6px;
  --resume-bullet-gap: 2px;
  --resume-title-gap: 7px;
}
.rs-view.resume-density-compact {
  --resume-page-padding-x: 38px;
  --resume-page-padding-y: 40px;
  --resume-body-font-size: 13.6px;
  --resume-line-height: 1.36;
  --resume-section-gap: 9px;
  --resume-entry-gap: 4px;
  --resume-bullet-gap: 1px;
  --resume-title-gap: 5px;
}
.rs-view.resume-density-tight {
  --resume-page-padding-x: 32px;
  --resume-page-padding-y: 34px;
  --resume-body-font-size: 12.8px;
  --resume-line-height: 1.3;
  --resume-section-gap: 7px;
  --resume-entry-gap: 3px;
  --resume-bullet-gap: 0px;
  --resume-title-gap: 4px;
}
.rs-view.resume-density-ultra-tight {
  --resume-page-padding-x: 28px;
  --resume-page-padding-y: 28px;
  --resume-body-font-size: 12px;
  --resume-line-height: 1.24;
  --resume-section-gap: 5px;
  --resume-entry-gap: 2px;
  --resume-bullet-gap: 0px;
  --resume-title-gap: 3px;
}
.rs-view[class*="resume-density-"] {
  min-height: auto !important;
}
.rs-view[class*="resume-density-"] .h1_block {
  padding: var(--resume-page-padding-y) var(--resume-page-padding-x) var(--resume-section-gap) !important;
}
.rs-view[class*="resume-density-"] .h2_block {
  padding: 0 var(--resume-page-padding-x) var(--resume-section-gap) !important;
}
.rs-view[class*="resume-density-"] .h3_block {
  padding-bottom: var(--resume-entry-gap) !important;
}
.rs-view[class*="resume-density-"] .h2_block + .h2_block {
  padding-top: 0 !important;
}
.rs-view[class*="resume-density-"] .h3_block + .h3_block {
  padding-top: var(--resume-entry-gap) !important;
}
.rs-view[class*="resume-density-"] .lr-container,
.rs-view[class*="resume-density-"] .resume-layout--two-column {
  padding-left: var(--resume-page-padding-x) !important;
  padding-right: var(--resume-page-padding-x) !important;
}
.rs-view[class*="resume-density-"] .resume-section-title,
.rs-view[class*="resume-density-"] h2 {
  margin-bottom: var(--resume-title-gap) !important;
}
.rs-view[class*="resume-density-"] .entry-header {
  margin-bottom: var(--resume-bullet-gap) !important;
}
.rs-view[class*="resume-density-"] p,
.rs-view[class*="resume-density-"] ul li,
.rs-view[class*="resume-density-"] ol li {
  font-size: var(--resume-body-font-size) !important;
  line-height: var(--resume-line-height) !important;
}
.rs-view[class*="resume-density-"] ul,
.rs-view[class*="resume-density-"] ol {
  margin-bottom: var(--resume-bullet-gap) !important;
}
`;

export const RESUME_PAGE_CSS = `
.resume-pages {
  width: ${A4_WIDTH_PX}px;
}
.resume-page {
  width: ${A4_WIDTH_PX}px;
  min-height: ${A4_HEIGHT_PX}px;
  background: #fff;
  break-after: page;
  page-break-after: always;
}
.resume-page:last-child {
  break-after: auto;
  page-break-after: auto;
}
.rs-line-split {
  display: none !important;
}
`;

export type ResumeDensityHeights = Record<ResumeDensity, number>;

export interface ResumeDensityResult {
  density: ResumeDensity;
  contentHeight: number;
  pageHeight: number;
  canFitOnePage: boolean;
}

export interface MeasuredResumeBlock {
  html: string;
  height: number;
  children?: MeasuredResumeBlock[];
  wrapperTag?: string;
  wrapperAttributes?: string;
}

export interface ResumePageHtml {
  html: string;
  height: number;
}

interface ResumeBlockWrapper {
  tag: string;
  attributes?: string;
}

interface ResumeFlowFragment {
  html: string;
  height: number;
  wrappers: ResumeBlockWrapper[];
}

interface ResumeRenderNode {
  wrapper?: ResumeBlockWrapper;
  html?: string;
  children?: ResumeRenderNode[];
}

const HEADING_KEEP_WITH_NEXT_TOLERANCE = 80;

export function getResumeDensityClass(density: ResumeDensity) {
  return `resume-density-${density}`;
}

export function chooseResumeDensity(
  heights: ResumeDensityHeights,
  pageHeight = A4_HEIGHT_PX,
): ResumeDensityResult {
  for (const density of RESUME_DENSITY_ORDER) {
    const contentHeight = heights[density];
    if (Number.isFinite(contentHeight) && contentHeight <= pageHeight) {
      return { density, contentHeight, pageHeight, canFitOnePage: true };
    }
  }

  const density: ResumeDensity = 'ultra-tight';
  return {
    density,
    contentHeight: heights[density],
    pageHeight,
    canFitOnePage: false,
  };
}

function getBlockWrapper(block: MeasuredResumeBlock): ResumeBlockWrapper | null {
  if (!block.wrapperTag) return null;
  return {
    tag: block.wrapperTag,
    attributes: block.wrapperAttributes,
  };
}

function flattenMeasuredBlock(
  block: MeasuredResumeBlock,
  parentWrappers: ResumeBlockWrapper[] = [],
): ResumeFlowFragment[] {
  const wrapper = getBlockWrapper(block);
  const wrappers = wrapper ? [...parentWrappers, wrapper] : parentWrappers;

  if (block.children?.length) {
    return block.children.flatMap(child => flattenMeasuredBlock(child, wrappers));
  }

  return [{
    html: block.html,
    height: block.height,
    wrappers: parentWrappers,
  }];
}

function areSameWrapper(a: ResumeBlockWrapper, b: ResumeBlockWrapper) {
  return a.tag === b.tag && (a.attributes || '') === (b.attributes || '');
}

function appendFragmentNode(nodes: ResumeRenderNode[], fragment: ResumeFlowFragment) {
  let siblings = nodes;
  fragment.wrappers.forEach(wrapper => {
    const last = siblings[siblings.length - 1];
    if (last?.wrapper && areSameWrapper(last.wrapper, wrapper)) {
      siblings = last.children || (last.children = []);
      return;
    }
    const next: ResumeRenderNode = { wrapper, children: [] };
    siblings.push(next);
    siblings = next.children as ResumeRenderNode[];
  });
  siblings.push({ html: fragment.html });
}

function renderNodes(nodes: ResumeRenderNode[]): string {
  return nodes.map(node => {
    if (!node.wrapper) return node.html || '';
    const attributes = node.wrapper.attributes ? ` ${node.wrapper.attributes}` : '';
    return `<${node.wrapper.tag}${attributes}>${renderNodes(node.children || [])}</${node.wrapper.tag}>`;
  }).join('');
}

function renderFragments(fragments: ResumeFlowFragment[]) {
  const nodes: ResumeRenderNode[] = [];
  fragments.forEach(fragment => appendFragmentNode(nodes, fragment));
  return renderNodes(nodes);
}

function hasSameWrappers(a: ResumeFlowFragment, b: ResumeFlowFragment) {
  if (a.wrappers.length !== b.wrappers.length) return false;
  return a.wrappers.every((wrapper, index) => areSameWrapper(wrapper, b.wrappers[index]));
}

function isHeadingFragment(fragment: ResumeFlowFragment) {
  return /^<h[1-6](\s|>)/i.test(fragment.html.trim());
}

function shouldKeepWithPreviousHeading(
  currentFragments: ResumeFlowFragment[],
  nextFragment: ResumeFlowFragment,
  nextHeight: number,
  currentHeight: number,
  pageHeight: number,
) {
  const previous = currentFragments[currentFragments.length - 1];
  if (!previous || !isHeadingFragment(previous) || !hasSameWrappers(previous, nextFragment)) return false;
  return currentHeight + nextHeight <= pageHeight + HEADING_KEEP_WITH_NEXT_TOLERANCE;
}

export function paginateMeasuredBlocks(
  blocks: MeasuredResumeBlock[],
  pageHeight = A4_HEIGHT_PX,
  buffer = 8,
): ResumePageHtml[] {
  const fragments = blocks.flatMap(block => flattenMeasuredBlock(block));
  if (!fragments.length) return [{ html: '', height: 0 }];

  const pages: ResumePageHtml[] = [];
  let currentFragments: ResumeFlowFragment[] = [];
  let currentHeight = 0;

  fragments.forEach(fragment => {
    const fragmentHeight = fragment.height + buffer;
    const overflowsPage = currentHeight + fragmentHeight > pageHeight;
    const keepWithHeading = overflowsPage && shouldKeepWithPreviousHeading(
      currentFragments,
      fragment,
      fragmentHeight,
      currentHeight,
      pageHeight,
    );

    if (currentFragments.length && overflowsPage && !keepWithHeading) {
      pages.push({ html: renderFragments(currentFragments), height: currentHeight });
      currentFragments = [];
      currentHeight = 0;
    }

    currentFragments.push(fragment);
    currentHeight += fragmentHeight;
  });

  if (currentFragments.length) {
    pages.push({ html: renderFragments(currentFragments), height: currentHeight });
  }

  return pages;
}

export function getCleanExportHtml(root: HTMLElement | null) {
  if (!root) return '';

  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.rs-line-split').forEach(item => item.parentNode?.removeChild(item));
  clone.querySelectorAll('.resume-pages').forEach(item => {
    const el = item as HTMLElement;
    el.style.removeProperty('transform');
    el.style.removeProperty('transform-origin');
    if (!el.getAttribute('style')?.trim()) {
      el.removeAttribute('style');
    }
  });
  clone.querySelectorAll('.rs-view').forEach(item => {
    const el = item as HTMLElement;
    el.style.removeProperty('width');
    el.style.removeProperty('transform');
    el.style.removeProperty('transform-origin');
    if (!el.getAttribute('style')?.trim()) {
      el.removeAttribute('style');
    }
  });
  return clone.innerHTML.replace(/>\s+</g, '><').trim();
}

export function waitForResumeLayout() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
