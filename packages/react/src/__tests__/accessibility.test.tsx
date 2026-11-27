/**
 * @vitest-environment jsdom
 */
// MathRenderer renders Presentation MathML for screen readers next to its SVG,
// visually hidden, and hides the SVG from them so the math is read once. See
// https://github.com/math-blocks/math-blocks/issues/86.
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { render } from '@testing-library/react';
// In the jsdom environment, Vitest resolves 'buffer' to the npm polyfill, which
// has no Blob, so ask for Node's module.
import { Blob } from 'node:buffer';

import { getFontData, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';
import { parse as parseTex } from '@math-blocks/tex';
import * as Typesetter from '@math-blocks/typesetter';

import MathRenderer from '../math-renderer';
import SceneRenderer from '../scene-renderer';
import { FontDataContext } from '../font-data-context';

const ASSETS = path.join(__dirname, '../../../../assets');

let fontData: FontData;

beforeAll(async () => {
  const font = await parse(
    new Blob([fs.readFileSync(path.join(ASSETS, 'STIX2Math.otf'))]),
  );
  fontData = getFontData(font, 'STIX2');
});

// The <math> element. Testing Library's getByRole can't be used for it: jsdom
// doesn't give MathML elements the style its role lookup reads.
const getMath = (container: HTMLElement): Element => {
  const math = container.querySelector('math');
  if (!math) {
    throw new Error('No <math> element');
  }
  return math;
};

const withFont = (element: React.ReactElement): React.ReactElement => (
  <FontDataContext.Provider value={fontData}>
    {element}
  </FontDataContext.Provider>
);

// Whether the element or one of its ancestors is hidden from assistive
// technology.
const isHidden = (element: Element): boolean =>
  element.closest('[aria-hidden="true"]') !== null;

describe('MathRenderer accessibility', () => {
  test('the SVG is hidden from assistive technology', () => {
    const { container } = render(
      withFont(<MathRenderer row={parseTex('\\frac{1}{\\sqrt{2}}')} />),
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    expect(svg).not.toHaveAttribute('aria-label');
  });

  test('screen readers get MathML for the math instead', () => {
    const { container } = render(
      withFont(<MathRenderer row={parseTex('x^2+1')} />),
    );

    const math = getMath(container);
    expect(math.tagName.toLowerCase()).toBe('math');
    expect(math.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML');
    expect(isHidden(math)).toBe(false);
    expect(math.querySelector('msup')).not.toBeNull();
    expect(math.textContent).toBe('x2+1');
    // It comes right after the SVG, so a screen reader finds it where the
    // math is drawn.
    expect(container.querySelector('svg')?.nextElementSibling).toBe(
      math.parentElement,
    );
  });

  test('the MathML is hidden visually, but not with display or visibility', () => {
    const { container } = render(
      withFont(<MathRenderer row={parseTex('x')} />),
    );

    const wrapper = getMath(container).parentElement;
    expect(wrapper?.tagName).toBe('SPAN');
    expect(wrapper?.style.position).toBe('absolute');
    expect(wrapper?.style.width).toBe('1px');
    expect(wrapper?.style.height).toBe('1px');
    expect(wrapper?.style.overflow).toBe('hidden');
    expect(wrapper?.style.clipPath).toBe('inset(50%)');
    // display: none or visibility: hidden would hide it from screen readers.
    expect(wrapper?.style.display).toBe('');
    expect(wrapper?.style.visibility).toBe('');
  });

  test('display matches the math style', () => {
    const { container, rerender } = render(
      withFont(<MathRenderer row={parseTex('x')} />),
    );
    expect(getMath(container).getAttribute('display')).toBe('block');

    rerender(
      withFont(
        <MathRenderer
          row={parseTex('x')}
          mathStyle={Typesetter.MathStyle.Text}
        />,
      ),
    );
    expect(getMath(container).getAttribute('display')).toBe('inline');
  });

  test('aria-hidden leaves out the MathML', () => {
    const { container } = render(
      withFont(<MathRenderer row={parseTex('x^2')} aria-hidden={true} />),
    );

    expect(container.querySelector('math')).toBeNull();
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  test('the MathML updates when the math changes', () => {
    const { container, rerender } = render(
      withFont(<MathRenderer row={parseTex('x')} />),
    );
    expect(getMath(container).textContent).toBe('x');

    rerender(withFont(<MathRenderer row={parseTex('y')} />));
    expect(getMath(container).textContent).toBe('y');
  });

  test('the MathML is in server-rendered markup', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      withFont(<MathRenderer row={parseTex('x^2')} />),
    );

    expect(markup).toMatch(/^<svg [^>]*aria-hidden="true"/);
    expect(markup).toContain(
      '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">' +
        '<msup><mi>x</mi><mn>2</mn></msup></math>',
    );
  });

  test('renders without React warnings', () => {
    // A fraction of two single elements once gave both parts the same key.
    const error = vi.spyOn(console, 'error');
    render(withFont(<MathRenderer row={parseTex('\\frac{1}{2}+x_1^2')} />));
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  test('a forwarded ref still points at the SVG', () => {
    const ref = React.createRef<SVGSVGElement>();
    const { container } = render(
      withFont(<MathRenderer ref={ref} row={parseTex('x')} />),
    );

    expect(ref.current).toBe(container.querySelector('svg'));
  });
});

describe('SceneRenderer', () => {
  test("doesn't hide its SVG unless asked, as MathEditor relies on", () => {
    const scene = Typesetter.typeset(parseTex('x'), {
      fontData,
      baseFontSize: 64,
      mathStyle: Typesetter.MathStyle.Display,
      renderMode: Typesetter.RenderMode.Static,
      cramped: false,
      operators: [],
    });
    const { container } = render(<SceneRenderer scene={scene} />);

    expect(container.querySelector('svg')).not.toHaveAttribute('aria-hidden');
  });
});
