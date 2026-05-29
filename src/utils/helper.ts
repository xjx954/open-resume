import MarkdownIt from "markdown-it";
import MdContainer from 'markdown-it-container';
import MdHContainer from './markdown-it-h-container';
import MdNContainer from './markdown-it-n';
import MdEmjio from 'markdown-it-emoji';
import svgMap from './svgMap';
import axios from 'axios';
import DOMPurify from 'dompurify';

interface MarkdownToken {
  nesting: number;
}

export const markdownParserResume = new MarkdownIt({
    html: true,
    breaks: true,
});

markdownParserResume
    .use(MdEmjio, {
        defs: svgMap,
        shortcuts: Object.keys(svgMap).reduce<Record<string, string>>((obj, item) => {
            obj[item] = `icon:${item}`;
            return obj;
        }, {})
    })
    .use(MdHContainer)
    .use(MdContainer, 'header')
    .use(MdContainer, 'left', {
        render: function (tokens: MarkdownToken[], idx: number) {
            if (tokens[idx].nesting === 1) {
                return '<div class="lr-container"><div class="left">';
            } else {
                return '</div>'
            }
        }
    })
    .use(MdContainer, 'right', {
        render: function (tokens: MarkdownToken[], idx: number) {
            if (tokens[idx].nesting === 1) {
                return '<div class="right">';
            } else {
                return '</div></div>';
            }
        }

    })
    .use(MdContainer, 'title')
    .use(MdNContainer)

// ── Custom heading renderers: unified entry-header layout ──

markdownParserResume.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx];

    if (token.tag === 'h2') {
        token.attrJoin('class', 'resume-section-title');
    }

    if (token.tag === 'h3') {
        const inlineToken = tokens[idx + 1];
        if (inlineToken && inlineToken.type === 'inline') {
            const text = inlineToken.content;
            const dateMatch = text.match(/[（(]([^）)]+)[）)]\s*$/);
            if (dateMatch) {
                (env as any)._h3date = dateMatch[1];
                inlineToken.content = text
                    .replace(/[（(][^）)]+[）)]\s*$/, '')
                    .replace(/\s*[-—–]\s*$/, '')
                    .trim();
                if (inlineToken.children) {
                    for (let c = inlineToken.children.length - 1; c >= 0; c--) {
                        const child = inlineToken.children[c];
                        if (child.type === 'text') {
                            child.content = (child.content || '')
                                .replace(/[（(][^）)]+[）)]\s*$/, '')
                                .replace(/\s*[-—–]\s*$/, '')
                                .trim();
                            break;
                        }
                    }
                }
                token.attrJoin('class', 'entry-title');
                return '<div class="entry-header"><h3 class="entry-title">';
            }
        }
        token.attrJoin('class', 'entry-title');
        return '<h3 class="entry-title">';
    }

    return self.renderToken(tokens, idx, options);
};

markdownParserResume.renderer.rules.heading_close = function (tokens, idx, options, env, self) {
    const token = tokens[idx];

    if (token.tag === 'h3') {
        const date = (env as any)._h3date;
        delete (env as any)._h3date;
        if (date) {
            return `<span class="entry-date">${date}</span></div></h3>`;
        }
        return '</h3>';
    }

    return self.renderToken(tokens, idx, options);
};

export function downloadDirect(url: string, name: string) {
    const aTag = document.createElement('a');
    aTag.download = name;
    aTag.target = '_blank';
    aTag.href = url;
    aTag.click()
}

export function downloadByContent(content: BlobPart, filename: string, type: string) {
  const aTag = document.createElement('a');
  aTag.download = filename;
  const blob = new Blob([content], { type });
  const blobUrl = URL.createObjectURL(blob);
  aTag.href = blobUrl;
  aTag.click();
  URL.revokeObjectURL(blobUrl);
}

export async function downloadFetch(url: string, name: string) {
  const result = await axios({
    method: 'get',
    url,
    responseType: 'blob'
  });
  downloadByContent(result.data, name, 'application/pdf');
}

export async function copyText(value: string, callback?: () => void) {
  try {
    await navigator.clipboard.writeText(value);
    callback?.();
  } catch {
    // Fallback for older browsers or non-HTTPS contexts
    const input = document.createElement('input');
    input.setAttribute('readonly', 'readonly');
    input.value = value;
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, 9999);
    document.execCommand('copy');
    document.body.removeChild(input);
    callback?.();
  }
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'svg', 'path', 'circle', 'rect', 'line',
      'g', 'defs', 'use', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'strong', 'em', 'b', 'i', 'u', 's', 'code', 'pre', 'blockquote',
      'section', 'header', 'footer', 'article', 'nav', 'main',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'class', 'id', 'style', 'target', 'rel',
      'width', 'height', 'viewBox', 'fill', 'd', 'xlink:href', 'aria-hidden',
      'xmlns', 'version', 'p-id', 'xmlns:xlink', 'data-pages',
    ],
  });
}

export const markdownParserArticle = new MarkdownIt({
    html: true
});
