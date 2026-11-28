/**
 * @vitest-environment jsdom
 */
// A drag that starts in MathRenderer's math and leaves it for the text around
// it becomes a text selection that takes in all of the math. jsdom has no
// layout, so the browser's caret lookup (caretPositionFromPoint, or the older
// caretRangeFromPoint) is stubbed to return a position in the page's text.
import fs from 'fs';
import path from 'path';
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
// In the jsdom environment, Vitest resolves 'buffer' to the npm polyfill, which
// has no Blob, so ask for Node's module.
import { Blob } from 'node:buffer';

import * as Editor from '@math-blocks/editor';
import { getFontData, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';

import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';

const { row, char } = Editor.builders;

let fontData: FontData;

beforeAll(async () => {
  const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
  const font = await parse(new Blob([fs.readFileSync(fontPath)]));
  fontData = getFontData(font, 'STIX2');
});

// The document, for setting and removing the stubbed caret lookups.
const stubs = document as unknown as Record<string, unknown>;

beforeEach(() => {
  // Put each SVG at (0, 0) with the size its attributes give it.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const width = Number(this.getAttribute('width') ?? 0);
      const height = Number(this.getAttribute('height') ?? 0);
      return new DOMRect(0, 0, width, height);
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  delete stubs.caretPositionFromPoint;
  delete stubs.caretRangeFromPoint;
  document.getSelection()?.removeAllRanges();
});

// 2x+5=10. With a 64px font, x=67 is over the '+' and x=257 is over the '1'.
const math = row([
  char('2'),
  char('x'),
  char('+'),
  char('5'),
  char('='),
  char('1'),
  char('0'),
]);

const renderPage = (): HTMLElement =>
  render(
    <FontDataContext.Provider value={fontData}>
      <p>
        <span>Solve</span> <MathRenderer row={math} /> <span>for x.</span>
      </p>
    </FontDataContext.Provider>,
  ).container;

const textIn = (container: HTMLElement, text: string): Text => {
  const span = Array.from(container.querySelectorAll('span')).find(
    (s) => s.textContent === text,
  );
  return span?.firstChild as Text;
};

// Points the stubbed caret lookup at `offset` characters into `node`.
const caretAt = (
  node: Node,
  offset: number,
  api: 'position' | 'range' = 'position',
): void => {
  if (api === 'position') {
    stubs.caretPositionFromPoint = () => ({ offsetNode: node, offset });
  } else {
    stubs.caretRangeFromPoint = () => {
      const range = document.createRange();
      range.setStart(node, offset);
      return range;
    };
  }
};

// Tells the page that the text selection changed, as the browser would.
const selectionChanged = (): void =>
  act(() => {
    document.dispatchEvent(new Event('selectionchange'));
  });

const copyText = (): string | undefined => {
  const data = new Map<string, string>();
  const event = new Event('copy', {
    bubbles: true,
    cancelable: true,
  }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: { setData: (type: string, value: string) => data.set(type, value) },
  });
  document.body.dispatchEvent(event);
  return data.get('text/plain');
};

const highlighted = (container: HTMLElement): boolean =>
  (container.querySelector('svg')?.querySelectorAll('rect').length ?? 0) > 0;

test('dragging to the right into text selects from before the math', () => {
  const container = renderPage();
  const svg = container.querySelector('svg') as SVGSVGElement;
  caretAt(textIn(container, 'for x.'), 3);

  fireEvent.mouseDown(svg, { clientX: 67, clientY: 30 });
  fireEvent.mouseMove(window, { clientX: 5000, clientY: 30 });
  selectionChanged();
  fireEvent.mouseUp(window);

  expect(document.getSelection()?.toString()).toContain('for');
  expect(highlighted(container)).toBe(true);
  expect(copyText()).toBe('$$2x+5=10$$ for');
});

test('dragging below the math counts as after it', () => {
  const container = renderPage();
  const svg = container.querySelector('svg') as SVGSVGElement;
  caretAt(textIn(container, 'for x.'), 3);

  fireEvent.mouseDown(svg, { clientX: 67, clientY: 30 });
  fireEvent.mouseMove(window, { clientX: 67, clientY: 5000 });
  fireEvent.mouseUp(window);

  expect(copyText()).toBe('$$2x+5=10$$ for');
});

test('dragging to the left into text selects from after the math', () => {
  const container = renderPage();
  const svg = container.querySelector('svg') as SVGSVGElement;
  caretAt(textIn(container, 'Solve'), 2);

  fireEvent.mouseDown(svg, { clientX: 257, clientY: 30 });
  fireEvent.mouseMove(window, { clientX: -50, clientY: 30 });
  fireEvent.mouseUp(window);

  const selection = document.getSelection();
  // The anchor is after the hidden MathML, which follows the SVG.
  expect(selection?.anchorNode).toBe(svg.parentNode);
  expect(selection?.anchorOffset).toBe(
    Array.from(svg.parentNode?.childNodes ?? []).indexOf(
      svg.nextElementSibling as ChildNode,
    ) + 1,
  );
  expect(copyText()).toBe('lve $$2x+5=10$$');
});

test('dragging above the math counts as before it', () => {
  const container = renderPage();
  const svg = container.querySelector('svg') as SVGSVGElement;
  caretAt(textIn(container, 'Solve'), 2);

  fireEvent.mouseDown(svg, { clientX: 257, clientY: 30 });
  fireEvent.mouseMove(window, { clientX: 257, clientY: -50 });
  fireEvent.mouseUp(window);

  expect(copyText()).toBe('lve $$2x+5=10$$');
});

test('uses caretRangeFromPoint where caretPositionFromPoint is missing', () => {
  const container = renderPage();
  const svg = container.querySelector('svg') as SVGSVGElement;
  caretAt(textIn(container, 'for x.'), 3, 'range');

  fireEvent.mouseDown(svg, { clientX: 67, clientY: 30 });
  fireEvent.mouseMove(window, { clientX: 5000, clientY: 30 });
  fireEvent.mouseUp(window);

  expect(copyText()).toBe('$$2x+5=10$$ for');
});

test('without text under the mouse, it keeps selecting inside the math', () => {
  const container = renderPage();
  const svg = container.querySelector('svg') as SVGSVGElement;
  stubs.caretPositionFromPoint = () => null;

  fireEvent.mouseDown(svg, { clientX: 67, clientY: 30 });
  fireEvent.mouseMove(window, { clientX: 5000, clientY: 30 });
  fireEvent.mouseUp(window);

  expect(document.getSelection()?.rangeCount).toBe(0);
  // From the '+' to the end of the math.
  expect(copyText()).toBe('+5=10');
});

test('a caret inside the math itself is ignored', () => {
  const container = renderPage();
  const svg = container.querySelector('svg') as SVGSVGElement;
  const mathText = container.querySelector('math mn')?.firstChild as Node;
  caretAt(mathText, 0);

  fireEvent.mouseDown(svg, { clientX: 67, clientY: 30 });
  fireEvent.mouseMove(window, { clientX: 5000, clientY: 30 });
  fireEvent.mouseUp(window);

  expect(document.getSelection()?.rangeCount).toBe(0);
});

test('coming back over the math selects inside it again', () => {
  const container = renderPage();
  const svg = container.querySelector('svg') as SVGSVGElement;
  caretAt(textIn(container, 'for x.'), 3);

  fireEvent.mouseDown(svg, { clientX: 67, clientY: 30 });
  fireEvent.mouseMove(window, { clientX: 5000, clientY: 30 });
  selectionChanged();
  fireEvent.mouseMove(window, { clientX: 257, clientY: 30 });
  selectionChanged();
  fireEvent.mouseUp(window);

  expect(document.getSelection()?.rangeCount).toBe(0);
  expect(copyText()).toBe('+5=');
});

test('a text selection made another way clears the selection in the math', () => {
  const container = renderPage();
  const svg = container.querySelector('svg') as SVGSVGElement;
  fireEvent.mouseDown(svg, { clientX: 67, clientY: 30 });
  fireEvent.mouseMove(window, { clientX: 257, clientY: 30 });
  fireEvent.mouseUp(window);
  expect(highlighted(container)).toBe(true);

  // E.g. with the keyboard, selecting only text.
  act(() => {
    const range = document.createRange();
    range.selectNodeContents(textIn(container, 'Solve'));
    document.getSelection()?.addRange(range);
  });
  selectionChanged();

  expect(highlighted(container)).toBe(false);
});
