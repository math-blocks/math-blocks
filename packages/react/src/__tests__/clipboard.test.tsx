/**
 * @vitest-environment jsdom
 */
// What's put on the clipboard when selected math is copied.
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
import { parse as parseTex } from '@math-blocks/tex';
import * as Typesetter from '@math-blocks/typesetter';

import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';
import {
  getSelectedRow,
  rowToClipboard,
  selectionToClipboard,
  toMarkup,
  writeToClipboard,
} from '../clipboard';

const { makeSelection, makeSelection2 } = Editor.SelectionUtils;
const { row, char, frac } = Editor.builders;

// 2x+\frac{a+b}{c}
const math = row([
  char('2'),
  char('x'),
  char('+'),
  frac([char('a'), char('+'), char('b')], [char('c')]),
]);

const MATH_NS = 'xmlns="http://www.w3.org/1998/Math/MathML"';

describe('selectionToClipboard', () => {
  test('part of a row', () => {
    expect(
      selectionToClipboard(math, makeSelection2([], 0, [], 2), 'inline'),
    ).toEqual({
      text: '2x',
      html: `<math ${MATH_NS} display="inline"><mn>2</mn><mi>x</mi></math>`,
    });
  });

  test('backwards, from focus to anchor', () => {
    expect(
      selectionToClipboard(math, makeSelection2([], 2, [], 0), 'inline')?.text,
    ).toBe('2x');
  });

  test('a whole fraction', () => {
    expect(
      selectionToClipboard(math, makeSelection2([], 2, [], 4), 'block'),
    ).toEqual({
      text: '+\\frac{a+b}{c}',
      html:
        `<math ${MATH_NS} display="block"><mo>+</mo>` +
        '<mfrac><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mi>c</mi></mfrac>' +
        '</math>',
    });
  });

  test('from the numerator to the denominator takes the whole fraction', () => {
    expect(
      selectionToClipboard(math, makeSelection2([3, 0], 1, [3, 1], 1), 'inline')
        ?.text,
    ).toBe('\\frac{a+b}{c}');
  });

  test('from inside a fraction to outside it takes the whole fraction', () => {
    expect(
      selectionToClipboard(math, makeSelection2([], 1, [3, 0], 1), 'inline')
        ?.text,
    ).toBe('x+\\frac{a+b}{c}');
  });

  test('part of a numerator', () => {
    expect(
      selectionToClipboard(math, makeSelection2([3, 0], 1, [3, 0], 3), 'inline')
        ?.text,
    ).toBe('+b');
  });

  test('prints TeX the way @math-blocks/tex does, e.g. commands', () => {
    const trig = parseTex('\\sin\\theta\\le\\pi');
    expect(
      selectionToClipboard(
        trig,
        makeSelection2([], 0, [], trig.children.length),
        'inline',
      )?.text,
    ).toBe('\\sin\\theta\\leq\\pi');
  });

  test('nothing for a collapsed selection', () => {
    expect(selectionToClipboard(math, makeSelection([], 1), 'inline')).toBe(
      null,
    );
    expect(getSelectedRow(math, makeSelection([3, 0], 1))).toBe(null);
  });

  test('nothing for a selection that is not in the row', () => {
    expect(getSelectedRow(math, makeSelection2([9, 0], 0, [9, 0], 1))).toBe(
      null,
    );
  });
});

describe('rowToClipboard', () => {
  test('a whole row', () => {
    expect(rowToClipboard(parseTex('x^2'), 'inline')).toEqual({
      text: 'x^{2}',
      html: `<math ${MATH_NS} display="inline"><msup><mi>x</mi><mn>2</mn></msup></math>`,
    });
  });

  test('escapes markup characters', () => {
    expect(rowToClipboard(parseTex('a<b'), 'inline').html).toBe(
      `<math ${MATH_NS} display="inline"><mi>a</mi><mo>&lt;</mo><mi>b</mi></math>`,
    );
  });
});

describe('toMarkup', () => {
  test('escapes attribute values', () => {
    expect(toMarkup(<span title={'a"b&'}>x</span>)).toBe(
      '<span title="a&quot;b&amp;">x</span>',
    );
  });

  test('refuses attributes it cannot write', () => {
    expect(() => toMarkup(<span onClick={() => undefined}>x</span>)).toThrow();
  });

  test('only serializes elements and text', () => {
    const Component = (): React.ReactElement => <mi>x</mi>;
    expect(() => toMarkup(<Component />)).toThrow();
  });
});

// A `copy` event with a clipboard to write to. jsdom's events have no
// clipboardData.
const copyEvent = (): {
  event: ClipboardEvent;
  data: Map<string, string>;
} => {
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
  return { event, data };
};

describe('writeToClipboard', () => {
  test('sets TeX and MathML in place of what the browser would copy', () => {
    const { event, data } = copyEvent();
    writeToClipboard(event, { text: 'x', html: '<math></math>' });
    expect(Object.fromEntries(data)).toEqual({
      'text/plain': 'x',
      'text/html': '<math></math>',
    });
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('copying from a MathRenderer', () => {
  let fontData: FontData;

  beforeAll(async () => {
    const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
    const font = await parse(new Blob([fs.readFileSync(fontPath)]));
    fontData = getFontData(font, 'STIX2');
  });

  beforeEach(() => {
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
    window.getSelection()?.removeAllRanges();
  });

  // 2x+5=10. With a 64px font, x=67 is over the '+' and x=257 is over the '1'.
  const linear = row([
    char('2'),
    char('x'),
    char('+'),
    char('5'),
    char('='),
    char('1'),
    char('0'),
  ]);

  const renderMath = (props: {
    readonly selectable?: boolean;
    readonly mathStyle?: Typesetter.MathStyle;
  }): HTMLElement =>
    render(
      <FontDataContext.Provider value={fontData}>
        <p>
          Solve <MathRenderer row={linear} {...props} /> for x.
        </p>
      </FontDataContext.Provider>,
    ).container;

  const drag = (svg: Element, fromX: number, toX: number): void => {
    fireEvent.mouseDown(svg, { clientX: fromX, clientY: 30 });
    fireEvent.mouseMove(window, { clientX: toX, clientY: 30 });
    fireEvent.mouseUp(window);
  };

  const copy = (): { event: ClipboardEvent; data: Map<string, string> } => {
    const result = copyEvent();
    document.body.dispatchEvent(result.event);
    return result;
  };

  test('copies the selected math as TeX and MathML', () => {
    const container = renderMath({});
    drag(container.querySelector('svg') as Element, 67, 257);

    const { event, data } = copy();

    expect(event.defaultPrevented).toBe(true);
    expect(Object.fromEntries(data)).toEqual({
      'text/plain': '+5=',
      'text/html': `<math ${MATH_NS} display="block"><mo>+</mo><mn>5</mn><mo>=</mo></math>`,
    });
  });

  test('copies inline math as inline MathML', () => {
    const container = renderMath({ mathStyle: Typesetter.MathStyle.Text });
    const svg = container.querySelector('svg') as Element;
    drag(svg, 5, 5000);

    expect(copy().data.get('text/html')).toContain('display="inline"');
  });

  test('leaves copying alone when nothing is selected', () => {
    renderMath({});

    const { event, data } = copy();

    expect(event.defaultPrevented).toBe(false);
    expect(data.size).toBe(0);
  });

  test('leaves copying alone once the selection is cleared', () => {
    const container = renderMath({});
    drag(container.querySelector('svg') as Element, 67, 257);
    fireEvent.mouseDown(container.querySelector('p') as Element);

    expect(copy().event.defaultPrevented).toBe(false);
  });

  test('leaves copying a text selection made since to the browser', () => {
    const container = renderMath({});
    drag(container.querySelector('svg') as Element, 67, 257);
    // E.g. selected with the keyboard, which doesn't clear the math's
    // selection.
    const range = document.createRange();
    range.selectNodeContents(container.querySelector('p') as Node);
    window.getSelection()?.addRange(range);

    expect(copy().event.defaultPrevented).toBe(false);
  });

  test('copies nothing when the math is not selectable', () => {
    const container = renderMath({ selectable: false });
    drag(container.querySelector('svg') as Element, 67, 257);

    expect(copy().event.defaultPrevented).toBe(false);
  });
});
