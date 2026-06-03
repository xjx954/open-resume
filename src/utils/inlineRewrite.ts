export function replaceSelectedText(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  replacement: string
) {
  const start = Math.max(0, Math.min(selectionStart, value.length));
  const end = Math.max(start, Math.min(selectionEnd, value.length));
  return `${value.slice(0, start)}${replacement.trim()}${value.slice(end)}`;
}

export function applyInputSelectionReplacement(
  element: HTMLInputElement | HTMLTextAreaElement,
  replacement: string
) {
  const start = element.selectionStart ?? 0;
  const end = element.selectionEnd ?? start;
  const nextValue = replaceSelectedText(element.value, start, end, replacement);
  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  valueSetter?.call(element, nextValue);
  const cursor = start + replacement.trim().length;
  element.setSelectionRange(cursor, cursor);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function readTrimmedText(element: Element | null) {
  return element?.textContent?.trim().replace(/\s+/g, " ") || "";
}

export function getInlineRewriteContext(element: HTMLElement) {
  const blockTitle = readTrimmedText(
    element.closest(".block-card")?.querySelector(".block-card-title__label") || null
  );
  const entryTitle = readTrimmedText(
    element.closest(".block-entry-card")?.querySelector(".block-entry-card__title") || null
  );
  const parts = [blockTitle, entryTitle].filter(Boolean);
  return parts.join(" / ") || "块编辑器字段";
}
