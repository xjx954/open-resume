import { LOCAL_STORE, themes } from '@src/utils/const';
import { markdownParserResume, sanitizeHtml } from "@utils/helper";
import { renderPlugin, colorPlugin } from '@src/utils/plugins';
import { getTheme } from "@utils/changeThemes";

export interface ResumeEditorRef {
    getValue: () => string;
    setValue: (value: string | ArrayBuffer) => void;
    getCursor?: () => unknown;
    replaceRange?: (value: string, cursor: unknown) => void;
}

interface HistoryInfo {
    md: string
    theme: string
    color: string
}

export type HistoryLocalInfo = HistoryInfo & {time: number}

export function setMdHistory(value: HistoryInfo) {
    const { MD_HISTORY } = LOCAL_STORE;
    const historyStr = localStorage.getItem(MD_HISTORY);
    let historyObject: HistoryLocalInfo[] = [];
    if (historyStr) {
        historyObject = JSON.parse(historyStr);
    }
    if (historyObject.length === 8) {
        historyObject.shift();
    }
    historyObject.push({
        ...value,
        time: Date.now()
    });
    localStorage.setItem(MD_HISTORY, JSON.stringify(historyObject));
}

// Content-driven: accepts a Markdown string directly (no editorRef dependency).
export function setHtmlView(color: string, markdown: string): string {
    const html = renderPlugin(markdownParserResume.render(markdown), {
        plugins: [{
            fn: colorPlugin,
            params: {
                color,
            }
        }]
    });
    return sanitizeHtml(html);
}

// Convenience: writes rendered HTML directly to .rs-view DOM node.
export function renderViewStyle(color: string, markdown: string) {
    const rsViewer = document.querySelector(".rs-view") as HTMLElement;
    if (rsViewer) {
        rsViewer.innerHTML = setHtmlView(color, markdown);
        rsViewer.style.height = 'auto';
    }
}

export function renderResumePreviewMode(isPreview: boolean, color: string, markdown: string) {
    renderViewStyle(color, markdown);
}

export async function updateTemplate(
    theme: string,
    setColor: (color: string) => void,
    markdown: string,
) {
    const curObj = themes.find(item => item.id === theme);
    if (curObj) {
        await getTheme(theme);
        document.body.style.setProperty("--bg", curObj.defaultColor);
        setColor(curObj.defaultColor);
        renderViewStyle(curObj.defaultColor, markdown);
    }
}

export const updateTempalte = updateTemplate;
