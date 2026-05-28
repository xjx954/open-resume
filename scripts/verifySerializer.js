/**
 * Standalone verification script for blockSerializer.
 * Run: node --max-old-space-size=2048 scripts/verifySerializer.js
 *
 * Does NOT use jest/babel — directly tests the serializer logic in pure Node.
 * The serializer module is intentionally self-contained (no external deps) so
 * this script can verify correctness without the full build chain.
 */

// --- Inlined ID generator (mirrors blockSerializer.ts) ---
let idCounter = 0;
function generateId() {
  return 'test-' + (++idCounter);
}

// --- Inlined types (mirrors src/types/resume.ts) ---
// TypeScript interfaces are erased at runtime; this script uses plain objects.

// --- Inlined serializer (mirrors blockSerializer.ts) ---

function blockToMarkdown(block) {
  switch (block.type) {
    case 'header': {
      const d = block.data;
      return d.title ? `# ${d.name} - ${d.title}` : `# ${d.name}`;
    }
    case 'two-column': {
      const d = block.data;
      const leftMd = columnContentToMarkdown(d.left);
      const rightMd = columnContentToMarkdown(d.right);
      return `::: left\n\n${leftMd}\n\n:::\n\n::: right\n\n${rightMd}\n\n:::`;
    }
    case 'section': {
      const d = block.data;
      const prefix = '#'.repeat(d.level);
      const lines = [`${prefix} ${d.title}`];
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
      return block.data.markdown;
    }
    default:
      return '';
  }
}

function blocksToMarkdown(blocks) {
  return blocks.map(blockToMarkdown).join('\n\n');
}

function columnContentToMarkdown(col) {
  const parts = [];
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

function markdownToBlocks(md) {
  const rawLines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (/^:::\s*left\s*$/i.test(trimmed)) {
      const result = tryParseTwoColumn(rawLines, i);
      if (result) {
        blocks.push(result.block);
        i = result.nextIndex;
        continue;
      }
      // Failed to parse — skip this line to avoid infinite loop
      i++;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      if (level === 1) {
        const dashIndex = text.indexOf(' - ');
        blocks.push({
          id: generateId(),
          type: 'header',
          data: dashIndex !== -1
            ? { name: text.slice(0, dashIndex).trim(), title: text.slice(dashIndex + 3).trim() }
            : { name: text, title: '' },
        });
        i++;
        continue;
      }

      const sectionResult = parseSection(rawLines, i, level);
      blocks.push(sectionResult.block);
      i = sectionResult.nextIndex;
      continue;
    }

    const rawResult = collectRawMarkdown(rawLines, i);
    blocks.push(rawResult.block);
    i = rawResult.nextIndex;
  }

  return blocks;
}

function tryParseTwoColumn(lines, startIndex) {
  let i = startIndex;
  if (!/^:::\s*left\s*$/i.test(lines[i].trim())) return null;
  i++;

  const leftLines = [];
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

  const rightLines = [];
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
      },
    },
    nextIndex: i,
  };
}

function parseColumnContent(text) {
  const contacts = [];
  const textParts = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const linkedIcon = trimmed.match(/^\[icon:(\w+)\s+(.*?)\]\((.*?)\)$/);
    if (linkedIcon) {
      contacts.push({ icon: linkedIcon[1], label: linkedIcon[2].trim(), link: linkedIcon[3].trim() });
      continue;
    }

    const bareIcon = trimmed.match(/^icon:(\w+)\s+(.*)$/);
    if (bareIcon) {
      contacts.push({ icon: bareIcon[1], label: bareIcon[2].trim() });
      continue;
    }

    textParts.push(line);
  }

  return { text: textParts.join('\n').trim(), contacts };
}

function parseSection(lines, startIndex, level) {
  const title = lines[startIndex].replace(/^#{2,3}\s+/, '').trim();
  let i = startIndex + 1;
  const items = [];
  let subtitle;
  const textBuffer = [];
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

    if (/^:::\s*(left|right)\s*$/i.test(trimmed)) break;
    if (/^#{1,3}\s+/.test(trimmed)) break;

    if (/^[-*]\s+/.test(trimmed)) {
      flushTextBuffer();
      firstContentConsumed = true;
      items.push({ type: 'bullet', content: trimmed.replace(/^[-*]\s+/, '') });
      i++;
      continue;
    }

    if (trimmed) {
      if (level === 3 && !firstContentConsumed && !subtitle && items.length === 0) {
        subtitle = trimmed;
        firstContentConsumed = true;
      } else {
        textBuffer.push(rawLine);
        firstContentConsumed = true;
      }
    } else {
      flushTextBuffer();
    }

    i++;
  }

  flushTextBuffer();

  return {
    block: {
      id: generateId(),
      type: 'section',
      data: { level, title, subtitle, items },
    },
    nextIndex: i,
  };
}

function collectRawMarkdown(lines, startIndex) {
  const collected = [];
  let i = startIndex;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (/^:::\s*(left|right)\s*$/i.test(trimmed)) break;
    if (/^#{1,3}\s+/.test(trimmed)) break;
    collected.push(lines[i]);
    i++;
  }

  while (collected.length > 0 && !collected[collected.length - 1].trim()) {
    collected.pop();
  }

  return {
    block: {
      id: generateId(),
      type: 'raw-markdown',
      data: { markdown: collected.join('\n').trim() },
    },
    nextIndex: i,
  };
}

// ============================================================
// Test runner
// ============================================================

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
  }
}

function test(name, fn) {
  console.log(`\n${name}`);
  idCounter = 0;
  fn();
}

// ============================================================
// Tests
// ============================================================

test('blockToMarkdown — header', () => {
  const md = blockToMarkdown({
    id: '1', type: 'header',
    data: { name: '张三', title: '前端工程师' },
  });
  assertEqual(md, '# 张三 - 前端工程师', 'header with name and title');

  const md2 = blockToMarkdown({
    id: '1', type: 'header',
    data: { name: '张三', title: '' },
  });
  assertEqual(md2, '# 张三', 'header without title');
});

test('blockToMarkdown — two-column', () => {
  const md = blockToMarkdown({
    id: '1', type: 'two-column',
    data: {
      left: { text: '个人简介', contacts: [] },
      right: {
        text: '',
        contacts: [
          { icon: 'email', label: 'test@example.com', link: 'mailto:test@example.com' },
          { icon: 'phone', label: '138-0000-0000' },
        ],
      },
    },
  });
  assert(md.includes('::: left'), 'contains ::: left');
  assert(md.includes('::: right'), 'contains ::: right');
  assert(md.includes('个人简介'), 'contains left text');
  assert(md.includes('[icon:email test@example.com](mailto:test@example.com)'), 'contains linked icon');
  assert(md.includes('icon:phone 138-0000-0000'), 'contains bare icon');
});

test('blockToMarkdown — section', () => {
  const md = blockToMarkdown({
    id: '1', type: 'section',
    data: {
      level: 2, title: '个人优势',
      items: [
        { type: 'bullet', content: '熟练掌握 React' },
        { type: 'bullet', content: '良好的团队协作' },
      ],
    },
  });
  assertEqual(md, '## 个人优势\n\n- 熟练掌握 React\n- 良好的团队协作', 'H2 section with bullets');

  const md2 = blockToMarkdown({
    id: '2', type: 'section',
    data: {
      level: 3, title: '某科技公司 - 前端工程师',
      subtitle: '2020-至今',
      items: [{ type: 'bullet', content: '负责核心业务开发' }],
    },
  });
  assert(md2.includes('### 某科技公司 - 前端工程师'), 'H3 title');
  assert(md2.includes('2020-至今'), 'subtitle');
  assert(md2.includes('- 负责核心业务开发'), 'bullet item');
});

test('blockToMarkdown — raw-markdown', () => {
  const md = blockToMarkdown({
    id: '1', type: 'raw-markdown',
    data: { markdown: '## 自定义内容\n\n一些**复杂**格式' },
  });
  assertEqual(md, '## 自定义内容\n\n一些**复杂**格式', 'raw markdown passthrough');
});

test('blocksToMarkdown — multiple blocks', () => {
  const md = blocksToMarkdown([
    { id: '1', type: 'header', data: { name: '张三', title: '前端工程师' } },
    { id: '2', type: 'section', data: { level: 2, title: '技能', items: [{ type: 'bullet', content: 'React' }] } },
  ]);
  assertEqual(md, '# 张三 - 前端工程师\n\n## 技能\n\n- React', 'two blocks joined');
});

test('markdownToBlocks — header', () => {
  const blocks = markdownToBlocks('# 张三 - 前端工程师');
  assert(blocks.length === 1, 'one block');
  assert(blocks[0].type === 'header', 'type is header');
  assertEqual(blocks[0].data, { name: '张三', title: '前端工程师' }, 'parsed name and title');

  const blocks2 = markdownToBlocks('# 张三');
  assert(blocks2[0].type === 'header', 'type is header no title');
  assertEqual(blocks2[0].data, { name: '张三', title: '' }, 'name only');
});

test('markdownToBlocks — two-column', () => {
  const md = [
    '::: left',
    '',
    '个人简介',
    '',
    ':::',
    '',
    '::: right',
    '',
    '[icon:email test@example.com](mailto:test@example.com)',
    '',
    'icon:phone 138-0000-0000',
    '',
    ':::',
  ].join('\n');

  const blocks = markdownToBlocks(md);
  assert(blocks.length === 1, 'one block');
  assert(blocks[0].type === 'two-column', 'type is two-column');
  assert(blocks[0].data.left.text.includes('个人简介'), 'left text');
  assertEqual(blocks[0].data.right.contacts, [
    { icon: 'email', label: 'test@example.com', link: 'mailto:test@example.com' },
    { icon: 'phone', label: '138-0000-0000' },
  ], 'right contacts');
});

test('markdownToBlocks — sections', () => {
  const md = [
    '## 个人优势',
    '',
    '- 熟练掌握 React',
    '- 良好的团队协作能力',
  ].join('\n');

  const blocks = markdownToBlocks(md);
  assert(blocks.length === 1, 'one block');
  assert(blocks[0].type === 'section', 'type is section');
  assertEqual(blocks[0].data, {
    level: 2,
    title: '个人优势',
    items: [
      { type: 'bullet', content: '熟练掌握 React' },
      { type: 'bullet', content: '良好的团队协作能力' },
    ],
  }, 'H2 section data');
});

test('markdownToBlocks — H3 with subtitle', () => {
  const md = [
    '### 某科技公司 - 前端工程师',
    '2020-至今',
    '',
    '- 负责核心业务开发',
  ].join('\n');

  const blocks = markdownToBlocks(md);
  assert(blocks.length === 1, 'one block');
  assert(blocks[0].type === 'section', 'type is section');
  assertEqual(blocks[0].data.title, '某科技公司 - 前端工程师', 'title');
  assertEqual(blocks[0].data.subtitle, '2020-至今', 'subtitle');
  assertEqual(blocks[0].data.items, [
    { type: 'bullet', content: '负责核心业务开发' },
  ], 'items');
});

test('markdownToBlocks — consecutive sections', () => {
  const md = [
    '## 技能',
    '- React',
    '- TypeScript',
    '',
    '## 工作经历',
    '- 负责核心业务',
  ].join('\n');

  const blocks = markdownToBlocks(md);
  assert(blocks.length === 2, 'two blocks');
  assert(blocks[0].type === 'section', 'first is section');
  assert(blocks[1].type === 'section', 'second is section');
  assertEqual(blocks[0].data.title, '技能', 'first title');
  assertEqual(blocks[1].data.title, '工作经历', 'second title');
});

test('markdownToBlocks — raw-markdown fallback', () => {
  const md = '这是一段无法识别的文本\n没有标题也没有容器';
  const blocks = markdownToBlocks(md);
  assert(blocks.length === 1, 'one block');
  assert(blocks[0].type === 'raw-markdown', 'type is raw-markdown');
  assertEqual(blocks[0].data.markdown, '这是一段无法识别的文本\n没有标题也没有容器', 'content preserved');

  // Mixed recognized + unrecognized
  const md2 = [
    '# 张三 - 前端',
    '',
    '这是一段自由文本',
    '',
    '## 技能',
    '- React',
  ].join('\n');
  const blocks2 = markdownToBlocks(md2);
  assert(blocks2.length >= 3, `at least 3 blocks, got ${blocks2.length}`);
  assert(blocks2[0].type === 'header', 'first is header');
  assert(blocks2[1].type === 'raw-markdown', 'second is raw-markdown');
  assert(blocks2[2].type === 'section', 'third is section');
});

test('round-trip — standard resume', () => {
  const original = [
    '# 张三 - 前端工程师',
    '',
    '::: left',
    '',
    '个人简介',
    '',
    ':::',
    '',
    '::: right',
    '',
    '[icon:email test@example.com](mailto:test@example.com)',
    '',
    ':::',
    '',
    '## 个人优势',
    '',
    '- 熟练掌握 React',
    '- 良好的团队协作能力',
    '',
    '## 工作经历',
    '',
    '### 公司A - 前端工程师',
    '2020-至今',
    '',
    '- 负责核心业务开发',
    '',
    '### 公司B - 前端实习生',
    '2019-2020',
    '',
    '- 参与项目迭代',
  ].join('\n');

  const blocks = markdownToBlocks(original);
  const types = blocks.map(b => b.type);
  assert(types.includes('header'), 'has header');
  assert(types.includes('two-column'), 'has two-column');
  assert(types.filter(t => t === 'section').length >= 3, `has >= 3 sections, got ${types.filter(t => t === 'section').length}`);

  const roundTripped = blocksToMarkdown(blocks);
  const blocks2 = markdownToBlocks(roundTripped);
  assert(blocks2.length === blocks.length, `round-trip block count matches: ${blocks2.length} === ${blocks.length}`);

  // Verify specific content survived
  assert(roundTripped.includes('张三 - 前端工程师'), 'name preserved');
  assert(roundTripped.includes('icon:email'), 'email icon preserved');
  assert(roundTripped.includes('个人优势'), 'section title preserved');
  assert(roundTripped.includes('熟练掌握 React'), 'bullet preserved');
  assert(roundTripped.includes('公司A'), 'H3 title preserved');
});

test('round-trip — raw-markdown content preserved', () => {
  const md = '一些 **Markdown** 内容\n\n- 不是真正的列表项';
  const blocks = markdownToBlocks(md);
  assert(blocks[0].type === 'raw-markdown', 'falls back to raw-markdown');
  const roundTripped = blocksToMarkdown(blocks);
  assertEqual(roundTripped, md, 'raw content round-trips exactly');
});

test('edge cases', () => {
  const empty = markdownToBlocks('');
  assertEqual(empty, [], 'empty string → empty array');

  const emptyMd = blocksToMarkdown([]);
  assertEqual(emptyMd, '', 'empty array → empty string');

  const ws = markdownToBlocks('   \n\n  \n');
  assertEqual(ws, [], 'whitespace only → empty array');

  // Windows line endings
  const blocks = markdownToBlocks('# 张三\r\n\r\n## 技能\r\n\r\n- React');
  assert(blocks.length === 2, 'windows line endings');
  assert(blocks[0].type === 'header', 'first is header');
  assert(blocks[1].type === 'section', 'second is section');
});

// ============================================================
// Summary
// ============================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
