import {
  ResumeImportSectionKey,
  ResumeSchema,
  ResumeSchemaEntry,
  ResumeSchemaSection,
} from './resumeImportTypes';

const SECTION_TITLES: Record<ResumeImportSectionKey, string> = {
  education: '教育背景',
  work: '工作经历',
  projects: '项目经历',
  skills: '专业技能',
  research: '科研成果与荣誉',
  unclassified: '未归类内容',
};

const SECTION_ALIASES: Array<{ key: ResumeImportSectionKey; re: RegExp }> = [
  { key: 'education', re: /^(教育背景|教育经历|教育|学历|education)$/i },
  { key: 'work', re: /^(工作经历|工作经验|实习经历|职业经历|experience|work experience|employment)$/i },
  { key: 'projects', re: /^(项目经历|项目经验|项目|project|projects)$/i },
  { key: 'skills', re: /^(专业技能|技能|技术栈|skills|technical skills)$/i },
  { key: 'research', re: /^(科研成果与荣誉|科研与荣誉|科研成果|荣誉奖项|奖项|论文|awards|honors|research)$/i },
  { key: 'unclassified', re: /^(未归类内容|未归类|未分类|其他|其它|unclassified|other|others)$/i },
];

const DATE_RE = /((?:\d{4}(?:[./-]\d{1,2})?|至今|现在|present|current|now)\s*(?:(?:-|–|—|~|至|到)\s*(?:\d{4}(?:[./-]\d{1,2})?|至今|现在|present|current|now))?)/i;
const CONTACT_RE = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s-]{6,}\d|(?:https?:\/\/)?(?:github\.com|linkedin\.com|[a-z0-9-]+\.[a-z]{2,})\/?\S*)/i;
const BULLET_RE = /^[-*+•]\s+/;
const META_ROLE_RE = /^(角色|职位|职务|岗位|学历|role|position|title|degree)\s*[:：]\s*(.+)$/i;
const META_DATE_RE = /^(时间|日期|任职时间|项目时间|date|time|period)\s*[:：]\s*(.+)$/i;
const ROLE_SUFFIX_RE = /\s+(项目负责人|负责人|核心成员|主要成员|独立开发|前端开发|后端开发|全栈开发|算法工程师|研发工程师|开发工程师|测试工程师|产品经理|设计师|实习生|本科|硕士|博士|role|owner|lead|member|developer|engineer|intern)$/i;

interface SectionBlock {
  key: ResumeImportSectionKey | null;
  title: string;
  lines: string[];
}

export function normalizeMarkdown(input: string): string {
  return input
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u3000/g, ' ')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function isIgnorableLine(line: string): boolean {
  const raw = line
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u3000/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
  if (!raw) return true;
  if (/^[-*+•]\s*$/.test(raw)) return true;
  if (/^:::/i.test(raw)) return true;
  if (/^<img\b[^>]*>\s*$/i.test(raw)) return true;
  if (/^[-*+•]\s*<img\b[^>]*>\s*$/i.test(raw)) return true;
  if (/^!\[[^\]]*]\([^)]+\)\s*$/.test(raw)) return true;
  if (/^[-*+•]\s*!\[[^\]]*]\([^)]+\)\s*$/.test(raw)) return true;

  const withoutHeading = raw.replace(/^\s{0,3}#{1,6}\s+/, '').trim();
  if (/^(left|right|sidebar|main)$/i.test(withoutHeading)) return true;

  const cleaned = cleanLine(raw).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (!cleaned) return true;
  return /^(left|right|sidebar|main)$/i.test(cleaned);
}

function emptySection(key: ResumeImportSectionKey): ResumeSchemaSection {
  return { title: SECTION_TITLES[key], entries: [], items: [] };
}

function createEmptySchema(): ResumeSchema {
  return {
    basicInfo: { name: '', title: '', summary: [] },
    contacts: [],
    sections: {
      education: emptySection('education'),
      work: emptySection('work'),
      projects: emptySection('projects'),
      skills: emptySection('skills'),
      research: emptySection('research'),
      unclassified: emptySection('unclassified'),
    },
    unparsedBlocks: [],
  };
}

function cleanLine(line: string): string {
  return line
    .replace(/<[^>]+>/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/, '')
    .replace(BULLET_RE, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function getHeading(line: string): { level: number; text: string } | null {
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  if (!match) return null;
  return { level: match[1].length, text: cleanLine(match[2]) };
}

function detectSection(text: string): ResumeImportSectionKey | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const candidates = [
    normalized,
    ...normalized.split(/\s*(?:\/|\||｜|:|：|-|–|—)\s*/),
  ].map(item => item.trim()).filter(Boolean);
  const found = SECTION_ALIASES.find(item => candidates.some(candidate => item.re.test(candidate)));
  return found ? found.key : null;
}

export function splitSections(markdown: string): { introLines: string[]; sections: SectionBlock[] } {
  const lines = markdown.split('\n');
  const introLines: string[] = [];
  const sections: SectionBlock[] = [];
  let current: SectionBlock | null = null;

  lines.forEach(line => {
    if (isIgnorableLine(line)) return;
    const heading = getHeading(line);
    if (heading && heading.level === 2 && heading.text.trim()) {
      current = {
        key: detectSection(heading.text),
        title: heading.text,
        lines: [],
      };
      sections.push(current);
      return;
    }

    if (current) {
      current.lines.push(line);
    } else {
      introLines.push(line);
    }
  });

  return {
    introLines,
    sections: sections.filter(section =>
      section.title.trim() && section.lines.some(line => !isIgnorableLine(line))
    ),
  };
}

function parseIntro(lines: string[], schema: ResumeSchema) {
  lines.filter(line => !isIgnorableLine(line)).forEach(rawLine => {
    const heading = getHeading(rawLine);
    const text = heading ? heading.text : cleanLine(rawLine);
    if (!text) return;

    if (!schema.basicInfo.name && heading?.level === 1) {
      const entry = parseInlineEntryTitle(text);
      schema.basicInfo.name = entry.name;
      schema.basicInfo.title = entry.role;
      return;
    }

    if (!schema.basicInfo.name && text.length <= 40 && !CONTACT_RE.test(text)) {
      schema.basicInfo.name = text;
      return;
    }

    if (CONTACT_RE.test(text) || /(电话|手机|邮箱|微信|github|linkedin|博客|网站)/i.test(text)) {
      schema.contacts.push(text);
      return;
    }

    if (!schema.basicInfo.title && text.length <= 100) {
      schema.basicInfo.title = text;
      return;
    }

    schema.basicInfo.summary.push(text);
  });
}

function parseInlineEntryTitle(title: string): ResumeSchemaEntry {
  const text = cleanLine(title).replace(/\s+/g, ' ');
  const dateMatch = text.match(DATE_RE);
  const date = dateMatch ? dateMatch[1].trim() : '';
  const withoutDate = date ? text.replace(date, '').trim() : text;
  const normalized = withoutDate.replace(/[|｜,，;；\-–—~至到\s]+$/g, '').trim();
  const parts = normalized
    .split(/\s*(?:\||｜| - | – | — |，|,)\s*/)
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return { name: parts[0], role: parts.slice(1).join(' / '), date, bullets: [] };
  }

  const roleMatch = normalized.match(ROLE_SUFFIX_RE);
  if (roleMatch) {
    return {
      name: normalized.slice(0, roleMatch.index).trim() || normalized,
      role: roleMatch[1].trim(),
      date,
      bullets: [],
    };
  }

  return { name: normalized || text || '未命名经历', role: '', date, bullets: [] };
}

function pushEntry(section: ResumeSchemaSection, entry: ResumeSchemaEntry | null) {
  if (!entry) return;
  section.entries.push({
    name: entry.name || '未命名经历',
    role: entry.role || '',
    date: entry.date || '',
    bullets: entry.bullets,
  });
}

function parseEntrySection(lines: string[], section: ResumeSchemaSection) {
  let current: ResumeSchemaEntry | null = null;

  lines.forEach(rawLine => {
    if (isIgnorableLine(rawLine)) return;
    const heading = getHeading(rawLine);
    const text = heading ? heading.text : cleanLine(rawLine);
    if (!text) return;

    if (heading && heading.level >= 3) {
      pushEntry(section, current);
      current = parseInlineEntryTitle(text);
      return;
    }

    if (current) {
      current.bullets.push(text);
    } else {
      section.items.push(text);
    }
  });

  pushEntry(section, current);
}

function parseProjectSection(lines: string[], section: ResumeSchemaSection) {
  let current: ResumeSchemaEntry | null = null;

  lines.forEach(rawLine => {
    if (isIgnorableLine(rawLine)) return;
    const heading = getHeading(rawLine);
    const text = heading ? heading.text : cleanLine(rawLine);
    if (!text) return;

    if (heading && heading.level >= 3) {
      pushEntry(section, current);
      current = parseInlineEntryTitle(text);
      return;
    }

    if (!current) {
      section.items.push(text);
      return;
    }

    const roleMatch = text.match(META_ROLE_RE);
    if (roleMatch) {
      current.role = roleMatch[2].trim();
      return;
    }

    const dateMatch = text.match(META_DATE_RE);
    if (dateMatch) {
      current.date = dateMatch[2].trim();
      return;
    }

    if (BULLET_RE.test(rawLine)) {
      current.bullets.push(text);
      return;
    }

    current.bullets.push(text);
  });

  pushEntry(section, current);
}

function parseItemSection(lines: string[], section: ResumeSchemaSection) {
  lines.forEach(rawLine => {
    if (isIgnorableLine(rawLine)) return;
    const heading = getHeading(rawLine);
    const text = heading ? heading.text : cleanLine(rawLine);
    if (text) section.items.push(text);
  });
}

function addUnparsedBlock(schema: ResumeSchema, block: string) {
  const normalized = block
    .split('\n')
    .filter(line => !isIgnorableLine(line))
    .join('\n')
    .trim();
  if (!normalized) return;
  schema.unparsedBlocks.push(normalized);
  schema.sections.unclassified.items.push(normalized);
}

function parseSection(block: SectionBlock, schema: ResumeSchema) {
  if (!block.key || block.key === 'unclassified') {
    addUnparsedBlock(schema, [`## ${block.title}`, ...block.lines].join('\n'));
    return;
  }

  const section = schema.sections[block.key];
  if (block.key === 'projects') {
    parseProjectSection(block.lines, section);
    return;
  }

  if (block.key === 'skills' || block.key === 'research') {
    parseItemSection(block.lines, section);
    return;
  }

  parseEntrySection(block.lines, section);
}

export function parseResumeText(input: string): ResumeSchema {
  const normalized = normalizeMarkdown(input);
  const schema = createEmptySchema();
  const { introLines, sections } = splitSections(normalized);

  parseIntro(introLines, schema);
  sections.forEach(section => parseSection(section, schema));

  if (!schema.basicInfo.name) {
    schema.basicInfo.name = '未命名简历';
  }

  return schema;
}
