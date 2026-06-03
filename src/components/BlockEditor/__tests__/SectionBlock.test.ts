import { reorderEntries } from "../SectionBlock";
import { SectionEntry } from "@src/types/resume";

describe("reorderEntries", () => {
  const entries: SectionEntry[] = [
    { id: "a", title: "公司A", items: [] },
    { id: "b", title: "公司B", items: [] },
    { id: "c", title: "公司C", items: [] },
  ];

  it("moves one entry without mutating the original array", () => {
    const result = reorderEntries(entries, 2, 0);

    expect(result.map((entry) => entry.id)).toEqual(["c", "a", "b"]);
    expect(entries.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
  });

  it("returns the original order for invalid indexes", () => {
    const result = reorderEntries(entries, -1, 1);

    expect(result.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
  });
});
