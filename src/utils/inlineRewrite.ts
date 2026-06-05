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

export function insertAfterSelectedText(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  insertion: string
) {
  const end = Math.max(selectionStart, Math.min(selectionEnd, value.length));
  const text = insertion.trim();
  const prefix = value.slice(0, end);
  const suffix = value.slice(end);
  const separator = prefix.endsWith("\n") ? "" : "\n";
  return `${prefix}${separator}${text}${suffix}`;
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

export function applyInputSelectionInsertion(
  element: HTMLInputElement | HTMLTextAreaElement,
  insertion: string,
  selectionStart?: number,
  selectionEnd?: number
) {
  const start = selectionStart ?? element.selectionStart ?? 0;
  const end = selectionEnd ?? element.selectionEnd ?? start;
  const text = insertion.trim();
  const nextValue = insertAfterSelectedText(element.value, start, end, text);
  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  valueSetter?.call(element, nextValue);
  const cursor = Math.max(start, end) + (element.value.slice(0, Math.max(start, end)).endsWith("\n") ? 0 : 1) + text.length;
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
