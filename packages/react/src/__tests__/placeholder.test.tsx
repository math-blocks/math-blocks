// Characters the font can't draw, for example because their glyph group isn't
// loaded, render as a placeholder box instead of throwing. See
// https://github.com/math-blocks/math-blocks/issues/764.
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Blob } from 'buffer';

import * as Editor from '@math-blocks/editor';
import { getFontData, loadFontSubsets, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';
import { parse as parseTex } from '@math-blocks/tex';
import * as Typesetter from '@math-blocks/typesetter';

import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';

const ASSETS = path.join(__dirname, '../../../../assets');

const readFile = async (
  ...segments: readonly string[]
): Promise<ArrayBuffer> => {
  const file = fs.readFileSync(path.join(ASSETS, ...segments));
  const buffer = new ArrayBuffer(file.byteLength);
  new Uint8Array(buffer).set(file);
  return buffer;
};

type Missing = readonly [string, string | undefined];

const renderSvg = (
  row: Editor.types.CharRow,
  fontData: FontData,
  mathStyle = Typesetter.MathStyle.Display,
): { readonly svg: string; readonly missing: readonly Missing[] } => {
  const missing: Missing[] = [];
  return {
    // Rendered first, so `missing` is filled in by the time it's read.
    svg: ReactDOMServer.renderToStaticMarkup(
      <FontDataContext.Provider value={fontData}>
        <MathRenderer
          row={row}
          mathStyle={mathStyle}
          onMissingGlyph={(char, group) => missing.push([char, group])}
        />
      </FontDataContext.Provider>,
    ),
    missing,
  };
};

const countPlaceholders = (svg: string): number =>
  (svg.match(/<rect[^>]* rx="/g) ?? []).length;

describe('placeholders', () => {
  let baseOnly: FontData;
  let full: FontData;

  beforeAll(async () => {
    const font = await loadFontSubsets([], (group) =>
      readFile('subsets', 'mathblocks-math-a', `${group}.otf`),
    );
    baseOnly = getFontData(font, 'STIX2');
    full = getFontData(
      await parse(
        new Blob([fs.readFileSync(path.join(ASSETS, 'STIX2Math.otf'))]),
      ),
      'STIX2',
    );
  });

  test('draw a character whose group is not loaded as a placeholder', () => {
    const { svg, missing } = renderSvg(parseTex('θ+1'), baseOnly);
    expect(countPlaceholders(svg)).toEqual(1);
    expect(missing).toContainEqual(['θ', 'trig-geometry']);
  });

  test('characters in loaded groups render as usual', () => {
    const row = parseTex('x^2+1');
    const { svg, missing } = renderSvg(row, baseOnly);
    expect(countPlaceholders(svg)).toEqual(0);
    expect(missing).toEqual([]);
    expect(svg).toEqual(renderSvg(row, full).svg);
  });

  test.each([Typesetter.MathStyle.Display, Typesetter.MathStyle.Text])(
    'draw integrals with limits as placeholders (%s style)',
    (mathStyle) => {
      const { svg, missing } = renderSvg(
        parseTex('∫_0^1x'),
        baseOnly,
        mathStyle,
      );
      expect(countPlaceholders(svg)).toEqual(1);
      expect(missing).toContainEqual(['∫', 'calculus']);
    },
  );

  test('draw big operators with limits as placeholders', () => {
    const { svg, missing } = renderSvg(parseTex('∑_{i=0}^{n}i'), baseOnly);
    expect(countPlaceholders(svg)).toEqual(1);
    expect(missing).toContainEqual(['∑', 'calculus']);
  });

  test("draw delimiters that can't be drawn as placeholders that don't stretch", () => {
    const { svg, missing } = renderSvg(
      parseTex('\\left⟨\\frac{a}{b}\\right⟩'),
      baseOnly,
    );
    expect(countPlaceholders(svg)).toEqual(2);
    expect(missing).toContainEqual(['⟨', 'linear-algebra']);
    expect(missing).toContainEqual(['⟩', 'linear-algebra']);
  });

  test('draw characters the font lacks as placeholders, with no group', async () => {
    const lm = getFontData(
      await parse(
        new Blob([fs.readFileSync(path.join(ASSETS, 'latinmodern-math.otf'))]),
      ),
      'LM',
    );
    const { svg, missing } = renderSvg(parseTex('x²'), lm);
    expect(countPlaceholders(svg)).toEqual(1);
    expect(missing).toContainEqual(['²', undefined]);
  });

  test('a placeholder has a hitbox, so the editor can place the cursor on either side', () => {
    const theta = Editor.builders.char('θ');
    const row = Editor.builders.row([
      Editor.builders.char('a'),
      theta,
      Editor.builders.char('b'),
    ]);
    const scene = Typesetter.typeset(row, {
      fontData: baseOnly,
      baseFontSize: 64,
      mathStyle: Typesetter.MathStyle.Display,
      cramped: false,
      renderMode: Typesetter.RenderMode.Static,
      operators: [],
    });

    // Find the placeholder's hitbox and click on its left and right halves.
    const findRect = (
      group: Typesetter.SceneGraph.Group,
      x: number,
      y: number,
    ): { x: number; y: number; width: number; height: number } | null => {
      for (const child of group.children) {
        if (child.type === 'rect' && child.id === theta.id) {
          return {
            x: x + child.x,
            y: y + child.y,
            width: child.width,
            height: child.height,
          };
        }
        if (child.type === 'group') {
          const found = findRect(child, x + child.x, y + child.y);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };
    const rect = findRect(scene.hitboxes, scene.hitboxes.x, scene.hitboxes.y);
    if (!rect) {
      throw new Error('no hitbox for the placeholder');
    }
    expect(rect.width).toBeGreaterThan(0);

    const midY = rect.y + rect.height / 2;
    const left = Typesetter.SceneGraph.findIntersections(
      { x: rect.x + rect.width * 0.25, y: midY },
      scene.hitboxes,
    );
    const right = Typesetter.SceneGraph.findIntersections(
      { x: rect.x + rect.width * 0.75, y: midY },
      scene.hitboxes,
    );
    expect(left).toContainEqual({
      type: 'content',
      id: theta.id,
      side: 'left',
    });
    expect(right).toContainEqual({
      type: 'content',
      id: theta.id,
      side: 'right',
    });
  });
});

// Loading exactly the groups glyphGroupsForRow asks for must be enough to
// render an expression with no placeholders, so the typesetter never draws a
// character that glyphGroupsForRow doesn't know about.
describe('glyphGroupsForRow', () => {
  test.each([
    'θ+\\sqrt{x^2+1}',
    '\\hat{x}+\\vec{v}+\\bar{y}+\\tilde{n}+\\dot{a}+\\ddot{b}',
    '∑_{i=0}^{n}i+∫_0^1x',
    '\\lim_{x→0}f',
    '\\left⟨u,v\\right⟩+\\left‖v\\right‖',
    '\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}',
    'x∈ℝ⇒x^2≥0',
  ])('lists every group needed to render %s', async (tex) => {
    const row = parseTex(tex);
    const groups = Typesetter.glyphGroupsForRow(row);
    const font = await loadFontSubsets(groups, (group) =>
      readFile('subsets', 'mathblocks-math-a', `${group}.otf`),
    );
    for (const mathStyle of [
      Typesetter.MathStyle.Display,
      Typesetter.MathStyle.Text,
    ]) {
      const { missing } = renderSvg(row, getFontData(font, 'STIX2'), mathStyle);
      expect(missing).toEqual([]);
    }
  });
});

describe('useFontData', () => {
  test('explains that a font is needed when there is no provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      ReactDOMServer.renderToStaticMarkup(<MathRenderer row={parseTex('x')} />),
    ).toThrow(
      'MathRenderer needs a font: render it inside a FontDataContext.Provider',
    );
  });
});
