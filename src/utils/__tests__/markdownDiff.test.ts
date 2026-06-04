import { buildParagraphDiff } from "../markdownDiff";

describe("buildParagraphDiff", () => {
  it("marks added paragraphs", () => {
    const rows = buildParagraphDiff("# 张三\n\n## 项目", "# 张三\n\n## 项目\n\n- 新增成果");

    expect(rows.map((row) => row.type)).toEqual(["unchanged", "unchanged", "added"]);
    expect(rows[2].after).toBe("- 新增成果");
  });

  it("marks removed paragraphs", () => {
    const rows = buildParagraphDiff("# 张三\n\n旧段落\n\n## 技能", "# 张三\n\n## 技能");

    expect(rows.map((row) => row.type)).toEqual(["unchanged", "removed", "unchanged"]);
    expect(rows[1].before).toBe("旧段落");
  });

  it("marks changed paragraphs when original and result differ in place", () => {
    const rows = buildParagraphDiff("# 张三\n\n负责业务开发", "# 张三\n\n负责核心业务开发并提升稳定性");

    expect(rows.map((row) => row.type)).toEqual(["unchanged", "changed"]);
    expect(rows[1]).toMatchObject({
      before: "负责业务开发",
      after: "负责核心业务开发并提升稳定性",
    });
  });

  it("keeps basic alignment when paragraphs are reordered", () => {
    const rows = buildParagraphDiff("A\n\nB\n\nC", "A\n\nC\n\nB");

    expect(rows.some((row) => row.type !== "unchanged")).toBe(true);
    expect(rows.map((row) => row.before || row.after)).toContain("B");
    expect(rows.map((row) => row.before || row.after)).toContain("C");
  });
});
