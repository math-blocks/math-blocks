/**
 * @vitest-environment jsdom
 */
// Selecting math in a MathRenderer by dragging across it.
import fs from 'fs';
import path from 'path';
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
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

beforeEach(() => {
  // jsdom doesn't lay anything out. Put each SVG at (0, 0) with the size its
  // attributes give it, so that dragging off the math has an edge to stop at.
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
});

// 2x+5=10. With a 64px font, x=67 is over the '+' and x=257 is over the '1',
// as in selection.test.tsx.
const math = row([
  char('2'),
  char('x'),
  char('+'),
  char('5'),
  char('='),
  char('1'),
  char('0'),
]);

const renderMath = (
  element: React.ReactElement,
): { container: HTMLElement; rerender: (e: React.ReactElement) => void } => {
  const wrap = (e: React.ReactElement): React.ReactElement => (
    <FontDataContext.Provider value={fontData}>
      <p>
        Solve {e} for x.
        <button>elsewhere</button>
      </p>
    </FontDataContext.Provider>
  );
  const result = render(wrap(element));
  return {
    container: result.container,
    rerender: (e) => result.rerender(wrap(e)),
  };
};

const getSvg = (container: HTMLElement): SVGSVGElement =>
  container.querySelector('svg') as SVGSVGElement;

// What's drawn: the SVG's <g>, with the glyph definitions' IDs, which depend
// on React's useId(), left out.
const drawing = (container: HTMLElement): string =>
  (getSvg(container).querySelector('svg > g')?.outerHTML ?? '').replace(
    /href="#[^"]*?-/g,
    'href="#',
  );

// The selection is drawn as rectangles behind the glyphs, and nothing else in
// the math is a rectangle.
const highlights = (container: HTMLElement): Element[] =>
  Array.from(getSvg(container).querySelectorAll('rect'));

const drag = (svg: Element, fromX: number, toX: number, y = 30): void => {
  fireEvent.mouseDown(svg, { clientX: fromX, clientY: y });
  fireEvent.mouseMove(window, { clientX: toX, clientY: y });
  fireEvent.mouseUp(window, { clientX: toX, clientY: y });
};

// The selection drawn when MathRenderer is given it through its `selection`
// prop: the way the editor draws a selection.
const expectedHighlight = (selection: Editor.Selection): string => {
  const { container } = render(
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} selection={selection} selectable={false} />
    </FontDataContext.Provider>,
  );
  const result = drawing(container);
  container.remove();
  return result;
};

const anchor2focus5: Editor.Selection = {
  anchor: { path: [], offset: 2 },
  focus: { path: [], offset: 5 },
};

test('draws nothing until the user selects something', () => {
  const { container } = renderMath(<MathRenderer row={math} />);

  expect(highlights(container)).toHaveLength(0);
});

test('dragging across the math selects it with the editor’s selection model', () => {
  const { container } = renderMath(<MathRenderer row={math} />);

  drag(getSvg(container), 67, 257);

  expect(highlights(container).length).toBeGreaterThan(0);
  expect(drawing(container)).toEqual(expectedHighlight(anchor2focus5));
});

test('dragging past the end of the math selects up to its end', () => {
  const { container } = renderMath(<MathRenderer row={math} />);

  drag(getSvg(container), 67, 5000);

  expect(drawing(container)).toEqual(
    expectedHighlight({
      anchor: { path: [], offset: 2 },
      focus: { path: [], offset: 7 },
    }),
  );
});

test('a click without a drag selects nothing', () => {
  const { container } = renderMath(<MathRenderer row={math} />);

  drag(getSvg(container), 67, 67);

  expect(highlights(container)).toHaveLength(0);
});

test('moving the mouse after the button comes up changes nothing', () => {
  const { container } = renderMath(<MathRenderer row={math} />);
  drag(getSvg(container), 67, 257);
  const selected = drawing(container);

  fireEvent.mouseMove(window, { clientX: 5, clientY: 30 });

  expect(drawing(container)).toEqual(selected);
});

test('shift-clicking extends the selection', () => {
  const { container } = renderMath(<MathRenderer row={math} />);
  const svg = getSvg(container);
  drag(svg, 67, 67);

  fireEvent.mouseDown(svg, { clientX: 257, clientY: 30, shiftKey: true });
  fireEvent.mouseUp(window);

  expect(drawing(container)).toEqual(expectedHighlight(anchor2focus5));
});

test('a mouse down elsewhere on the page clears the selection', () => {
  const { container } = renderMath(<MathRenderer row={math} />);
  drag(getSvg(container), 67, 257);

  fireEvent.mouseDown(container.querySelector('button') as Element);

  expect(highlights(container)).toHaveLength(0);
});

test('selecting in one renderer clears the selection in another', () => {
  const { container } = render(
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={math} />
      <MathRenderer row={math} />
    </FontDataContext.Provider>,
  );
  const [first, second] = Array.from(container.querySelectorAll('svg'));
  drag(first, 67, 257);

  drag(second, 67, 257);

  expect(first.querySelectorAll('rect')).toHaveLength(0);
  expect(second.querySelectorAll('rect').length).toBeGreaterThan(0);
});

test('starting a selection clears the page’s text selection', () => {
  const { container } = renderMath(<MathRenderer row={math} />);
  const range = document.createRange();
  range.selectNodeContents(container.querySelector('p') as Node);
  window.getSelection()?.addRange(range);

  drag(getSvg(container), 67, 257);

  expect(window.getSelection()?.rangeCount).toBe(0);
});

test('only the left button selects', () => {
  const { container } = renderMath(<MathRenderer row={math} />);
  const svg = getSvg(container);

  fireEvent.mouseDown(svg, { clientX: 67, clientY: 30, button: 2 });
  fireEvent.mouseMove(window, { clientX: 257, clientY: 30 });
  fireEvent.mouseUp(window);

  expect(highlights(container)).toHaveLength(0);
});

test('a new row clears the selection', () => {
  const { container, rerender } = renderMath(<MathRenderer row={math} />);
  drag(getSvg(container), 67, 257);

  rerender(<MathRenderer row={row([char('1'), char('+'), char('2')])} />);

  expect(highlights(container)).toHaveLength(0);
});

test('selectable={false} turns selecting off', () => {
  const { container } = renderMath(
    <MathRenderer row={math} selectable={false} />,
  );

  drag(getSvg(container), 67, 257);

  expect(highlights(container)).toHaveLength(0);
});

test('the selection prop is drawn in place of what the user selects', () => {
  const selection: Editor.Selection = {
    anchor: { path: [], offset: 0 },
    focus: { path: [], offset: 1 },
  };
  const { container } = renderMath(
    <MathRenderer row={math} selection={selection} />,
  );

  drag(getSvg(container), 67, 257);

  expect(drawing(container)).toEqual(expectedHighlight(selection));
});

test('selecting leaves the MathML for screen readers unchanged', () => {
  const { container } = renderMath(<MathRenderer row={math} />);
  const mathml = container.querySelector('math')?.parentElement?.outerHTML;

  drag(getSvg(container), 67, 257);

  expect(highlights(container).length).toBeGreaterThan(0);
  expect(container.querySelector('math')?.parentElement?.outerHTML).toEqual(
    mathml,
  );
  expect(getSvg(container).getAttribute('aria-hidden')).toBe('true');
});

test('the ref still points at the SVG', () => {
  const ref = React.createRef<SVGSVGElement>();
  const { container } = renderMath(<MathRenderer row={math} ref={ref} />);

  expect(ref.current).toBe(getSvg(container));
});
