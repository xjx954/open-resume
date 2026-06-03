import React from "react";
import { render } from "@testing-library/react";
import TemplatePreview, { buildTemplatePreviewSrcDoc } from "../index";

const markdown = `# 张安然 - 后端工程师

::: left
Java / Spring Boot / MySQL
:::

## 工作经历

### 星河科技 - 后端工程师（2023.07-至今）

- 负责订单中心核心接口开发
`;

describe("TemplatePreview", () => {
  it("builds an isolated iframe document with rendered resume html and theme css", () => {
    const srcDoc = buildTemplatePreviewSrcDoc({
      markdown,
      theme: "blue",
      themeColor: "#5974D4",
    });

    expect(srcDoc).toContain("/themes/blue.css");
    expect(srcDoc).toContain("--bg: #5974D4");
    expect(srcDoc).toContain("张安然 - 后端工程师");
    expect(srcDoc).toContain("resume-section-title");
  });

  it("renders an iframe with the generated preview document", () => {
    const { getByTitle } = render(
      <TemplatePreview
        title="蓝色专业模板"
        markdown={markdown}
        theme="blue"
        themeColor="#5974D4"
      />
    );

    const iframe = getByTitle("蓝色专业模板") as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.getAttribute("srcDoc")).toContain("/themes/blue.css");
  });
});
