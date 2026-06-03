import React, { useEffect, useMemo, useRef, useState } from "react";
import { setHtmlView } from "@src/utils/global";
import "./index.less";

interface BuildPreviewOptions {
  markdown: string;
  theme: string;
  themeColor: string;
}

interface TemplatePreviewProps extends BuildPreviewOptions {
  title: string;
  className?: string;
  scale?: number;
  lazy?: boolean;
  mode?: "thumb" | "modal" | "fullscreen";
}

export function buildTemplatePreviewSrcDoc({
  markdown,
  theme,
  themeColor,
}: BuildPreviewOptions): string {
  const html = setHtmlView(themeColor, markdown);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="/themes/${theme}.css" />
  <style>
    :root { --bg: ${themeColor}; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f8fafc;
      color: #111827;
      overflow-x: hidden;
    }
    .rs-view-inner {
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
    }
    .rs-view {
      min-height: 1123px;
    }
  </style>
</head>
<body>
  <div class="rs-view-inner">
    <div class="rs-view">${html}</div>
  </div>
</body>
</html>`;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  title,
  markdown,
  theme,
  themeColor,
  className = "",
  scale = 1,
  lazy = false,
  mode = "thumb",
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [canRender, setCanRender] = useState(!lazy);

  useEffect(() => {
    if (!lazy || canRender) return;
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setCanRender(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCanRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canRender, lazy]);

  const srcDoc = useMemo(
    () => buildTemplatePreviewSrcDoc({ markdown, theme, themeColor }),
    [markdown, theme, themeColor]
  );

  return (
    <div
      ref={rootRef}
      className={`template-preview template-preview--${mode} ${className}`}
      style={{ ["--preview-scale" as string]: scale }}
    >
      {canRender ? (
        <div className="template-preview__frame">
          <iframe
            title={title}
            srcDoc={srcDoc}
            sandbox=""
            loading={lazy ? "lazy" : "eager"}
          />
        </div>
      ) : (
        <div className="template-preview__skeleton">正在准备预览</div>
      )}
    </div>
  );
};

export default TemplatePreview;
