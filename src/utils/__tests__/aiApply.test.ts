import { GeneratedBullet } from "@src/types/ai";
import { ResumeBlock, SectionData } from "@src/types/resume";
import { applyGeneratedBulletToBlocks } from "../aiApply";

function section(id: string, title: string, data?: Partial<SectionData>): ResumeBlock {
  return {
    id,
    type: "section",
    data: {
      level: 2,
      title,
      items: [],
      entries: [],
      ...data,
    } as SectionData,
  };
}

function bullet(overrides: Partial<GeneratedBullet> = {}): GeneratedBullet {
  return {
    targetSection: "projects",
    sourceKeyword: "Docker",
    content: "使用 Docker 完成服务容器化部署，提高环境一致性。",
    ...overrides,
  };
}

describe("applyGeneratedBulletToBlocks", () => {
  it("appends a generated bullet to a matching project section", () => {
    const result = applyGeneratedBulletToBlocks(
      [section("project", "项目经验")],
      bullet()
    );

    const data = result.blocks[0].data as SectionData;
    expect(result).toMatchObject({ applied: true, duplicate: false, targetTitle: "项目经验" });
    expect(data.items).toEqual([
      { type: "bullet", content: "使用 Docker 完成服务容器化部署，提高环境一致性。" },
    ]);
  });

  it("matches common section titles for skills, practice, and achievements", () => {
    const skills = applyGeneratedBulletToBlocks(
      [section("skills", "技术栈")],
      bullet({ targetSection: "skills", content: "熟悉 Redis 缓存设计。" })
    );
    const practice = applyGeneratedBulletToBlocks(
      [section("practice", "社会实践")],
      bullet({ targetSection: "practice", content: "参与校园实践项目交付。" })
    );
    const achievements = applyGeneratedBulletToBlocks(
      [section("results", "主要成果")],
      bullet({ targetSection: "achievements", content: "沉淀自动化流程提升交付效率。" })
    );

    expect(skills.targetTitle).toBe("技术栈");
    expect(practice.targetTitle).toBe("社会实践");
    expect(achievements.targetTitle).toBe("主要成果");
  });

  it("uses targetEntryHint to append to the matching entry", () => {
    const result = applyGeneratedBulletToBlocks(
      [
        section("work", "工作经历", {
          entries: [
            { id: "tencent", title: "腾讯 - 前端工程师", items: [] },
            { id: "ali", title: "阿里 - 高级前端", items: [] },
          ],
        }),
      ],
      bullet({
        targetSection: "experience",
        targetEntryHint: "腾讯",
      })
    );

    const data = result.blocks[0].data as SectionData;
    expect(data.entries[0].items).toHaveLength(1);
    expect(data.entries[1].items).toHaveLength(0);
  });

  it("falls back to the last entry when targetEntryHint does not match", () => {
    const result = applyGeneratedBulletToBlocks(
      [
        section("work", "工作经历", {
          entries: [
            { id: "first", title: "第一家公司", items: [] },
            { id: "last", title: "最后一家公司", items: [] },
          ],
        }),
      ],
      bullet({ targetSection: "experience", targetEntryHint: "不存在的公司" })
    );

    const data = result.blocks[0].data as SectionData;
    expect(data.entries[0].items).toHaveLength(0);
    expect(data.entries[1].items).toHaveLength(1);
  });

  it("creates a fallback section with a visible notice when no section matches", () => {
    const result = applyGeneratedBulletToBlocks(
      [section("education", "教育背景")],
      bullet({ targetSection: "unknown" })
    );

    expect(result.targetTitle).toBe("补充亮点");
    expect(result.notice).toBe("未找到匹配模块，已添加至「补充亮点」");
    expect(result.blocks).toHaveLength(2);
    expect((result.blocks[1].data as SectionData).items[0].content).toContain("Docker");
  });

  it("does not insert duplicate content in the selected target section", () => {
    const result = applyGeneratedBulletToBlocks(
      [
        section("project", "项目经验", {
          items: [{ type: "bullet", content: " 使用 docker 完成服务容器化部署，提高环境一致性。 " }],
        }),
      ],
      bullet()
    );

    const data = result.blocks[0].data as SectionData;
    expect(result).toMatchObject({ applied: false, duplicate: true });
    expect(data.items).toHaveLength(1);
  });
});
