import templates from "../../../public/data/template.json";
import { themes, resolveThemeId } from "../const";

describe("template gallery data", () => {
  it("keeps the built-in template list small and complete", () => {
    expect(templates.length).toBeGreaterThanOrEqual(6);
    expect(templates.length).toBeLessThanOrEqual(8);

    templates.forEach((template) => {
      expect(template.template).toContain("# ");
      expect(template.tags.length).toBeGreaterThan(0);
      expect(template.audience.length).toBeGreaterThan(0);
      expect(template.bestFor.length).toBeGreaterThan(0);
      expect(template.scenarios.length).toBeGreaterThan(0);
      expect(template.features.length).toBeGreaterThan(0);
      expect(typeof template.previewPriority).toBe("number");
    });
  });

  it("registers the formal Chinese theme and falls back from invalid stored themes", () => {
    expect(themes.some((theme) => theme.id === "formal-cn")).toBe(true);
    expect(resolveThemeId("formal-cn")).toBe("formal-cn");
    expect(resolveThemeId("legacy-missing-theme")).toBe("default");
  });

  it("covers the P0 boutique template scenarios", () => {
    const titles = templates.map((template) => template.title).join(" ");
    const roles = templates.map((template) => template.role).join(" ");
    const tags = templates.flatMap((template) => template.tags).join(" ");

    expect(titles).toContain("极简");
    expect(titles).toContain("双栏");
    expect(roles).toContain("校招");
    expect(roles).toContain("技术");
    expect(tags).toContain("ATS");
    expect(templates.filter((template) => template.featured)).toHaveLength(3);
  });
});
