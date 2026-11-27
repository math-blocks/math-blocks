/**
 * @vitest-environment jsdom
 */
// Characters the font can't draw, for example because their glyph group isn't
// loaded, render as a placeholder box instead of throwing. See
// https://github.com/math-blocks/math-blocks/issues/764.
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react';
// In the jsdom environment, Vitest resolves 'buffer' to the npm polyfill, which
// has no Blob, so ask for Node's module.
import { Blob } from 'node:buffer';

import * as Editor from '@math-blocks/editor';
import {
  GlyphNotFoundError,
  combineFonts,
  getFontData,
  parse,
} from '@math-blocks/opentype';
import type { Font, FontData } from '@math-blocks/opentype';
import { parse as parseTex } from '@math-blocks/tex';
import * as Typesetter from '@math-blocks/typesetter';

import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';
import { expandGlyphUses } from '../test-util';

const ASSETS = path.join(__dirname, '../../../../assets');
const SUBSETS = path.join(__dirname, '../../../fonts/subsets');

const loadFont = (...segments: readonly string[]): Promise<Font> =>
  parse(new Blob([fs.readFileSync(path.resolve(ASSETS, ...segments))]));

type Missing = readonly [string, string | undefined];

// Some tests silence console.error; don't let that leak into other tests.
afterEach(() => {
  vi.restoreAllMocks();
});

// Renders in a DOM, so effects run and onMissingGlyph is called.
const renderSvg = (
  row: Editor.types.CharRow,
  fontData: FontData,
  mathStyle = Typesetter.MathStyle.Display,
): { readonly svg: string; readonly missing: readonly Missing[] } => {
  const missing: Missing[] = [];
  const { container, unmount } = render(
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={row}
        mathStyle={mathStyle}
        onMissingGlyph={(char, group) => missing.push([char, group])}
      />
    </FontDataContext.Provider>,
  );
  const svg = container.innerHTML;
  unmount();
  return { svg, missing };
};

const countPlaceholders = (svg: string): number =>
  (svg.match(/<rect[^>]* rx="/g) ?? []).length;

describe('placeholders', () => {
  let baseOnly: FontData;
  let full: FontData;

  beforeAll(async () => {
    // Only the base subset, so characters in other groups can't be drawn.
    const base = await loadFont(SUBSETS, 'stix-two-math', 'base.woff');
    baseOnly = getFontData(combineFonts({ base }), 'STIX2');
    full = getFontData(await loadFont('STIX2Math.otf'), 'STIX2');
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
    // The two fonts give glyphs different IDs, and glyph definitions are
    // keyed by glyph ID, so compare the outlines each <use> draws.
    expect(expandGlyphUses(svg)).toEqual(
      expandGlyphUses(renderSvg(row, full).svg),
    );
  });

  test.each([Typesetter.MathStyle.Display, Typesetter.MathStyle.Text])(
    'draw integrals with scripts as placeholders (%s style)',
    (mathStyle) => {
      // The TeX parser turns ∫_0^1 into a ∫ followed by sub/superscripts.
      const { svg, missing } = renderSvg(
        parseTex('∫_0^1x'),
        baseOnly,
        mathStyle,
      );
      expect(countPlaceholders(svg)).toEqual(1);
      expect(missing).toContainEqual(['∫', 'calculus']);
    },
  );

  test.each([Typesetter.MathStyle.Display, Typesetter.MathStyle.Text])(
    'draw integrals in a limits node as placeholders (%s style)',
    (mathStyle) => {
      // The editor can also build a limits node around ∫, which the
      // typesetter handles separately.
      const row = Editor.builders.row([
        Editor.builders.limits(
          Editor.builders.char('∫'),
          [Editor.builders.char('0')],
          [Editor.builders.char('1')],
        ),
        Editor.builders.char('x'),
      ]);
      const { svg, missing } = renderSvg(row, baseOnly, mathStyle);
      expect(countPlaceholders(svg)).toEqual(1);
      expect(missing).toContainEqual(['∫', 'calculus']);
      expect(countPlaceholders(renderSvg(row, full, mathStyle).svg)).toEqual(0);
    },
  );

  // Wraps a font so that getGlyphID throws the given error for one character.
  const failFor = (
    fontData: FontData,
    failing: string,
    error: Error,
  ): FontData => ({
    ...fontData,
    font: {
      ...fontData.font,
      getGlyphID: (char: string): number => {
        if (char === failing) {
          throw error;
        }
        return fontData.font.getGlyphID(char);
      },
    },
  });

  test("draw an accent the font can't draw as a placeholder", () => {
    const hat = '̂';
    const fontData = failFor(
      full,
      hat,
      new GlyphNotFoundError(hat.codePointAt(0)),
    );
    const { svg, missing } = renderSvg(parseTex('\\hat{x}'), fontData);
    expect(countPlaceholders(svg)).toEqual(1);
    expect(missing).toEqual([[hat, undefined]]);
  });

  test('other errors from getGlyphID are not turned into placeholders', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fontData = failFor(full, '+', new Error('font is broken'));
    expect(() => renderSvg(parseTex('1+2'), fontData)).toThrow(
      'font is broken',
    );
  });

  test('a delimiter whose construction has no size variants is not a placeholder', () => {
    // OpenType allows a glyph construction with an assembly and no size
    // variants. The delimiter should then be drawn with its base glyph.
    const { font } = full;
    const parenIDs = new Set([font.getGlyphID('('), font.getGlyphID(')')]);
    const fontData: FontData = {
      ...full,
      font: {
        ...font,
        math: {
          ...font.math,
          variants: {
            ...font.math.variants,
            getVertGlyphConstruction: (glyphID: number) => {
              const construction =
                font.math.variants.getVertGlyphConstruction(glyphID);
              return construction && parenIDs.has(glyphID)
                ? { ...construction, mathGlyphVariantRecords: [] }
                : construction;
            },
          },
        },
      },
    };
    const { svg, missing } = renderSvg(
      parseTex('\\left(\\frac{a}{b}\\right)'),
      fontData,
    );
    expect(countPlaceholders(svg)).toEqual(0);
    expect(missing).toEqual([]);
  });

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
    const lm = getFontData(await loadFont('latinmodern-math.otf'), 'LM');
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
      // A scene graph group, not a DOM node.
      const { children } = group;
      for (const child of children) {
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

describe('onMissingGlyph', () => {
  let baseOnly: FontData;
  let full: FontData;

  beforeAll(async () => {
    const base = await loadFont(SUBSETS, 'stix-two-math', 'base.woff');
    baseOnly = getFontData(combineFonts({ base }), 'STIX2');
    full = getFontData(await loadFont('STIX2Math.otf'), 'STIX2');
  });

  const Renderer = ({
    tex,
    fontData,
    onMissingGlyph,
  }: {
    readonly tex: string;
    readonly fontData: FontData;
    readonly onMissingGlyph: (char: string, group: string | undefined) => void;
  }): React.ReactElement => (
    <FontDataContext.Provider value={fontData}>
      <MathRenderer row={parseTex(tex)} onMissingGlyph={onMissingGlyph} />
    </FontDataContext.Provider>
  );

  test('reports each missing character once, after rendering', () => {
    const onMissingGlyph = vi.fn();
    render(
      <Renderer
        tex="θ+θ+∫"
        fontData={baseOnly}
        onMissingGlyph={onMissingGlyph}
      />,
    );
    expect(onMissingGlyph.mock.calls).toEqual([
      ['θ', 'trig-geometry'],
      ['∫', 'calculus'],
    ]);
  });

  test('reports again only when the missing characters change', () => {
    const onMissingGlyph = vi.fn();
    const { rerender } = render(
      <Renderer
        tex="θ+1"
        fontData={baseOnly}
        onMissingGlyph={onMissingGlyph}
      />,
    );
    rerender(
      <Renderer
        tex="θ+2"
        fontData={baseOnly}
        onMissingGlyph={onMissingGlyph}
      />,
    );
    expect(onMissingGlyph).toHaveBeenCalledTimes(1);

    rerender(
      <Renderer
        tex="θ+α"
        fontData={baseOnly}
        onMissingGlyph={onMissingGlyph}
      />,
    );
    expect(onMissingGlyph.mock.calls).toEqual([
      ['θ', 'trig-geometry'],
      ['θ', 'trig-geometry'],
      ['α', 'trig-geometry'],
    ]);
  });

  test('can set state without warnings or a render loop', () => {
    const errors = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const renders = vi.fn();
    const App = (): React.ReactElement => {
      const [missing, setMissing] = React.useState<readonly string[]>([]);
      renders();
      return (
        <>
          <Renderer
            tex="θ+∑"
            fontData={baseOnly}
            onMissingGlyph={(char) => setMissing((m) => [...m, char])}
          />
          <span>{missing.join(',')}</span>
        </>
      );
    };
    render(<App />);
    expect(screen.getByText('θ,∑')).toBeInTheDocument();
    // One render, then one more after the reports update the state.
    expect(renders).toHaveBeenCalledTimes(2);
    expect(errors).not.toHaveBeenCalled();
  });

  test('is not called when every character can be drawn', () => {
    const onMissingGlyph = vi.fn();
    render(
      <Renderer tex="θ+∫" fontData={full} onMissingGlyph={onMissingGlyph} />,
    );
    expect(onMissingGlyph).not.toHaveBeenCalled();
  });
});

test('an integral in a limits node with fewer than two size variants uses its base glyph', async () => {
  const font = await loadFont('STIX2Math.otf');
  const intID = font.getGlyphID('∫');
  const fontData: FontData = getFontData(
    {
      ...font,
      math: {
        ...font.math,
        variants: {
          ...font.math.variants,
          getVertGlyphConstruction: (glyphID: number) => {
            const construction =
              font.math.variants.getVertGlyphConstruction(glyphID);
            return construction && glyphID === intID
              ? { ...construction, mathGlyphVariantRecords: [] }
              : construction;
          },
        },
      },
    },
    'STIX2',
  );
  const row = Editor.builders.row([
    Editor.builders.limits(
      Editor.builders.char('∫'),
      [Editor.builders.char('0')],
      [Editor.builders.char('1')],
    ),
  ]);
  const { svg, missing } = renderSvg(row, fontData);
  expect(countPlaceholders(svg)).toEqual(0);
  expect(missing).toEqual([]);
});

describe('useFontData', () => {
  test('explains that a font is needed when there is no provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<MathRenderer row={parseTex('x')} />)).toThrow(
      'MathRenderer needs a font: render it inside a FontDataContext.Provider',
    );
  });
});
