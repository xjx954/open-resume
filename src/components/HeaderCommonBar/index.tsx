import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { observer } from "mobx-react";
import { useStores } from "@src/store";
import "./index.less";

const menu = [
  {
    url: "/square",
    title: "模板",
  },
];

const githubUrl = "https://github.com/xjx954/open-resume";

const HeaderCommonBar = observer(() => {
  const { globalStore, templateStore } = useStores();
  const { curTab, setCurTab } = globalStore;
  const location = useLocation();

  useEffect(() => {
    setCurTab(location.pathname);
  }, [location.pathname, setCurTab]);

  const guardNavigation = (event: React.MouseEvent, targetPath: string) => {
    if (
      location.pathname === "/editor" &&
      targetPath !== "/editor" &&
      templateStore.hasUnsavedChanges &&
      !window.confirm("当前简历有尚未归档到历史记录的修改。离开编辑器不会清空本机内容，但继续使用模板可能覆盖当前内容。是否继续？")
    ) {
      event.preventDefault();
    }
  };

  return (
    <div className="rsC-header">
      <div className="rsC-header__logo">
        <h1>
          <Link to="/" onClick={(event) => guardNavigation(event, "/")}>
            <img src="/images/app-logo.svg" alt="" />
            <span>Open Resume</span>
          </Link>
        </h1>
      </div>
      <div className="rsC-header__menu">
        <ul>
          {menu.map((item) => {
            return (
              <li
                key={item.url}
                className={`nav-li ${curTab === item.url ? "current" : ""}`}
              >
                <Link to={item.url} onClick={(event) => guardNavigation(event, item.url)}>{item.title}</Link>
              </li>
            );
          })}
          <li className="nav-li">
            <a href={githubUrl} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </li>
        </ul>
      </div>
      <Link className="rsC-header__cta" to="/editor" onClick={(event) => guardNavigation(event, "/editor")}>
        开始制作
      </Link>
    </div>
  );
});

export default HeaderCommonBar;
