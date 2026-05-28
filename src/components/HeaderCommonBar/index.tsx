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
  const { globalStore } = useStores();
  const { curTab, setCurTab } = globalStore;
  const location = useLocation();

  useEffect(() => {
    setCurTab(location.pathname);
  }, [location.pathname, setCurTab]);

  return (
    <div className="rsC-header">
      <div className="rsC-header__logo">
        <h1>
          <Link to="/">
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
                <Link to={item.url}>{item.title}</Link>
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
      <Link className="rsC-header__cta" to="/editor">
        开始制作
      </Link>
    </div>
  );
});

export default HeaderCommonBar;
