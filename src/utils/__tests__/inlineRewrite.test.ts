import { getInlineRewriteContext, insertAfterSelectedText, replaceSelectedText } from "../inlineRewrite";

describe("replaceSelectedText", () => {
  it("replaces only the selected range", () => {
    const result = replaceSelectedText(
      "负责模块开发，参与需求评审",
      0,
      6,
      "主导核心模块开发"
    );

    expect(result).toBe("主导核心模块开发，参与需求评审");
  });

  it("uses a trimmed replacement without changing surrounding text", () => {
    const result = replaceSelectedText(
      "项目成果：加载速度提升 30%",
      5,
      15,
      "\n首屏加载速度提升 30%\n"
    );

    expect(result).toBe("项目成果：首屏加载速度提升 30%");
  });
});

describe("insertAfterSelectedText", () => {
  it("inserts the AI result after the selected range on a new line", () => {
    const result = insertAfterSelectedText(
      "负责系统开发和维护",
      0,
      10,
      "负责核心系统开发、上线维护与稳定性优化"
    );

    expect(result).toBe("负责系统开发和维护\n负责核心系统开发、上线维护与稳定性优化");
  });
});

describe("getInlineRewriteContext", () => {
  it("uses the section and entry title instead of the input placeholder", () => {
    document.body.innerHTML = `
      <div class="block-card">
        <span class="block-card-title__label">工作经历</span>
        <div class="block-entry-card">
          <span class="block-entry-card__title">星河科技 - 前端工程师</span>
          <input placeholder="要点内容" value="负责核心模块开发" />
        </div>
      </div>
    `;

    const input = document.querySelector("input") as HTMLInputElement;

    expect(getInlineRewriteContext(input)).toBe("工作经历 / 星河科技 - 前端工程师");
  });

  it("falls back to the section title when there is no entry title", () => {
    document.body.innerHTML = `
      <div class="block-card">
        <span class="block-card-title__label">技能</span>
        <input placeholder="要点内容" value="React" />
      </div>
    `;

    const input = document.querySelector("input") as HTMLInputElement;

    expect(getInlineRewriteContext(input)).toBe("技能");
  });
});
