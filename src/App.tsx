import React, { useEffect } from "react";
import "./App.css";
import "./utils/codemirror-github-light-theme.css";
import Home from "./pages/Home";
import Main from "./pages/Main";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import "./themes/common.less";
import "./themes/editor-tokens.less";
import HeaderBar from "./components/HeaderBar/index";
import HeaderCommonBar from "./components/HeaderCommonBar/index";
import Square from "./pages/Square";
import ErrorBoundary from "./components/ErrorBoundary";
import { setupResizeHandler } from "@src/utils/window-event";
import { LOCAL_STORE } from "@src/utils/const";

function App() {
  useEffect(() => {
    const color = localStorage.getItem(LOCAL_STORE.MD_COLOR) || "#39393a";
    document.body.style.setProperty("--bg", color);
  }, []);

  useEffect(() => {
    return setupResizeHandler();
  }, []);

  return (
    <div className="rs-root">
      <ErrorBoundary>
        <Router>
          <Switch>
            <Route exact path="/">
              <HeaderCommonBar></HeaderCommonBar>
              <Home></Home>
            </Route>
            <Route path="/editor">
              <HeaderCommonBar></HeaderCommonBar>
              <HeaderBar></HeaderBar>
              <Main></Main>
            </Route>
            <Route path="/square">
              <HeaderCommonBar></HeaderCommonBar>
              <div className="rs-body">
                <Square></Square>
              </div>
            </Route>
          </Switch>
        </Router>
      </ErrorBoundary>
    </div>
  );
}

export default App;
