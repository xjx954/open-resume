import { parseResumeText } from './resumeParser';
import { normalizeResumeToMarkdown } from './resumeNormalizer';
import { ResumeImportPreview, ResumeImportResult, ResumeImportSectionKey } from './resumeImportTypes';

const PREVIEW_SECTION_ORDER: ResumeImportSectionKey[] = [
  'education',
  'work',
  'projects',
  'skills',
  'research',
  'unclassified',
];

function buildImportPreview(schema: ResumeImportResult['schema']): ResumeImportPreview {
  return {
    basicInfo: schema.basicInfo,
    contacts: schema.contacts,
    sections: PREVIEW_SECTION_ORDER.map(key => ({
      key,
      title: schema.sections[key].title,
      entryCount: schema.sections[key].entries.length,
      itemCount: schema.sections[key].items.length,
    })),
    unparsedBlocks: schema.unparsedBlocks,
  };
}

export function importMarkdownResume(input: string): ResumeImportResult {
  const schema = parseResumeText(input);
  return {
    parsed: schema,
    schema,
    preview: buildImportPreview(schema),
    markdown: normalizeResumeToMarkdown(schema),
  };
}
