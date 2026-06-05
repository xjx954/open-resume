import { ResumeImportSectionKey, ResumeSchema, ResumeSchemaEntry } from './resumeImportTypes';

const SECTION_ORDER: ResumeImportSectionKey[] = [
  'education',
  'work',
  'projects',
  'skills',
  'research',
  'unclassified',
];

function entryTitle(entry: ResumeSchemaEntry): string {
  return [entry.name || '未命名经历', entry.role, entry.date]
    .map(part => (part || '').trim())
    .join(' | ');
}

function pushEntry(lines: string[], entry: ResumeSchemaEntry) {
  lines.push(`### ${entryTitle(entry)}`);
  if (entry.bullets.length > 0) {
    lines.push('');
    entry.bullets.forEach(item => lines.push(`- ${item}`));
  }
}

export function normalizeResumeToMarkdown(resume: ResumeSchema): string {
  const lines: string[] = [`# ${resume.basicInfo.name || '未命名简历'}`];

  if (resume.basicInfo.title) {
    lines.push('', resume.basicInfo.title);
  }

  if (resume.basicInfo.summary.length > 0 || resume.contacts.length > 0) {
    lines.push('', '::: left');
    if (resume.basicInfo.summary.length > 0) {
      lines.push('', ...resume.basicInfo.summary);
    }
    lines.push('', ':::', '', '::: right');
    if (resume.contacts.length > 0) {
      lines.push('', ...resume.contacts);
    }
    lines.push('', ':::');
  }

  SECTION_ORDER.forEach(key => {
    if (key === 'unclassified' && resume.unparsedBlocks.length === 0) return;

    const section = resume.sections[key];
    if (!section) return;
    if (section.entries.length === 0 && section.items.length === 0) return;

    lines.push('', `## ${section.title}`);

    if (section.items.length > 0) {
      lines.push('');
      section.items.forEach(item => lines.push(`- ${item}`));
    }

    section.entries.forEach(entry => {
      lines.push('');
      pushEntry(lines, entry);
    });
  });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
