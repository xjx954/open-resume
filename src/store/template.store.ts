import { makeAutoObservable } from "mobx";
import { INIT_COLOR, INIT_CONTENT, LOCAL_STORE, resolveThemeId } from '@utils/const';
import { ResumeEditorRef, setHtmlView } from '@src/utils/global';
import { ResumeBlock } from '@src/types/resume';
import { blocksToMarkdown, markdownToBlocks, sanitizeBlock } from '@src/utils/blockSerializer';

const storedTheme = localStorage.getItem(LOCAL_STORE.MD_THEME);
const default_theme = resolveThemeId(storedTheme);
if (storedTheme && storedTheme !== default_theme) {
  localStorage.setItem(LOCAL_STORE.MD_THEME, default_theme);
}

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

function cloneBlocks(blocks: ResumeBlock[]): ResumeBlock[] {
  return JSON.parse(JSON.stringify(blocks));
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
  undoStack: ResumeBlock[][] = [];
  redoStack: ResumeBlock[][] = [];
  maxUndo = 50;

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

  pushUndo = () => {
    this.undoStack.push(cloneBlocks(this.blocks));
    if (this.undoStack.length > this.maxUndo) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  setMdContent = (content: string, recordUndo = true) => {
    if (recordUndo) {
      this.pushUndo();
    }
    this.mdContent = content;
    this.blocks = this.blocks.map(sanitizeBlock);
    persistBlocks(this.blocks, content);
    this.syncPreview();
  }

  setHtml = (value: string) => {
    this.html = value;
  }

  setEditorRef = (ref: ResumeEditorRef | null) => {
    this.editorRef = ref;
  }

  incrementEditorCount = () => {
    this.editorCount++;
  }

  // ——— Block manipulation ————

  setBlocks = (blocks: ResumeBlock[], recordUndo = true) => {
    if (recordUndo) {
      this.pushUndo();
    }
    const nextBlocks = blocks.map(sanitizeBlock);
    this.blocks = nextBlocks;
    persistBlocks(nextBlocks, blocksToMarkdown(nextBlocks));
    this.syncPreview();
  }

  undo = () => {
    const previous = this.undoStack.pop();
    if (!previous) return;
    this.redoStack.push(cloneBlocks(this.blocks));
    this.setBlocks(previous, false);
  }

  redo = () => {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(cloneBlocks(this.blocks));
    this.setBlocks(next, false);
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
