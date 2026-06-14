export type ResumeBlock =
  | HeaderBlock
  | TwoColumnBlock
  | SectionBlock
  | RawMarkdownBlock;

export interface HeaderBlock {
  id: string;
  type: 'header';
  data: HeaderData;
}

export interface TwoColumnBlock {
  id: string;
  type: 'two-column';
  data: TwoColumnData;
}

export interface SectionBlock {
  id: string;
  type: 'section';
  data: SectionData;
}

export interface RawMarkdownBlock {
  id: string;
  type: 'raw-markdown';
  data: RawMarkdownData;
}

export interface HeaderData {
  name: string;
  title: string;
  photo?: string;
}

export interface TwoColumnData {
  left: ColumnContent;
  right: ColumnContent;
}

export interface ColumnContent {
  text: string;
  contacts: ContactItem[];
}

export interface ContactItem {
  icon: string;
  label: string;
  link?: string;
  type?: 'email' | 'phone' | 'github' | 'blog' | 'juejin' | 'zhihu' | 'csdn' | 'linkedin' | 'website' | 'custom';
}

export interface SectionEntry {
  id: string;
  title: string;
  subtitle?: string;
  items: SectionItem[];
}

export interface SectionData {
  level: 2;
  title: string;
  subtitle?: string;
  items: SectionItem[];
  entries: SectionEntry[];
}

export interface SectionItem {
  type: 'bullet' | 'text';
  content: string;
}

export interface RawMarkdownData {
  markdown: string;
}
