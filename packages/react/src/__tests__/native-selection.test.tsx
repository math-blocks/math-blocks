/**
 * @vitest-environment jsdom
 */
// The page's own text selection across text and MathRenderer's math: the
// math it covers is highlighted, and copying puts each expression's TeX in
// place of the math, in order.
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { act, render } from '@testing-library/react';
// In the jsdom environment, Vitest resolves 'buffer' to the npm polyfill, which
// has no Blob, so ask for Node's module.
import { Blob } from 'node:buffer';

import * as Editor from '@math-blocks/editor';
import { getFontData, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';
import { parse as parseTex } from '@math-blocks/tex';
import * as Typesetter from '@math-blocks/typesetter';

import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';

let fontData: FontData;

beforeAll(async () => {
  const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
  const font = await parse(new Blob([fs.readFileSync(fontPath)]));
  fontData = getFontData(font, 'STIX2');
});

afterEach(() => {
  document.getSelection()?.removeAllRanges();
});

const MATH_NS = 'xmlns="http://www.w3.org/1998/Math/MathML"';

type MathProps = Partial<React.ComponentProps<typeof MathRenderer>>;

const quadratic = parseTex('x^2+1=0');

// "Solve x^2+1=0 for x, then y-1." with text-style (inline) math.
const renderPage = (
  first: MathProps = {},
  second: MathProps = {},
): HTMLElement =>
  render(
    <FontDataContext.Provider value={fontData}>
      <p>
        Solve{' '}
        <MathRenderer
          row={quadratic}
          mathStyle={Typesetter.MathStyle.Text}
          {...first}
        />{' '}
        for x, then{' '}
        <MathRenderer
          row={parseTex('y-1')}
          mathStyle={Typesetter.MathStyle.Text}
          {...second}
        />
        .
      </p>
      <p>Not this.</p>
    </FontDataContext.Provider>,
  ).container;

/**
 * Selects from `offset` characters into the start node's text to `endOffset`
 * characters into the end node's text, and tells the page, as the browser
 * would. jsdom doesn't fire `selectionchange` itself.
 */
const select = (
  start: Node,
  offset: number,
  end: Node,
  endOffset: number,
): void => {
  act(() => {
    const range = document.createRange();
    range.setStart(start, offset);
    range.setEnd(end, endOffset);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
};

const textNodes = (container: HTMLElement): Text[] => {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }
  return nodes;
};

// The text node that starts with `text`, outside the hidden MathML.
const textNode = (container: HTMLElement, text: string): Text => {
  const node = textNodes(container).find(
    (n) => n.data.startsWith(text) && !n.parentElement?.closest('math'),
  );
  if (!node) {
    throw new Error(`no text node starts with ${text}`);
  }
  return node;
};

const copy = (): Map<string, string> | null => {
  const data = new Map<string, string>();
  const event = new Event('copy', {
    bubbles: true,
    cancelable: true,
  }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: {
      setData: (type: string, value: string) => data.set(type, value),
    },
  });
  document.body.dispatchEvent(event);
  return event.defaultPrevented ? data : null;
};

// What's drawn: the SVG's <g>, with the glyph definitions' IDs, which depend
// on React's useId(), left out.
const drawing = (svg: Element): string =>
  (svg.querySelector('svg > g')?.outerHTML ?? '').replace(
    /href="#[^"]*?-/g,
    'href="#',
  );

const highlighted = (svg: Element): boolean =>
  svg.querySelectorAll('rect').length > 0;

describe('highlighting', () => {
  test('math inside a text selection is highlighted, all of it', () => {
    const container = renderPage();
    const [first, second] = Array.from(container.querySelectorAll('svg'));

    select(textNode(container, 'Solve'), 2, textNode(container, 'for x'), 3);

    expect(highlighted(first)).toBe(true);
    expect(highlighted(second)).toBe(false);

    // The same as MathRenderer draws all of the math selected.
    const row = quadratic;
    const expected = render(
      <FontDataContext.Provider value={fontData}>
        <MathRenderer
          row={row}
          mathStyle={Typesetter.MathStyle.Text}
          selection={Editor.SelectionUtils.makeSelection2(
            [],
            0,
            [],
            row.children.length,
          )}
          selectable={false}
        />
      </FontDataContext.Provider>,
    ).container;
    expect(drawing(first)).toEqual(
      drawing(expected.querySelector('svg') as Element),
    );
  });

  test('a selection that only touches the hidden MathML highlights the math', () => {
    const container = renderPage();
    const [first] = Array.from(container.querySelectorAll('svg'));
    const mathText = textNodes(container).find((n) =>
      n.parentElement?.closest('math'),
    ) as Text;

    select(mathText, 0, textNode(container, 'for x'), 3);

    expect(highlighted(first)).toBe(true);
  });

  test('a selection of text alone highlights nothing', () => {
    const container = renderPage();

    select(textNode(container, 'Not this'), 0, textNode(container, 'Not'), 3);

    for (const svg of Array.from(container.querySelectorAll('svg'))) {
      expect(highlighted(svg)).toBe(false);
    }
  });

  test('the highlight goes when the selection does', () => {
    const container = renderPage();
    const [first] = Array.from(container.querySelectorAll('svg'));
    select(textNode(container, 'Solve'), 0, textNode(container, 'for x'), 3);

    act(() => {
      document.getSelection()?.removeAllRanges();
      document.dispatchEvent(new Event('selectionchange'));
    });

    expect(highlighted(first)).toBe(false);
  });

  test('math that is not selectable is not highlighted', () => {
    const container = renderPage({ selectable: false });
    const [first] = Array.from(container.querySelectorAll('svg'));

    select(textNode(container, 'Solve'), 0, textNode(container, 'for x'), 3);

    expect(highlighted(first)).toBe(false);
  });

  test('highlighting leaves the MathML for screen readers unchanged', () => {
    const container = renderPage();
    const before = Array.from(container.querySelectorAll('svg')).map(
      (svg) => svg.nextElementSibling?.outerHTML,
    );

    select(textNode(container, 'Solve'), 0, textNode(container, '.'), 1);

    expect(
      Array.from(container.querySelectorAll('svg')).map(
        (svg) => svg.nextElementSibling?.outerHTML,
      ),
    ).toEqual(before);
    for (const svg of Array.from(container.querySelectorAll('svg'))) {
      expect(highlighted(svg)).toBe(true);
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
  });
});

describe('copying', () => {
  test('the text and each expression’s TeX, in order', () => {
    const container = renderPage();

    select(textNode(container, 'Solve'), 0, textNode(container, '.'), 1);

    expect(copy()?.get('text/plain')).toBe(
      'Solve $x^{2}+1=0$ for x, then $y-1$.',
    );
  });

  test('part of the text around the math', () => {
    const container = renderPage();

    select(textNode(container, 'Solve'), 2, textNode(container, 'for x'), 3);

    expect(copy()?.get('text/plain')).toBe('lve $x^{2}+1=0$ for');
  });

  test('display math is set off with two dollar signs', () => {
    const container = renderPage({ mathStyle: Typesetter.MathStyle.Display });

    select(textNode(container, 'Solve'), 0, textNode(container, 'for x'), 3);

    expect(copy()?.get('text/plain')).toBe('Solve $$x^{2}+1=0$$ for');
  });

  test('MathML in place of the math in the HTML', () => {
    const container = renderPage();

    select(textNode(container, 'Solve'), 0, textNode(container, 'for x'), 3);

    expect(copy()?.get('text/html')).toBe(
      `Solve <math ${MATH_NS} display="inline"><msup><mi>x</mi><mn>2</mn></msup>` +
        '<mo>+</mo><mn>1</mn><mo>=</mo><mn>0</mn></math> for',
    );
  });

  test('a selection that ends in the hidden MathML copies the TeX once', () => {
    const container = renderPage();
    const mathText = textNodes(container).find((n) =>
      n.parentElement?.closest('math'),
    ) as Text;

    select(textNode(container, 'Solve'), 0, mathText, 1);

    expect(copy()?.get('text/plain')).toBe('Solve $x^{2}+1=0$');
  });

  test('math without hidden MathML', () => {
    const container = renderPage({ 'aria-hidden': true });

    select(textNode(container, 'Solve'), 0, textNode(container, 'for x'), 3);

    expect(copy()?.get('text/plain')).toBe('Solve $x^{2}+1=0$ for');
  });

  test('math that is not selectable is left out', () => {
    const container = renderPage({ selectable: false });

    select(textNode(container, 'Solve'), 0, textNode(container, '.'), 1);

    expect(copy()?.get('text/plain')).toBe('Solve  for x, then $y-1$.');
  });

  test('a selection of text alone is left to the browser', () => {
    const container = renderPage();

    select(textNode(container, 'Not this'), 0, textNode(container, 'Not'), 3);

    expect(copy()).toBe(null);
  });

  test('the math as it is now, after it changes', () => {
    const page = (row: Editor.types.CharRow): React.ReactElement => (
      <FontDataContext.Provider value={fontData}>
        <p>
          Solve <MathRenderer row={row} /> now.
        </p>
      </FontDataContext.Provider>
    );
    const { container, rerender } = render(page(parseTex('x')));
    rerender(page(parseTex('y')));

    select(textNode(container, 'Solve'), 0, textNode(container, ' now'), 4);

    expect(copy()?.get('text/plain')).toBe('Solve $$y$$ now');
  });

  test('nothing after the renderers unmount', () => {
    const { container, unmount } = render(
      <FontDataContext.Provider value={fontData}>
        <p>
          Solve <MathRenderer row={parseTex('x')} /> now.
        </p>
      </FontDataContext.Provider>,
    );
    const p = container.querySelector('p') as Element;
    const detached = p.cloneNode(true);
    unmount();
    document.body.appendChild(detached);

    select(detached, 0, detached, detached.childNodes.length);

    expect(copy()).toBe(null);
    detached.parentNode?.removeChild(detached);
  });

  test('the marks used while copying are gone afterwards', () => {
    const container = renderPage();
    const before = container.innerHTML;

    select(textNode(container, 'Solve'), 0, textNode(container, '.'), 1);
    copy();

    expect(container.innerHTML.replace(/<rect[^>]*><\/rect>/g, '')).toEqual(
      before,
    );
  });
});

describe('before hydration', () => {
  test('the hidden MathML can’t be selected, so it isn’t copied as text', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <FontDataContext.Provider value={fontData}>
        <MathRenderer row={parseTex('x^2')} />
      </FontDataContext.Provider>,
    );

    expect(markup).toMatch(/<span style="[^"]*user-select:none[^"]*"><math/);
    // Nothing is marked for copying until the page is hydrated, and copying.
    expect(markup).not.toContain('data-math-blocks');
  });
});
