/**
 * @vitest-environment jsdom
 */
// MathRenderer exposes its SVG to screen readers as one image whose name is a
// spoken description of the math, and hides the drawn glyphs from them. See
// https://github.com/math-blocks/math-blocks/issues/86.
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { render, screen } from '@testing-library/react';
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

const renderMath = (element: React.ReactElement): void => {
  render(
    <FontDataContext.Provider value={fontData}>
      {element}
    </FontDataContext.Provider>,
  );
};

// Whether the element or one of its ancestors is hidden from assistive
// technology.
const isHidden = (element: Element): boolean =>
  element.closest('[aria-hidden="true"]') !== null;

describe('MathRenderer accessibility', () => {
  test.each([
    ['x^2+1', 'x squared plus 1'],
    ['\\frac{x+1}{2}', 'the fraction x plus 1 over 2, end fraction'],
    ['\\sqrt{x+1}', 'the square root of x plus 1, end root'],
    ['\\left(a+b\\right)^2', 'open paren a plus b close paren squared'],
    ['\\sum_{i=1}^{n}i', 'sum from i equals 1 to n of i'],
  ])('%s is an image named "%s"', (tex, name) => {
    renderMath(<MathRenderer row={parseTex(tex)} />);

    const img = screen.getByRole('img', { name });
    expect(img.tagName).toBe('svg');
    expect(img).toHaveAttribute('aria-label', name);
  });

  test('the drawn content is hidden from assistive technology', () => {
    renderMath(<MathRenderer row={parseTex('\\frac{1}{\\sqrt{2}}')} />);

    const svg = screen.getByRole('img');
    const drawn = svg.querySelectorAll('use, path, line, rect, g');
    expect(drawn.length).toBeGreaterThan(0);
    for (const element of drawn) {
      // <defs> isn't rendered, so its paths don't need hiding.
      if (element.closest('defs')) {
        continue;
      }
      expect(isHidden(element)).toBe(true);
    }
    // The SVG itself isn't hidden: it carries the name.
    expect(isHidden(svg)).toBe(false);
  });

  test('the hitboxes are hidden too', () => {
    renderMath(<MathRenderer row={parseTex('x+1')} showHitboxes={true} />);

    const svg = screen.getByRole('img', { name: 'x plus 1' });
    const rects = svg.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(0);
    for (const rect of rects) {
      expect(isHidden(rect)).toBe(true);
    }
  });

  test('the aria-label prop overrides the generated label', () => {
    renderMath(
      <MathRenderer row={parseTex('x^2')} aria-label="x al cuadrado" />,
    );

    expect(screen.getByRole('img', { name: 'x al cuadrado' })).toBeVisible();
    expect(screen.queryByRole('img', { name: 'x squared' })).toBeNull();
  });

  test('aria-hidden hides the whole SVG', () => {
    const { container } = render(
      <FontDataContext.Provider value={fontData}>
        <MathRenderer row={parseTex('x^2')} aria-hidden={true} />
      </FontDataContext.Provider>,
    );

    expect(screen.queryByRole('img')).toBeNull();
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    expect(svg).not.toHaveAttribute('aria-label');
  });

  test('the label updates when the math changes', () => {
    const { rerender } = render(
      <FontDataContext.Provider value={fontData}>
        <MathRenderer row={parseTex('x')} />
      </FontDataContext.Provider>,
    );
    expect(screen.getByRole('img', { name: 'x' })).toBeInTheDocument();

    rerender(
      <FontDataContext.Provider value={fontData}>
        <MathRenderer row={parseTex('y')} />
      </FontDataContext.Provider>,
    );
    expect(screen.getByRole('img', { name: 'y' })).toBeInTheDocument();
  });

  test('the role and label are in server-rendered markup', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      <FontDataContext.Provider value={fontData}>
        <MathRenderer row={parseTex('x^2')} />
      </FontDataContext.Provider>,
    );

    expect(markup).toMatch(/^<svg [^>]*role="img" aria-label="x squared"/);
  });

  test('a forwarded ref points at the labelled SVG', () => {
    const ref = React.createRef<SVGSVGElement>();
    renderMath(<MathRenderer ref={ref} row={parseTex('x')} />);

    expect(ref.current).toBe(screen.getByRole('img', { name: 'x' }));
  });
});

describe('SceneRenderer without a label', () => {
  test('adds no role or hidden content, as MathEditor relies on', () => {
    const scene = Typesetter.typeset(parseTex('x'), {
      fontData,
      baseFontSize: 64,
      mathStyle: Typesetter.MathStyle.Display,
      renderMode: Typesetter.RenderMode.Static,
      cramped: false,
      operators: [],
    });
    const { container } = render(<SceneRenderer scene={scene} />);

    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('role');
    expect(svg).not.toHaveAttribute('aria-label');
    const groups = Array.from(svg?.children ?? []).filter(
      (child) => child.tagName === 'g',
    );
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group).not.toHaveAttribute('aria-hidden');
    }
  });
});
