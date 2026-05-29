export interface ResumeBlock {
  id: string;
  type: 'header' | 'two-column' | 'section' | 'raw-markdown';
  data: HeaderData | TwoColumnData | SectionData | RawMarkdownData;
}

export interface HeaderData {
  name: string;
  title: string;
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
