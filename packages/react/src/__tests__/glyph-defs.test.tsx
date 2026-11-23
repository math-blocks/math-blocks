// SceneRenderer stores each distinct glyph outline once in the SVG's <defs>
// and draws every occurrence with <use>. See
// https://github.com/math-blocks/math-blocks/issues/758.
// These tests render to markup strings, not with @testing-library/react.
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Blob } from 'buffer';

import * as Editor from '@math-blocks/editor';
import { combineFonts, getFontData, parse } from '@math-blocks/opentype';
import type { Font, FontData } from '@math-blocks/opentype';
import { parse as parseTex } from '@math-blocks/tex';
import * as Typesetter from '@math-blocks/typesetter';

import MathRenderer from '../math-renderer';
import SceneRenderer from '../scene-renderer';
import { FontDataContext } from '../font-data-context';
import { expandGlyphUses } from '../test-util';

const ASSETS = path.join(__dirname, '../../../../assets');

let fontData: FontData;
let baseOnly: FontData;
let lmFont: FontData['font'];

beforeAll(async () => {
  const load = (...segments: readonly string[]): Promise<Font> =>
    parse(new Blob([fs.readFileSync(path.join(ASSETS, ...segments))]));
  fontData = getFontData(await load('STIX2Math.otf'), 'STIX2');
  // Only the base subset, so characters in other groups are placeholders.
  const base = await load('subsets', 'stix-two-math', 'base.otf');
  baseOnly = getFontData(combineFonts({ base }), 'STIX2');
  lmFont = await load('latinmodern-math.otf');
});

const toMarkup = (element: React.ReactElement): string =>
  ReactDOMServer.renderToStaticMarkup(
    <FontDataContext.Provider value={fontData}>
      {element}
    </FontDataContext.Provider>,
  );

const getDefIds = (svg: string): readonly string[] =>
  [...svg.matchAll(/<path id="([^"]+)" d="[^"]*"><\/path>/g)].map(
    (match) => match[1],
  );

const getHrefs = (svg: string): readonly string[] =>
  [...svg.matchAll(/<use [^>]*href="#([^"]+)"/g)].map((match) => match[1]);

const countBy = (items: readonly string[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return counts;
};

describe('glyph definitions', () => {
  test('a repeated glyph gets one definition and several <use> elements', () => {
    const svg = toMarkup(<MathRenderer row={parseTex('x^2+x^2+x^2')} />);

    // 'x', '2' and '+': the superscript '2' shares one definition with
    // itself even though it's drawn three times.
    const defIds = getDefIds(svg);
    expect(defIds).toHaveLength(3);
    expect(new Set(defIds).size).toBe(3);

    const hrefs = getHrefs(svg);
    expect(hrefs).toHaveLength(8);
    expect(Object.values(countBy(hrefs)).sort()).toEqual([2, 3, 3]);
    for (const href of hrefs) {
      expect(defIds).toContain(href);
    }

    // Every glyph is drawn with <use>; the only <path>s are definitions.
    expect(svg.match(/<path /g)).toHaveLength(3);
    expect(svg.match(/<defs>/g)).toHaveLength(1);
  });

  test('the same glyph at different sizes shares a definition', () => {
    const svg = toMarkup(<MathRenderer row={parseTex('2^2')} />);

    expect(getDefIds(svg)).toHaveLength(1);
    const transforms = [...svg.matchAll(/<use [^>]*transform="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(transforms).toHaveLength(2);
    // Both scales differ, so the transform on each <use> is what sizes it.
    const scales = transforms.map((t) => t.match(/scale\(([^,]+),/)?.[1]);
    expect(new Set(scales).size).toBe(2);
  });

  test('definition IDs are separate from editor node IDs', () => {
    const svg = toMarkup(<MathRenderer row={parseTex('x+x')} />);

    for (const id of getDefIds(svg)) {
      expect(id).toMatch(/^mb[A-Za-z0-9_-]*-STIX2-\d+$/);
    }
  });

  test('two renderers on the same page use different definition IDs', () => {
    const svg = toMarkup(
      <div>
        <MathRenderer row={parseTex('x+1')} />
        <MathRenderer row={parseTex('x+1')} />
      </div>,
    );

    const defIds = getDefIds(svg);
    expect(defIds).toHaveLength(6);
    expect(new Set(defIds).size).toBe(6);

    // Each SVG only references its own definitions.
    const svgs = svg.match(/<svg.*?<\/svg>/g) ?? [];
    expect(svgs).toHaveLength(2);
    for (const single of svgs) {
      const ownDefs = getDefIds(single);
      for (const href of getHrefs(single)) {
        expect(ownDefs).toContain(href);
      }
      // Throws if a definition is missing or unused.
      expandGlyphUses(single);
    }
  });

  test('fill and opacity are set on <use>', () => {
    const row = Editor.builders.row([
      Editor.builders.char('x'),
      { ...Editor.builders.char('y'), style: { color: 'red' } },
      Editor.builders.char('z', true),
    ]);
    const svg = toMarkup(<MathRenderer row={row} />);
    const uses = svg.match(/<use [^>]*>/g) ?? [];

    expect(uses).toHaveLength(3);
    expect(uses[1]).toMatch(/^<use fill="red" /);
    // Only the pending glyph is dimmed; the others get no inline style.
    expect(uses[0]).not.toMatch(/style=/);
    expect(uses[1]).not.toMatch(/style=/);
    expect(uses[2]).toMatch(/style="opacity:0.5"/);
    // Definitions carry only an ID and the outline.
    expect(svg).not.toMatch(/<path id="[^"]+" d="[^"]*" /);
  });

  test('translations are rounded to a thousandth of a pixel', () => {
    const svg = toMarkup(<MathRenderer row={parseTex('\\frac{1}{3}+x^2')} />);
    const translations = svg.match(/translate\([^)]*\)/g) ?? [];

    expect(translations.length).toBeGreaterThan(0);
    for (const translation of translations) {
      expect(translation).toMatch(
        /^translate\(-?\d+(\.\d{1,3})?,-?\d+(\.\d{1,3})?\)$/,
      );
    }
  });

  test('placeholders draw their own "?" and get no definition', () => {
    const svg = toMarkup(
      <FontDataContext.Provider value={baseOnly}>
        <MathRenderer row={parseTex('θ+θ+1')} />
      </FontDataContext.Provider>,
    );

    // '+' and '1' are definitions; each 'θ' is a box with an inline "?".
    expect(getDefIds(svg)).toHaveLength(2);
    expect(getHrefs(svg)).toHaveLength(3);
    expect(svg.match(/<rect[^>]* rx="/g)).toHaveLength(2);
    // The two "?" marks are drawn inline.
    expect(svg.match(/<path d="/g)).toHaveLength(2);
    // Throws if a definition is unused.
    expandGlyphUses(svg);
  });

  describe('fonts that would share a name', () => {
    // Draws the glyph for 'x' in STIX once with each of the given font data,
    // all in one scene, using the same glyph ID each time.
    const renderWithFonts = (fonts: readonly FontData[]): string => {
      const context: Typesetter.Context = {
        fontData,
        baseFontSize: 64,
        mathStyle: Typesetter.MathStyle.Display,
        cramped: false,
        renderMode: Typesetter.RenderMode.Static,
        operators: [],
      };
      const scene = Typesetter.typeset(
        Editor.builders.row([Editor.builders.char('x')]),
        context,
      );
      const findChar = (
        node: Typesetter.SceneGraph.Node,
      ): Typesetter.SceneGraph.Glyph | undefined =>
        node.type === 'char'
          ? node
          : node.type === 'group'
            ? node.children.map(findChar).find(Boolean)
            : undefined;
      const char = findChar(scene.content);
      if (!char) {
        throw new Error("no glyph for 'x'");
      }
      const chars = fonts.map((data, i): Typesetter.SceneGraph.Glyph => ({
        ...char,
        x: i * 40,
        glyph: { ...char.glyph, fontData: data },
      }));
      return toMarkup(
        <SceneRenderer
          scene={{ ...scene, content: { ...scene.content, children: chars } }}
        />,
      );
    };

    const getDefs = (svg: string): readonly (readonly [string, string])[] =>
      [...svg.matchAll(/<path id="([^"]+)" d="([^"]*)"><\/path>/g)].map(
        (match) => [match[1], match[2]] as const,
      );

    test('different fonts with the same family get separate definitions', () => {
      const svg = renderWithFonts([
        fontData,
        getFontData(lmFont, fontData.fontFamily),
      ]);

      const defs = getDefs(svg);
      expect(defs).toHaveLength(2);
      expect(defs[0][0]).toMatch(/-STIX2-\d+$/);
      expect(defs[1][0]).toMatch(/-STIX2-2-\d+$/);
      // Each <use> draws its own font's outline.
      expect(defs[0][1]).not.toEqual(defs[1][1]);
      expect(getHrefs(svg)).toEqual(defs.map(([id]) => id));
    });

    test('families that sanitize to the same name get separate definitions', () => {
      const svg = renderWithFonts([
        getFontData(fontData.font, 'A B'),
        getFontData(lmFont, 'A_B'),
      ]);

      const ids = getDefs(svg).map(([id]) => id);
      expect(ids).toHaveLength(2);
      expect(ids[0]).toMatch(/-A_B-\d+$/);
      expect(ids[1]).toMatch(/-A_B-2-\d+$/);
    });

    test('a suffixed name never reuses an existing family', () => {
      // The second 'A' can't be named 'A-2', since a font already has it.
      const svg = renderWithFonts([
        getFontData(fontData.font, 'A'),
        getFontData(baseOnly.font, 'A-2'),
        getFontData(lmFont, 'A'),
      ]);

      const ids = getDefs(svg).map(([id]) => id.replace(/^mb[^-]*-/, ''));
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
      expect(ids[2]).toMatch(/^A-3-\d+$/);
    });

    test('the same font under two font data objects shares definitions', () => {
      const svg = renderWithFonts([
        fontData,
        getFontData(fontData.font, fontData.fontFamily),
      ]);

      expect(getDefs(svg)).toHaveLength(1);
      expect(getHrefs(svg)).toHaveLength(2);
    });
  });

  test('interpolated glyphs draw their own <path>', () => {
    const context: Typesetter.Context = {
      fontData,
      baseFontSize: 64,
      mathStyle: Typesetter.MathStyle.Display,
      cramped: false,
      renderMode: Typesetter.RenderMode.Static,
      operators: [],
    };
    const scene = Typesetter.typeset(
      Editor.builders.row([Editor.builders.char('x')]),
      context,
    );
    const { font } = fontData;
    const interpolated: Typesetter.SceneGraph.InterpolatedGlyph = {
      type: 'interpolated',
      x: 0,
      y: 0,
      width: 10,
      amount: 0.5,
      style: {},
      interpolatedGlyph: {
        type: 'InterpolatedGlyph',
        glyphID1: font.getGlyphID('('),
        glyphID2: font.getGlyphID('('),
        amount: 0.5,
        size: 64,
        fontData,
        isDelimiter: true,
        style: {},
      },
    };
    const svg = toMarkup(
      <SceneRenderer
        scene={{
          ...scene,
          content: {
            ...scene.content,
            children: [...scene.content.children, interpolated],
          },
        }}
      />,
    );

    // 'x' is a definition plus a <use>; '(' is drawn directly.
    expect(getDefIds(svg)).toHaveLength(1);
    expect(getHrefs(svg)).toHaveLength(1);
    expect(svg.match(/<path [^>]*aria-hidden="true" d="/g)).toHaveLength(1);
  });
});
