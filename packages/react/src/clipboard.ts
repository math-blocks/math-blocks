import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import { print } from '@math-blocks/tex';

import { mathElement } from './editor-mathml';

// Turns selected math into what's put on the clipboard: TeX as plain text, so
// it pastes into calculators, documents and messages, and MathML as HTML, so
// apps that understand it (Word, Google Docs, ...) paste real math.

export type ClipboardContent = {
  // TeX, for text/plain.
  readonly text: string;
  // A MathML <math> element, for text/html.
  readonly html: string;
};

/**
 * The nodes a selection covers, as a row of their own, or null when the
 * selection is collapsed or doesn't fit the row.
 */
export const getSelectedRow = (
  row: Editor.types.CharRow,
  selection: Editor.Selection,
): Editor.types.CharRow | null => {
  if (Editor.SelectionUtils.isCollapsed(selection)) {
    return null;
  }
  const { path, start, end } = Editor.SelectionUtils.getPathAndRange(selection);
  const parent = Editor.PathUtils.getNodeAtPath(row, path);
  if (parent?.type !== 'row') {
    return null;
  }
  const children = parent.children.slice(start, end);
  return children.length > 0 ? Editor.builders.row(children) : null;
};

const escapeText = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttribute = (value: string): string =>
  escapeText(value).replace(/"/g, '&quot;');

/**
 * Serializes the MathML that editor-mathml builds. It only has elements with
 * string attributes and text, so this is enough, and it keeps react-dom out
 * of the package's dependencies.
 */
export const toMarkup = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return escapeText(String(node));
  }
  if (Array.isArray(node)) {
    return node.map(toMarkup).join('');
  }
  if (React.isValidElement<Record<string, unknown>>(node)) {
    const { type, props } = node;
    if (typeof type !== 'string') {
      throw new Error('toMarkup only serializes elements such as <mi>');
    }
    let attributes = '';
    for (const [name, value] of Object.entries(props)) {
      if (name === 'children' || value === undefined) {
        continue;
      }
      if (typeof value === 'string' || typeof value === 'number') {
        attributes += ` ${name}="${escapeAttribute(String(value))}"`;
      } else {
        throw new Error(`toMarkup can't serialize the attribute ${name}`);
      }
    }
    return `<${type}${attributes}>${toMarkup(props.children as React.ReactNode)}</${type}>`;
  }
  throw new Error('toMarkup can only serialize elements and text');
};

/**
 * TeX and MathML for a row, e.g. all of a renderer's math.
 */
export const rowToClipboard = (
  row: Editor.types.CharRow,
  display: 'block' | 'inline',
): ClipboardContent => ({
  text: print(row),
  html: toMarkup(mathElement(row, display)),
});

/**
 * TeX and MathML for the selected part of a row, or null when nothing is
 * selected.
 */
export const selectionToClipboard = (
  row: Editor.types.CharRow,
  selection: Editor.Selection,
  display: 'block' | 'inline',
): ClipboardContent | null => {
  const selected = getSelectedRow(row, selection);
  return selected ? rowToClipboard(selected, display) : null;
};

/**
 * Puts the content on the clipboard in place of what the browser would copy.
 * Call it from a `copy` event handler.
 */
export const writeToClipboard = (
  e: ClipboardEvent,
  content: ClipboardContent,
): void => {
  if (!e.clipboardData) {
    return;
  }
  e.clipboardData.setData('text/plain', content.text);
  e.clipboardData.setData('text/html', content.html);
  e.preventDefault();
};
