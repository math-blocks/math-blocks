// SceneRenderer stores each distinct glyph outline once in the SVG's <defs>
// and draws every occurrence with <use>. See
// https://github.com/math-blocks/math-blocks/issues/758.
// These tests render to markup strings, not with @testing-library/react.
/* eslint-disable testing-library/render-result-naming-convention */
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Blob } from 'buffer';

import * as Editor from '@math-blocks/editor';
import { getFontData, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';
import { parse as parseTex } from '@math-blocks/tex';
import * as Typesetter from '@math-blocks/typesetter';

import MathRenderer from '../math-renderer';
import SceneRenderer from '../scene-renderer';
import { FontDataContext } from '../font-data-context';
import { expandGlyphUses } from '../test-util';

let fontData: FontData;

beforeAll(async () => {
  const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
  const font = await parse(new Blob([fs.readFileSync(fontPath)]));
  fontData = getFontData(font, 'STIX2');
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
    ]);
    const svg = toMarkup(<MathRenderer row={row} />);

    expect(svg).toMatch(/<use fill="red" [^>]*style="opacity:1"/);
    // Definitions carry only an ID and the outline.
    expect(svg).not.toMatch(/<path id="[^"]+" d="[^"]*" /);
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
