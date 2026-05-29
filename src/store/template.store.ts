import { makeAutoObservable } from "mobx";
import { INIT_COLOR, INIT_CONTENT, LOCAL_STORE, themes } from '@utils/const';
import { ResumeEditorRef, setHtmlView } from '@src/utils/global';
import { ResumeBlock } from '@src/types/resume';
import { blocksToMarkdown, markdownToBlocks, sanitizeBlock } from '@src/utils/blockSerializer';

const default_theme = localStorage.getItem(LOCAL_STORE.MD_THEME) || themes[0].id;

const localContent = localStorage.getItem(LOCAL_STORE.MD_RESUME);

function loadBlocks(): ResumeBlock[] {
  // Prefer cached blocks JSON for fast restore
  const blocksJson = localStorage.getItem(LOCAL_STORE.MD_BLOCKS);
  if (blocksJson) {
    try {
      return (JSON.parse(blocksJson) as ResumeBlock[]).map(sanitizeBlock);
    } catch { /* fall through */ }
  }
  // Parse from Markdown
  const md = localContent || INIT_CONTENT;
  return markdownToBlocks(md).map(sanitizeBlock);
}

function persistBlocks(blocks: ResumeBlock[], mdContent: string) {
  localStorage.setItem(LOCAL_STORE.MD_RESUME, mdContent);
  try {
    localStorage.setItem(LOCAL_STORE.MD_BLOCKS, JSON.stringify(blocks));
  } catch { /* quota exceeded, non-critical */ }
}

class TemplateStore {
  theme = default_theme;
  tempTheme = default_theme;
  color = INIT_COLOR;
  html = '';
  isPreview = false;

  // Block model (the source of truth for block editor)
  blocks: ResumeBlock[] = loadBlocks();

  // Non-observable editor reference and edit counter
  editorRef: ResumeEditorRef | null = null;
  editorCount: number = Number(localStorage.getItem(LOCAL_STORE.MD_COUNT)) || 0;

  constructor() {
    makeAutoObservable(this, {
      editorRef: false,
      editorCount: false,
    });
    this.syncPreview();
  }

  // mdContent bridges blocks ↔ Markdown for backward compat
  get mdContent(): string {
    return blocksToMarkdown(this.blocks);
  }
  set mdContent(value: string) {
    this.blocks = markdownToBlocks(value);
  }

  setPreview = (value: boolean) => {
    this.isPreview = value;
  }

  setTempTheme = (theme: string) => {
    this.tempTheme = theme;
  }

  setTheme = (theme: string) => {
    this.theme = theme;
  }

  setColor = (color: string) => {
    this.color = color;
    localStorage.setItem(LOCAL_STORE.MD_COLOR, color);
    document.body.style.setProperty("--bg", color);
    this.syncPreview();
  };

  // Sync preview HTML from current blocks + color
  syncPreview = () => {
    this.html = setHtmlView(this.color, this.mdContent);
  }

  setMdContent = (content: string) => {
    this.mdContent = content;
    this.blocks = this.blocks.map(sanitizeBlock);
    persistBlocks(this.blocks, content);
    this.syncPreview();
  }

  setHtml = (value: string) => {
    this.html = value;
  }

  setEditorRef = (ref: ResumeEditorRef) => {
    this.editorRef = ref;
  }

  incrementEditorCount = () => {
    this.editorCount++;
  }

  // ——— Block manipulation ————

  setBlocks = (blocks: ResumeBlock[]) => {
    this.blocks = blocks.map(sanitizeBlock);
    persistBlocks(blocks, blocksToMarkdown(blocks));
    this.syncPreview();
  }

  addBlock = (block: ResumeBlock, index?: number) => {
    const next = [...this.blocks];
    if (index !== undefined && index >= 0 && index <= next.length) {
      next.splice(index, 0, block);
    } else {
      next.push(block);
    }
    this.setBlocks(next);
  }

  removeBlock = (id: string) => {
    this.setBlocks(this.blocks.filter(b => b.id !== id));
  }

  reorderBlocks = (fromIndex: number, toIndex: number) => {
    const next = [...this.blocks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    this.setBlocks(next);
  }

  updateBlock = (id: string, data: ResumeBlock['data']) => {
    this.setBlocks(
      this.blocks.map(b => (b.id === id ? { ...b, data } : b))
    );
  }

}

export default TemplateStore;
