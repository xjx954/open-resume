import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import Home from "./Home";
import { LOCAL_STORE } from "@src/utils/const";

describe("Home", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the new user state when no local resume exists", () => {
    const { getByText, queryByText } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(getByText("立即开始")).toBeInTheDocument();
    expect(queryByText("继续编辑简历")).not.toBeInTheDocument();
  });

  it("shows resume title and template name for returning users", () => {
    localStorage.setItem(LOCAL_STORE.MD_RESUME, "# 王小明\n\nAI 应用工程师\n\n## 项目经历");
    localStorage.setItem(LOCAL_STORE.MD_THEME, "blue");

    const { getAllByText, getByText } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(getByText("继续编辑简历")).toBeInTheDocument();
    expect(getAllByText("王小明").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("当前模板：蓝色专业").length).toBeGreaterThanOrEqual(1);
  });
});
