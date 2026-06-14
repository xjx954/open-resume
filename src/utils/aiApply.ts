import { GeneratedBullet } from "@src/types/ai";
import { ResumeBlock, SectionData, SectionEntry, SectionItem } from "@src/types/resume";
import { generateId } from "@src/utils/id";

export interface ApplyGeneratedBulletResult {
  blocks: ResumeBlock[];
  applied: boolean;
  duplicate: boolean;
  targetTitle: string;
  notice?: string;
}

const FALLBACK_SECTION_TITLE = "补充亮点";
const FALLBACK_NOTICE = "未找到匹配模块，已添加至「补充亮点」";

const SECTION_ALIASES: Record<string, string[]> = {
  projects: ["project", "projects", "项目"],
  experience: ["experience", "work", "工作", "实习", "经历"],
  skills: ["skill", "skills", "技能", "技术栈"],
  practice: ["practice", "实践", "社会实践"],
  achievements: ["achievement", "achievements", "result", "results", "成果"],
  summary: ["summary", "advantages", "优势", "简介"],
};

export function getGeneratedBulletKey(bullet: GeneratedBullet) {
  return [
    bullet.targetSection || "",
    bullet.sourceKeyword || "",
    bullet.content || "",
  ].join("|");
}

function normalize(value: string | undefined) {
  return (value || "").trim().toLowerCase();
}

function cloneBlocks(blocks: ResumeBlock[]) {
  return JSON.parse(JSON.stringify(blocks)) as ResumeBlock[];
}

function aliasesForTarget(targetSection: string) {
  const normalized = normalize(targetSection);
  const directAliases = Object.entries(SECTION_ALIASES).find(([key, aliases]) =>
    key === normalized || aliases.some((alias) => normalize(alias) === normalized)
  );
  return directAliases ? directAliases[1] : [targetSection];
}

function sectionMatches(title: string, targetSection: string) {
  const normalizedTitle = normalize(title);
  return aliasesForTarget(targetSection).some((alias) =>
    normalizedTitle.includes(normalize(alias))
  );
}

function findTargetSectionIndex(blocks: ResumeBlock[], targetSection: string) {
  return blocks.findIndex((block) => {
    if (block.type !== "section") return false;
    return sectionMatches(block.data.title, targetSection);
  });
}

function findFallbackSectionIndex(blocks: ResumeBlock[]) {
  return blocks.findIndex((block) => {
    if (block.type !== "section") return false;
    return normalize(block.data.title) === normalize(FALLBACK_SECTION_TITLE);
  });
}

function allSectionItems(section: SectionData): SectionItem[] {
  return [
    ...(section.items || []),
    ...(section.entries || []).reduce<SectionItem[]>(
      (items, entry) => items.concat(entry.items || []),
      []
    ),
  ];
}

function hasDuplicate(section: SectionData, content: string) {
  const normalizedContent = normalize(content);
  return allSectionItems(section).some((item) => normalize(item.content) === normalizedContent);
}

function findEntryIndex(entries: SectionEntry[], hint?: string) {
  const normalizedHint = normalize(hint);
  if (!normalizedHint) return entries.length - 1;
  const matchedIndex = entries.findIndex((entry) =>
    normalize(`${entry.title} ${entry.subtitle || ""}`).includes(normalizedHint)
  );
  return matchedIndex >= 0 ? matchedIndex : entries.length - 1;
}

function createFallbackSection(content: string): ResumeBlock {
  return {
    id: generateId(),
    type: "section",
    data: {
      level: 2,
      title: FALLBACK_SECTION_TITLE,
      items: [{ type: "bullet", content }],
      entries: [],
    },
  };
}

export function applyGeneratedBulletToBlocks(
  blocks: ResumeBlock[],
  bullet: GeneratedBullet
): ApplyGeneratedBulletResult {
  const content = bullet.content.trim();
  const nextBlocks = cloneBlocks(blocks);
  let targetIndex = findTargetSectionIndex(nextBlocks, bullet.targetSection);
  let notice: string | undefined;

  if (targetIndex < 0) {
    targetIndex = findFallbackSectionIndex(nextBlocks);
    notice = FALLBACK_NOTICE;
  }

  if (targetIndex < 0) {
    nextBlocks.push(createFallbackSection(content));
    return {
      blocks: nextBlocks,
      applied: true,
      duplicate: false,
      targetTitle: FALLBACK_SECTION_TITLE,
      notice: FALLBACK_NOTICE,
    };
  }

  const targetBlock = nextBlocks[targetIndex];
  if (targetBlock.type !== "section") {
    return {
      blocks,
      applied: false,
      duplicate: false,
      targetTitle: FALLBACK_SECTION_TITLE,
      notice,
    };
  }
  const targetData = targetBlock.data;
  if (hasDuplicate(targetData, content)) {
    return {
      blocks,
      applied: false,
      duplicate: true,
      targetTitle: targetData.title,
      notice,
    };
  }

  const nextItem: SectionItem = { type: "bullet", content };
  if (targetData.entries.length > 0) {
    const entryIndex = findEntryIndex(targetData.entries, bullet.targetEntryHint);
    targetData.entries[entryIndex] = {
      ...targetData.entries[entryIndex],
      items: [...targetData.entries[entryIndex].items, nextItem],
    };
  } else {
    targetData.items = [...targetData.items, nextItem];
  }

  return {
    blocks: nextBlocks,
    applied: true,
    duplicate: false,
    targetTitle: targetData.title,
    notice,
  };
}
