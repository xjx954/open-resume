export type ResumeImportSectionKey =
  | 'education'
  | 'work'
  | 'projects'
  | 'skills'
  | 'research'
  | 'unclassified';

export interface ResumeSchemaEntry {
  name: string;
  role: string;
  date: string;
  bullets: string[];
}

export interface ResumeSchemaSection {
  title: string;
  entries: ResumeSchemaEntry[];
  items: string[];
}

export interface ResumeSchema {
  basicInfo: {
    name: string;
    title: string;
    summary: string[];
  };
  contacts: string[];
  sections: Record<ResumeImportSectionKey, ResumeSchemaSection>;
  unparsedBlocks: string[];
}

export type ParsedResumeEntry = ResumeSchemaEntry;
export type ParsedResumeSection = ResumeSchemaSection;
export type ParsedResume = ResumeSchema;

export interface ResumeImportPreview {
  basicInfo: ResumeSchema['basicInfo'];
  contacts: string[];
  sections: Array<{
    key: ResumeImportSectionKey;
    title: string;
    entryCount: number;
    itemCount: number;
  }>;
  unparsedBlocks: string[];
}

export interface ResumeImportResult {
  parsed: ResumeSchema;
  schema: ResumeSchema;
  preview: ResumeImportPreview;
  markdown: string;
}
