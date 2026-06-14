import TemplateStore from "../template.store";
import { LOCAL_STORE } from "@src/utils/const";

describe("TemplateStore persistence", () => {
  beforeEach(() => {
    localStorage.clear();
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
});
