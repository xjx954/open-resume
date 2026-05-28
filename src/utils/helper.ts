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
                // opening tag
                return '<div class="right">';
            } else {
                // closing tag
                return '</div></div>';
            }
        }

    })
    .use(MdContainer, 'title')
    .use(MdNContainer)

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
