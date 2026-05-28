import {
  ResumeBlock,
  HeaderData,
  TwoColumnData,
  SectionData,
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
// blocks → Markdown
// ============================================================

export function blockToMarkdown(block: ResumeBlock): string {
  switch (block.type) {
    case 'header': {
      const d = block.data as HeaderData;
      return d.title ? `# ${d.name} - ${d.title}` : `# ${d.name}`;
    }
    case 'two-column': {
      const d = block.data as TwoColumnData;
      const leftMd = columnContentToMarkdown(d.left);
      const rightMd = columnContentToMarkdown(d.right);
      return `::: left\n\n${leftMd}\n\n:::\n\n::: right\n\n${rightMd}\n\n:::`;
    }
    case 'section': {
      const d = block.data as SectionData;
      const prefix = '#'.repeat(d.level);
      const lines: string[] = [`${prefix} ${d.title}`];
      if (d.subtitle) {
        lines.push('', d.subtitle);
      }
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
        blocks.push({
          id: generateId(),
          type: 'header',
          data: parseHeaderText(text),
        });
        i++;
        continue;
      }

      // H2 or H3
      const sectionResult = parseSection(rawLines, i, level as 2 | 3);
      blocks.push(sectionResult.block);
      i = sectionResult.nextIndex;
      continue;
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
  const dashIndex = text.indexOf(' - ');
  if (dashIndex !== -1) {
    return {
      name: text.slice(0, dashIndex).trim(),
      title: text.slice(dashIndex + 3).trim(),
    };
  }
  return { name: text, title: '' };
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

function parseSection(
  lines: string[],
  startIndex: number,
  level: 2 | 3,
): { block: ResumeBlock; nextIndex: number } {
  const title = lines[startIndex].replace(/^#{2,3}\s+/, '').trim();
  let i = startIndex + 1;
  const items: SectionItem[] = [];
  let subtitle: string | undefined;
  const textBuffer: string[] = [];
  let firstContentConsumed = false;

  function flushTextBuffer() {
    const text = textBuffer.join('\n').trim();
    if (text) {
      items.push({ type: 'text', content: text });
    }
    textBuffer.length = 0;
  }

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Block terminators
    if (/^:::\s*(left|right)\s*$/i.test(trimmed)) break;
    if (/^#{1,3}\s+/.test(trimmed)) break;

    // Bullet line
    if (/^[-*]\s+/.test(trimmed)) {
      flushTextBuffer();
      firstContentConsumed = true;
      items.push({ type: 'bullet', content: trimmed.replace(/^[-*]\s+/, '') });
      i++;
      continue;
    }

    // Non-blank content line
    if (trimmed) {
      // The first non-blank, non-bullet line after an H3 heading is the subtitle
      if (level === 3 && !firstContentConsumed && !subtitle && items.length === 0) {
        subtitle = trimmed;
        firstContentConsumed = true;
      } else {
        textBuffer.push(rawLine);
        firstContentConsumed = true;
      }
    } else {
      // Blank line: flush accumulated text
      flushTextBuffer();
    }

    i++;
  }

  flushTextBuffer();

  return {
    block: {
      id: generateId(),
      type: 'section',
      data: { level, title, subtitle, items } as SectionData,
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
