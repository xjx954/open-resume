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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clearInlineToken(token: any) {
  token.content = '';
  token.children = [];
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
    .use(MdContainer, 'sidebar', {
        render: function (tokens: MarkdownToken[], idx: number) {
            if (tokens[idx].nesting === 1) {
                return '<div class="resume-layout resume-layout--two-column"><div class="resume-sidebar">';
            }
            return '</div>';
        }
    })
    .use(MdContainer, 'main', {
        render: function (tokens: MarkdownToken[], idx: number) {
            if (tokens[idx].nesting === 1) {
                return '<main class="resume-main">';
            }
            return '</main></div>';
        }
    })
    .use(MdContainer, 'title')
    .use(MdHContainer)
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
            const parts = text.split('|').map((part: string) => part.trim()).filter(Boolean);
            if (parts.length === 3 || parts.length === 2) {
                clearInlineToken(inlineToken);
                token.attrJoin('class', 'entry-title');
                if (parts.length === 3) {
                    return [
                        '<h3 class="entry-title resume-entry-title">',
                        '<span class="resume-entry-row resume-entry-row-3">',
                        `<span class="resume-entry-main">${escapeHtml(parts[0])}</span>`,
                        `<span class="resume-entry-role">${escapeHtml(parts[1])}</span>`,
                        `<span class="resume-entry-date">${escapeHtml(parts[2])}</span>`,
                        '</span>',
                    ].join('');
                }
                return [
                    '<h3 class="entry-title resume-entry-title">',
                    '<span class="resume-entry-row resume-entry-row-2">',
                    `<span class="resume-entry-main">${escapeHtml(parts[0])}</span>`,
                    `<span class="resume-entry-date">${escapeHtml(parts[1])}</span>`,
                    '</span>',
                ].join('');
            }
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
            return `</h3><span class="entry-date resume-entry-date">${escapeHtml(date)}</span></div>`;
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
    aTag.click();
    if (url.startsWith('blob:')) {
        window.setTimeout(() => URL.revokeObjectURL(url), 3000);
    }
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
