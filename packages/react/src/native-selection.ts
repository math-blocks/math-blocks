import * as React from 'react';

import type * as Editor from '@math-blocks/editor';

import { rowToClipboard } from './clipboard';

// The page's own text selection doesn't take in MathRenderer's math: the SVG
// has no text, and the hidden MathML for screen readers can't be selected (see
// editor-mathml.tsx). So that a text selection across the math behaves as if
// the math were text, this module
//
// - tells each renderer when a text selection covers any of it, so that it
//   can highlight all of its math (`selectionchange`), and
// - puts each covered expression's TeX, in order, in place of the math when
//   the selection is copied (`copy`), the way KaTeX's copy-tex does. The HTML
//   gets each expression's MathML.
//
// One pair of listeners on the document serves every renderer.

// The attribute that marks a renderer's elements, so that they can be found
// in a copy of the selected part of the page. It's only set while copying.
const MATH_ATTRIBUTE = 'data-math-blocks-copy';

type Entry = {
  // Whether the renderer takes part in text selections. One that doesn't is
  // left out of what's copied, as the browser would leave it out.
  readonly isEnabled: () => boolean;
  // The renderer's elements: its SVG and its hidden MathML.
  readonly getElements: () => readonly Element[];
  readonly getRow: () => Editor.types.CharRow;
  readonly getDisplay: () => 'block' | 'inline';
  // Called when the text selection changes. `covered` is whether it covers
  // any of the renderer's elements.
  readonly onChange: (covered: boolean) => void;
};

const entries = new Map<string, Entry>();
let nextId = 0;

/** Whether there's a text selection that isn't empty. */
export const hasTextSelection = (): boolean => {
  const selection = document.getSelection();
  return !!selection && selection.rangeCount > 0 && !selection.isCollapsed;
};

/** Whether the text selection covers any part of any of the elements. */
const covers = (elements: readonly Element[]): boolean => {
  const selection = document.getSelection();
  if (!selection || !hasTextSelection()) {
    return false;
  }
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    if (elements.some((element) => range.intersectsNode(element))) {
      return true;
    }
  }
  return false;
};

const onSelectionChange = (): void => {
  for (const entry of entries.values()) {
    entry.onChange(entry.isEnabled() && covers(entry.getElements()));
  }
};

// TeX in text is set off by dollar signs: one for inline math, two for
// display math.
const delimit = (tex: string, display: 'block' | 'inline'): string =>
  display === 'block' ? `$$${tex}$$` : `$${tex}$`;

/**
 * Replaces each renderer in a copy of part of the page with its TeX (for
 * text/plain) or its MathML (for text/html). A renderer's SVG and hidden
 * MathML are replaced once, by whichever comes first; the other is removed.
 * Renderers that aren't selectable are removed. Returns whether there were
 * any renderers.
 */
const replaceMath = (
  fragment: DocumentFragment,
  kind: 'text' | 'html',
): boolean => {
  const seen = new Set<string>();
  let found = false;
  for (const element of Array.from(
    fragment.querySelectorAll(`[${MATH_ATTRIBUTE}]`),
  )) {
    const id = element.getAttribute(MATH_ATTRIBUTE) ?? '';
    const entry = entries.get(id);
    found = true;
    if (!entry || !entry.isEnabled() || seen.has(id)) {
      element.remove();
      continue;
    }
    seen.add(id);
    const display = entry.getDisplay();
    const content = rowToClipboard(entry.getRow(), display);
    if (kind === 'text') {
      element.replaceWith(delimit(content.text, display));
    } else {
      const template = document.createElement('template');
      template.innerHTML = content.html;
      element.replaceWith(template.content);
    }
  }
  return found;
};

const toHtml = (fragment: DocumentFragment): string => {
  const container = document.createElement('div');
  container.appendChild(fragment);
  return container.innerHTML;
};

const onCopy = (e: ClipboardEvent): void => {
  const selection = document.getSelection();
  if (!selection || !hasTextSelection() || !e.clipboardData) {
    return;
  }
  let text = '';
  let html = '';
  let found = false;
  // Mark the renderers' elements so that they can be found in copies of the
  // selection, and unmark them straight after. That all happens before the
  // page is next drawn, so nothing else sees the marks.
  const marked: Element[] = [];
  for (const [id, entry] of entries) {
    for (const element of entry.getElements()) {
      element.setAttribute(MATH_ATTRIBUTE, id);
      marked.push(element);
    }
  }
  try {
    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);
      const forText = range.cloneContents();
      const forHtml = range.cloneContents();
      found = replaceMath(forText, 'text') || found;
      replaceMath(forHtml, 'html');
      text += forText.textContent ?? '';
      html += toHtml(forHtml);
    }
  } finally {
    for (const element of marked) {
      element.removeAttribute(MATH_ATTRIBUTE);
    }
  }
  // Without math in it, the browser copies the selection as usual.
  if (!found) {
    return;
  }
  e.clipboardData.setData('text/plain', text);
  e.clipboardData.setData('text/html', html);
  e.preventDefault();
};

const register = (entry: Entry): string => {
  const id = `${nextId++}`;
  if (entries.size === 0) {
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('copy', onCopy);
  }
  entries.set(id, entry);
  return id;
};

const unregister = (id: string): void => {
  entries.delete(id);
  if (entries.size === 0) {
    document.removeEventListener('selectionchange', onSelectionChange);
    document.removeEventListener('copy', onCopy);
  }
};

type Options = {
  // Whether the renderer takes part in text selections: highlighted when one
  // covers it, and copied as TeX.
  readonly enabled: boolean;
  readonly row: Editor.types.CharRow;
  readonly display: 'block' | 'inline';
  readonly svgRef: React.RefObject<Element | null>;
  readonly mathmlRef: React.RefObject<Element | null>;
};

/**
 * Makes a renderer part of the page's text selection. Returns whether a text
 * selection covers any of its math.
 */
export const useNativeSelection = ({
  enabled,
  row,
  display,
  svgRef,
  mathmlRef,
}: Options): boolean => {
  const [covered, setCovered] = React.useState<boolean>(false);

  const latest = React.useRef({ enabled, row, display });
  latest.current = { enabled, row, display };

  // Even a renderer that isn't selectable registers, so that its hidden
  // MathML is left out of what's copied.
  React.useEffect(() => {
    const getElements = (): Element[] =>
      [svgRef.current, mathmlRef.current].filter(
        (element): element is Element => element !== null,
      );
    const id = register({
      isEnabled: () => latest.current.enabled,
      getElements,
      getRow: () => latest.current.row,
      getDisplay: () => latest.current.display,
      onChange: setCovered,
    });
    // The page may already have a selection, e.g. after a rerender.
    onSelectionChange();
    return () => {
      unregister(id);
      setCovered(false);
    };
  }, [svgRef, mathmlRef]);

  return enabled && covered;
};
