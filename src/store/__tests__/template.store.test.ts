import TemplateStore from "../template.store";
import { LOCAL_STORE } from "@src/utils/const";
import { SectionData } from "@src/types/resume";

describe("TemplateStore persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useRealTimers();
  });

  it("persists theme and color through store methods", () => {
    const store = new TemplateStore();

    store.setTheme("blue");
    store.setColor("#123456");

    expect(localStorage.getItem(LOCAL_STORE.MD_THEME)).toBe("blue");
    expect(localStorage.getItem(LOCAL_STORE.MD_COLOR)).toBe("#123456");
  });

  it("keeps in-memory content when localStorage quota writes fail", () => {
    const store = new TemplateStore();
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(() => store.setMdContent("# 张三\n\n## 技能\n\n- React")).not.toThrow();
    expect(store.mdContent).toContain("React");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("无法写入本地存储"));

    warnSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it("debounces block field persistence and preview sync for high-frequency updates", () => {
    jest.useFakeTimers();
    const store = new TemplateStore();
    const block = store.blocks.find(item => item.type === "section");
    expect(block).toBeTruthy();
    if (!block || block.type !== "section") return;

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    setItemSpy.mockClear();

    const data = block.data as SectionData;
    store.updateBlock(block.id, {
      ...data,
      title: `${data.title} 更新`,
    });

    expect(setItemSpy).not.toHaveBeenCalledWith(
      LOCAL_STORE.MD_RESUME,
      expect.any(String)
    );

    jest.advanceTimersByTime(300);

    expect(setItemSpy).toHaveBeenCalledWith(
      LOCAL_STORE.MD_RESUME,
      expect.stringContaining("更新")
    );

    setItemSpy.mockRestore();
    jest.useRealTimers();
  });
});
