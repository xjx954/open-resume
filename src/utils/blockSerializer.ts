import {
  ResumeBlock,
  HeaderData,
  TwoColumnData,
  SectionData,
  SectionEntry,
  SectionItem,
  RawMarkdownData,
  ContactItem,
  ColumnContent,
} from '@src/types/resume';

// ============================================================
// ID generator (lightweight, no uuid dep needed for MVP)
// ============================================================

function generateId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

// ============================================================
// Data sanitization — strip HTML tags from plain-text fields
// ============================================================

const HTML_TAG_RE = /<[^>]*>/g;

function sanitizeText(text: string): string {
  return text.replace(HTML_TAG_RE, '').trim();
}

function sanitizeHeaderData(data: HeaderData): HeaderData {
  return {
    name: sanitizeText(data.name),
    title: sanitizeText(data.title),
    photo: data.photo, // preserve photo (data URL, not user-entered text)
  };
}

function sanitizeSectionData(data: SectionData): SectionData {
  const sanitizeItems = (items: SectionItem[]) =>
    items.map(item => ({ ...item, content: sanitizeText(item.content) }));
  return {
    ...data,
    title: sanitizeText(data.title),
    subtitle: data.subtitle ? sanitizeText(data.subtitle) : undefined,
    items: sanitizeItems(data.items),
    entries: (data.entries || []).map(entry => ({
      ...entry,
      title: sanitizeText(entry.title),
      subtitle: entry.subtitle ? sanitizeText(entry.subtitle) : undefined,
      items: sanitizeItems(entry.items),
    })),
  };
}

function sanitizeTwoColumnData(data: TwoColumnData): TwoColumnData {
  const sanitizeColumn = (col: ColumnContent): ColumnContent => ({
    text: sanitizeText(col.text),
    contacts: col.contacts.map(c => ({
      ...c,
      label: sanitizeText(c.label),
      link: c.link ? sanitizeText(c.link) : undefined,
    })),
  });
  return {
    left: sanitizeColumn(data.left),
    right: sanitizeColumn(data.right),
  };
}

/** Strip HTML from all text fields in a block. Safe to call on any data. */
export function sanitizeBlock(block: ResumeBlock): ResumeBlock {
  switch (block.type) {
    case 'header':
      return { ...block, data: sanitizeHeaderData(block.data as HeaderData) };
    case 'section':
      return { ...block, data: sanitizeSectionData(block.data as SectionData) };
    case 'two-column':
      return { ...block, data: sanitizeTwoColumnData(block.data as TwoColumnData) };
    default:
      return block;
  }
}

// ============================================================
// blocks → Markdown
// ============================================================

export function blockToMarkdown(block: ResumeBlock): string {
  switch (block.type) {
    case 'header': {
      const d = block.data as HeaderData;
      const lines: string[] = [`# ${d.name}`];
      if (d.title) {
        lines.push('', d.title);
      }
      // Serialize photo as raw HTML img tag so markdown-it preserves it
      // as a block-level element (not wrapped in <p>).
      // CSS selectors like .h1_block > img can then target it directly.
      if (d.photo) {
        lines.push('', `<img class="resume-photo" src="${d.photo}" alt="photo">`);
      }
      return lines.join('\n');
    }
    case 'two-column': {
      const d = block.data as TwoColumnData;
      const leftMd = columnContentToMarkdown(d.left);
      const rightMd = columnContentToMarkdown(d.right);
      return `::: left\n\n${leftMd}\n\n:::\n\n::: right\n\n${rightMd}\n\n:::`;
    }
    case 'section': {
      const d = block.data as SectionData;
      const lines: string[] = [`## ${d.title}`];
      if (d.subtitle) {
        lines.push('', d.subtitle);
      }
      // Top-level items (for sections like "技能" without entries)
      if (d.items.length > 0) {
        lines.push('');
        for (const item of d.items) {
          if (item.type === 'bullet') {
            lines.push(`- ${item.content}`);
          } else {
            lines.push(item.content);
          }
        }
      }
      // Entries (H3 children)
      for (const entry of (d.entries || [])) {
        lines.push('', `### ${entry.title}`);
        if (entry.subtitle) {
          lines.push('', entry.subtitle);
        }
        if (entry.items.length > 0) {
          lines.push('');
          for (const item of entry.items) {
            if (item.type === 'bullet') {
              lines.push(`- ${item.content}`);
            } else {
              lines.push(item.content);
            }
          }
        }
      }
      return lines.join('\n');
    }
    case 'raw-markdown': {
      const d = block.data as RawMarkdownData;
      return d.markdown;
    }
    default:
      return '';
  }
}

export function blocksToMarkdown(blocks: ResumeBlock[]): string {
  return blocks.map(blockToMarkdown).join('\n\n');
}

function columnContentToMarkdown(col: ColumnContent): string {
  const parts: string[] = [];
  if (col.text) {
    parts.push(col.text);
  }
  for (const c of col.contacts) {
    if (c.link) {
      parts.push(`[icon:${c.icon} ${c.label}](${c.link})`);
    } else {
      parts.push(`icon:${c.icon} ${c.label}`);
    }
  }
  return parts.join('\n\n');
}

// ============================================================
// Markdown → blocks (best-effort parser)
// ============================================================

export function markdownToBlocks(md: string): ResumeBlock[] {
  const rawLines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: ResumeBlock[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Skip blank lines
    if (!trimmed) {
      i++;
      continue;
    }

    // ::: left → start of two-column block
    if (/^:::\s*left\s*$/i.test(trimmed)) {
      const result = tryParseTwoColumn(rawLines, i);
      if (result) {
        blocks.push(result.block);
        i = result.nextIndex;
        continue;
      }
      // Failed to parse complete two-column — skip this line and retry
      i++;
      continue;
    }

    // Heading line
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      if (level === 1) {
        const headerData = parseHeaderText(text);
        // Look ahead for an implicit title line (new format: # Name \n\n Title)
        if (!headerData.title) {
          let nextIdx = i + 1;
          while (nextIdx < rawLines.length && !rawLines[nextIdx].trim()) {
            nextIdx++;
          }
          const nextLine = nextIdx < rawLines.length ? rawLines[nextIdx].trim() : '';
          if (nextLine && !/^#{1,3}\s+/.test(nextLine) && !/^:::/.test(nextLine) && isPlainTextLine(nextLine)) {
            headerData.title = sanitizeText(nextLine);
            i = nextIdx + 1;
          } else {
            i++;
          }
        } else {
          i++;
        }

        // Check for an optional photo line after the title
        // (raw <img> tag or markdown image syntax)
        while (i < rawLines.length && !rawLines[i].trim()) {
          i++;
        }
        if (i < rawLines.length) {
          const photoLine = rawLines[i].trim();
          const imgTagMatch = photoLine.match(/<img[^>]+src="([^"]*)"[^>]*>/i);
          const mdImgMatch = photoLine.match(/^!\[.*?\]\((.*?)\)$/);
          if (imgTagMatch) {
            headerData.photo = imgTagMatch[1];
            i++;
          } else if (mdImgMatch) {
            headerData.photo = mdImgMatch[1];
            i++;
          }
        }

        blocks.push({
          id: generateId(),
          type: 'header',
          data: headerData,
        });
        continue;
      }

      // H2 — parse as section with optional H3 entries
      if (level === 2) {
        const sectionResult = parseSectionWithEntries(rawLines, i);
        blocks.push(sectionResult.block);
        i = sectionResult.nextIndex;
        continue;
      }

      // H3 at top level (no parent H2) — wrap in a section
      if (level === 3) {
        const entryResult = parseEntry(rawLines, i);
        blocks.push({
          id: generateId(),
          type: 'section',
          data: {
            level: 2,
            title: text,
            items: [],
            entries: [entryResult.entry],
          } as SectionData,
        });
        i = entryResult.nextIndex;
        continue;
      }
    }

    // Unrecognized → raw-markdown
    const rawResult = collectRawMarkdown(rawLines, i);
    blocks.push(rawResult.block);
    i = rawResult.nextIndex;
  }

  return blocks;
}

// ============================================================
// Internal helpers
// ============================================================

function parseHeaderText(text: string): HeaderData {
  const raw = sanitizeText(text);
  const dashIndex = raw.indexOf(' - ');
  if (dashIndex !== -1) {
    return {
      name: sanitizeText(raw.slice(0, dashIndex)),
      title: sanitizeText(raw.slice(dashIndex + 3)),
    };
  }
  return { name: raw, title: '' };
}

function isPlainTextLine(line: string): boolean {
  // Reject lines that contain HTML tags or are markdown link syntax
  return !HTML_TAG_RE.test(line) && !/!\[.*?\]\(.*?\)/.test(line);
}

function tryParseTwoColumn(
  lines: string[],
  startIndex: number,
): { block: ResumeBlock; nextIndex: number } | null {
  let i = startIndex;

  // Eat ::: left
  if (!/^:::\s*left\s*$/i.test(lines[i].trim())) return null;
  i++;

  // Consume left content until :::
  const leftLines: string[] = [];
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === ':::') { i++; break; }
    leftLines.push(lines[i]);
    i++;
  }

  // Skip blank lines, then expect ::: right
  while (i < lines.length && !lines[i].trim()) { i++; }
  if (i >= lines.length) return null;
  if (!/^:::\s*right\s*$/i.test(lines[i].trim())) return null;
  i++;

  // Consume right content until :::
  const rightLines: string[] = [];
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === ':::') { i++; break; }
    rightLines.push(lines[i]);
    i++;
  }

  return {
    block: {
      id: generateId(),
      type: 'two-column',
      data: {
        left: parseColumnContent(leftLines.join('\n')),
        right: parseColumnContent(rightLines.join('\n')),
      } as TwoColumnData,
    },
    nextIndex: i,
  };
}

function parseColumnContent(text: string): ColumnContent {
  const contacts: ContactItem[] = [];
  const textParts: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // [icon:xxx label](link)
    const linkedIcon = trimmed.match(/^\[icon:(\w+)\s+(.*?)\]\((.*?)\)$/);
    if (linkedIcon) {
      contacts.push({
        icon: linkedIcon[1],
        label: linkedIcon[2].trim(),
        link: linkedIcon[3].trim(),
      });
      continue;
    }

    // icon:xxx label (no link)
    const bareIcon = trimmed.match(/^icon:(\w+)\s+(.*)$/);
    if (bareIcon) {
      contacts.push({
        icon: bareIcon[1],
        label: bareIcon[2].trim(),
      });
      continue;
    }

    textParts.push(line);
  }

  return { text: textParts.join('\n').trim(), contacts };
}

// Parse items (bullets and text) belonging to the current scope.
// Stops at next heading or `:::` block boundary. Returns items + next index.
function collectItems(
  lines: string[],
  startIndex: number,
): { items: SectionItem[]; nextIndex: number } {
  let i = startIndex;
  const items: SectionItem[] = [];
  const textBuffer: string[] = [];

  function flush() {
    const text = sanitizeText(textBuffer.join('\n'));
    if (text) items.push({ type: 'text', content: text });
    textBuffer.length = 0;
  }

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (/^:::\s*(left|right)\s*$/i.test(trimmed)) break;
    if (/^#{1,3}\s+/.test(trimmed)) break;

    if (/^[-*]\s+/.test(trimmed)) {
      flush();
      items.push({ type: 'bullet', content: sanitizeText(trimmed.replace(/^[-*]\s+/, '')) });
      i++;
      continue;
    }

    if (trimmed) {
      textBuffer.push(lines[i]);
    } else {
      flush();
    }
    i++;
  }
  flush();
  return { items, nextIndex: i };
}

// Parse a single H3 entry: title, optional subtitle, and items.
function parseEntry(
  lines: string[],
  startIndex: number,
): { entry: SectionEntry; nextIndex: number } {
  const title = sanitizeText(lines[startIndex].replace(/^###\s+/, ''));
  let i = startIndex + 1;
  let subtitle: string | undefined;

  // Skip blank lines
  while (i < lines.length && !lines[i].trim()) i++;

  // Peek: if the next non-blank line is not a bullet/heading/block boundary, it's a subtitle
  if (i < lines.length) {
    const trimmed = lines[i].trim();
    if (
      !/^#{1,3}\s+/.test(trimmed) &&
      !/^[-*]\s+/.test(trimmed) &&
      !/^:::\s*(left|right)\s*$/i.test(trimmed)
    ) {
      subtitle = sanitizeText(trimmed);
      i++;
    }
  }

  const { items, nextIndex } = collectItems(lines, i);

  return {
    entry: { id: generateId(), title, subtitle, items },
    nextIndex,
  };
}

// Parse an H2 section together with its H3 children as entries.
function parseSectionWithEntries(
  lines: string[],
  startIndex: number,
): { block: ResumeBlock; nextIndex: number } {
  const title = sanitizeText(lines[startIndex].replace(/^##\s+/, ''));
  let i = startIndex + 1;
  let subtitle: string | undefined;

  // Skip blank lines
  while (i < lines.length && !lines[i].trim()) i++;

  // Peek: if the next non-blank, non-heading line is not a bullet or block boundary,
  // and the following content contains an H3, it's likely a subtitle.
  // Otherwise treat as the first content.
  if (i < lines.length) {
    const trimmed = lines[i].trim();
    if (
      !/^#{1,3}\s+/.test(trimmed) &&
      !/^[-*]\s+/.test(trimmed) &&
      !/^:::\s*(left|right)\s*$/i.test(trimmed)
    ) {
      // Check ahead: if there's an H3 before the next H2, this line is a subtitle
      let peek = i + 1;
      let foundH3 = false;
      while (peek < lines.length) {
        const t = lines[peek].trim();
        if (/^##\s+/.test(t)) break;
        if (/^###\s+/.test(t)) { foundH3 = true; break; }
        peek++;
      }
      if (foundH3) {
        subtitle = sanitizeText(trimmed);
        i++;
      }
    }
  }

  // Collect top-level items (stop at H3 or H2)
  const { items, nextIndex: afterItems } = collectItems(lines, i);
  i = afterItems;

  // Collect H3 entries (stop at H2 or EOF)
  const entries: SectionEntry[] = [];
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (/^##\s+/.test(trimmed)) break;
    if (/^:::\s*(left|right)\s*$/i.test(trimmed)) break;

    if (/^###\s+/.test(trimmed)) {
      const result = parseEntry(lines, i);
      entries.push(result.entry);
      i = result.nextIndex;
      continue;
    }

    // Non-heading content between entries: skip or collect as raw text
    // (this handles stray text between H3 blocks)
    i++;
  }

  return {
    block: {
      id: generateId(),
      type: 'section',
      data: { level: 2, title, subtitle, items, entries } as SectionData,
    },
    nextIndex: i,
  };
}

function collectRawMarkdown(
  lines: string[],
  startIndex: number,
): { block: ResumeBlock; nextIndex: number } {
  const collected: string[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Stop at recognized block boundaries
    if (/^:::\s*(left|right)\s*$/i.test(trimmed)) break;
    if (/^#{1,3}\s+/.test(trimmed)) break;

    collected.push(lines[i]);
    i++;
  }

  // Trim trailing blank lines
  while (collected.length > 0 && !collected[collected.length - 1].trim()) {
    collected.pop();
  }

  return {
    block: {
      id: generateId(),
      type: 'raw-markdown',
      data: { markdown: collected.join('\n').trim() } as RawMarkdownData,
    },
    nextIndex: i,
  };
}
