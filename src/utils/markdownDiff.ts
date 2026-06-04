export type ParagraphDiffType = "unchanged" | "added" | "removed" | "changed";

export interface ParagraphDiffRow {
  type: ParagraphDiffType;
  before?: string;
  after?: string;
}

function splitParagraphs(markdown: string) {
  return markdown
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function buildLcsMatrix(before: string[], after: string[]) {
  const matrix = Array.from({ length: before.length + 1 }, () =>
    Array(after.length + 1).fill(0)
  );

  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      matrix[i][j] = before[i] === after[j]
        ? matrix[i + 1][j + 1] + 1
        : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
    }
  }

  return matrix;
}

export function buildParagraphDiff(beforeMarkdown: string, afterMarkdown: string): ParagraphDiffRow[] {
  const before = splitParagraphs(beforeMarkdown);
  const after = splitParagraphs(afterMarkdown);
  const matrix = buildLcsMatrix(before, after);
  const operations: ParagraphDiffRow[] = [];
  let i = 0;
  let j = 0;

  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) {
      operations.push({ type: "unchanged", before: before[i], after: after[j] });
      i++;
      j++;
    } else if (matrix[i + 1][j] >= matrix[i][j + 1]) {
      operations.push({ type: "removed", before: before[i] });
      i++;
    } else {
      operations.push({ type: "added", after: after[j] });
      j++;
    }
  }

  while (i < before.length) {
    operations.push({ type: "removed", before: before[i] });
    i++;
  }
  while (j < after.length) {
    operations.push({ type: "added", after: after[j] });
    j++;
  }

  const rows: ParagraphDiffRow[] = [];
  for (let index = 0; index < operations.length; index++) {
    const current = operations[index];
    const next = operations[index + 1];
    if (current.type === "removed" && next?.type === "added") {
      rows.push({ type: "changed", before: current.before, after: next.after });
      index++;
    } else {
      rows.push(current);
    }
  }

  return rows;
}
