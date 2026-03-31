/**
 * Expand a DOM Range to full English sentence boundaries (Intl.Segmenter + regex fallback).
 * Indices are computed from a flat concatenation of text nodes under the expansion root.
 */

function isBlockLike(el: HTMLElement): boolean {
  const tag = el.tagName;
  const blocks = new Set([
    "P",
    "DIV",
    "LI",
    "TD",
    "TH",
    "BLOCKQUOTE",
    "SECTION",
    "ARTICLE",
    "MAIN",
    "ASIDE",
    "HEADER",
    "FOOTER",
    "FIGCAPTION",
    "PRE",
  ]);
  if (blocks.has(tag)) return true;
  if (el.getAttribute("role") === "paragraph") return true;
  return false;
}

export function getExpansionRoot(range: Range): HTMLElement | null {
  let node: Node | null = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = (node as Text).parentElement;
  }
  while (node && node !== document.body && node !== document.documentElement) {
    if (node instanceof HTMLElement) {
      if (isBlockLike(node)) return node;
      if (node.dataset.ttsExpandRoot !== undefined) return node;
    }
    node = node.parentElement;
  }
  return document.body;
}

function shouldSkipTextParent(el: HTMLElement | null): boolean {
  if (!el) return true;
  return Boolean(el.closest("script, style, noscript, [data-no-selection-tts]"));
}

function collectTextNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const out: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    if (shouldSkipTextParent(t.parentElement)) continue;
    out.push(t);
  }
  return out;
}

function findFirstTextInSubtree(node: Node | null): Text | null {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node as Text;
    if (!shouldSkipTextParent(t.parentElement)) return t;
    return null;
  }
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    if (!shouldSkipTextParent(t.parentElement)) return t;
  }
  return null;
}

function findLastTextInSubtree(node: Node | null): Text | null {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node as Text;
    if (!shouldSkipTextParent(t.parentElement)) return t;
    return null;
  }
  const list: Text[] = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    if (!shouldSkipTextParent(t.parentElement)) list.push(t);
  }
  return list.length ? list[list.length - 1]! : null;
}

/**
 * Map (container, offset) to flat index in `texts` / joined string.
 */
function boundaryToFlatIndex(
  root: HTMLElement,
  container: Node,
  offset: number,
  texts: Text[]
): number | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const te = container as Text;
    if (!root.contains(te)) return null;
    let pos = 0;
    for (const t of texts) {
      if (t === te) return pos + Math.min(Math.max(0, offset), t.length);
      pos += t.length;
    }
    return null;
  }

  if (container.nodeType === Node.ELEMENT_NODE && root.contains(container)) {
    const el = container as HTMLElement;
    if (offset === 0) {
      const first = findFirstTextInSubtree(el.firstChild);
      if (!first) return null;
      let pos = 0;
      for (const t of texts) {
        if (t === first) return pos;
        pos += t.length;
      }
      return null;
    }
    if (offset >= el.childNodes.length) {
      const last = findLastTextInSubtree(el.lastChild);
      if (!last) return null;
      let pos = 0;
      for (const t of texts) {
        if (t === last) return pos + t.length;
        pos += t.length;
      }
      return null;
    }
    const before = el.childNodes[offset];
    const first = findFirstTextInSubtree(before);
    if (!first) return null;
    let pos = 0;
    for (const t of texts) {
      if (t === first) return pos;
      pos += t.length;
    }
  }

  return null;
}

function flatIndexToBoundary(
  index: number,
  texts: Text[]
): { node: Text; offset: number } | null {
  if (index < 0) return null;
  let pos = 0;
  for (const t of texts) {
    const next = pos + t.length;
    if (index <= next) {
      return { node: t, offset: Math.min(t.length, index - pos) };
    }
    pos = next;
  }
  if (texts.length === 0) return null;
  const last = texts[texts.length - 1]!;
  return { node: last, offset: last.length };
}

function rangeToGlobalIndices(
  range: Range,
  root: HTMLElement,
  texts: Text[]
): { g0: number; g1: number } | null {
  const g0 = boundaryToFlatIndex(root, range.startContainer, range.startOffset, texts);
  const g1 = boundaryToFlatIndex(root, range.endContainer, range.endOffset, texts);
  if (g0 == null || g1 == null || g0 > g1) return null;
  const fullLen = texts.reduce((a, t) => a + t.length, 0);
  if (g1 > fullLen) return null;
  return { g0, g1 };
}

function expandIndicesToSentences(full: string, g0: number, g1: number): { e0: number; e1: number } {
  if (!full.length || g0 >= g1) return { e0: g0, e1: g1 };

  try {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
      const segs = [...segmenter.segment(full)];
      let e0 = full.length;
      let e1 = 0;
      for (const seg of segs) {
        const s = seg.index;
        const e = seg.index + seg.segment.length;
        if (s < g1 && e > g0) {
          e0 = Math.min(e0, s);
          e1 = Math.max(e1, e);
        }
      }
      if (e0 < e1) return { e0, e1 };
    }
  } catch {
    /* fallback */
  }

  let e0 = g0;
  let e1 = g1;
  const before = full.slice(0, g0);
  const reEnd = /[.!?](?:['"')\]]?)(?:\s+|$)/g;
  let lastBreak = 0;
  let m: RegExpExecArray | null;
  while ((m = reEnd.exec(before)) !== null) {
    lastBreak = m.index + m[0].length;
  }
  e0 = lastBreak;

  const after = full.slice(g1);
  const match = after.match(/[.!?](?:['"')\]]?)(?:\s+|$)/);
  if (match && match.index !== undefined) {
    e1 = g1 + match.index + match[0].length;
  } else {
    e1 = full.length;
  }

  e0 = Math.max(0, e0);
  e1 = Math.min(full.length, e1);
  return { e0, e1 };
}

export type SentenceExpandResult = {
  expandedText: string;
  originalText: string;
  expandedRange: Range;
};

export function computeSentenceExpansion(range: Range): SentenceExpandResult | null {
  const root = getExpansionRoot(range);
  if (!root) return null;

  const texts = collectTextNodes(root);
  if (!texts.length) return null;

  const full = texts.map((t) => t.data).join("");
  if (!full.length) return null;

  const idx = rangeToGlobalIndices(range, root, texts);
  if (!idx) return null;

  const { g0, g1 } = idx;
  const originalText = full.slice(g0, g1).replace(/\s+/g, " ").trim();
  if (!originalText) return null;

  const { e0, e1 } = expandIndicesToSentences(full, g0, g1);
  const startB = flatIndexToBoundary(e0, texts);
  const endB = flatIndexToBoundary(e1, texts);
  if (!startB || !endB) return null;

  let expandedRange: Range;
  try {
    expandedRange = document.createRange();
    expandedRange.setStart(startB.node, startB.offset);
    expandedRange.setEnd(endB.node, endB.offset);
  } catch {
    return null;
  }

  const expandedText = full.slice(e0, e1).replace(/\s+/g, " ").trim();
  if (!expandedText) return null;

  if (expandedText === originalText) return null;

  return { expandedText, originalText, expandedRange };
}

export function applyExpandedSelection(expandedRange: Range): void {
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(expandedRange);
}
