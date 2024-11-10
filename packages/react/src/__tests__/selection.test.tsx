import fs from 'fs';
import path from 'path';
import { Blob } from 'buffer';

import * as Typesetter from '@math-blocks/typesetter';
import * as Editor from '@math-blocks/editor';
import * as Semantic from '@math-blocks/semantic';
import { getFontData, parse } from '@math-blocks/opentype';

import type { FontData } from '@math-blocks/opentype';

const { row, char: glyph } = Editor.builders;

let stixFontData: FontData | null = null;

const toEqualEditorNodes = (
  received: readonly Editor.types.CharNode[],
  actual: readonly Editor.types.CharNode[],
): { readonly message: () => string; readonly pass: boolean } => {
  const message = "Editor nodes didn't match";
  if (Semantic.util.deepEquals(received, actual)) {
    return {
      message: () => message,
      pass: true,
    };
  }
  return {
    message: () => message,
    pass: false,
  };
};

expect.extend({ toEqualEditorNodes });

const stixFontLoader = async (): Promise<FontData> => {
  if (stixFontData) {
    return stixFontData;
  }

  const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
  const buffer = fs.readFileSync(fontPath);
  const blob = new Blob([buffer]);

  const font = await parse(blob);
  stixFontData = getFontData(font, 'STIX2');

  return stixFontData;
};

type Point = { readonly x: number; readonly y: number };

const getSelectionState = async (
  math: Editor.types.CharRow,
  p1: Point,
  p2: Point,
) => {
  const fontData = await stixFontLoader();
  const fontSize = 64;
  const context: Typesetter.Context = {
    fontData: fontData,
    baseFontSize: fontSize,
    mathStyle: Typesetter.MathStyle.Display,
    renderMode: Typesetter.RenderMode.Dynamic, // match how the editor renders
    cramped: false,
  };
  const scene = Typesetter.typeset(math, context);

  let state: Editor.SimpleState = {
    row: math,
    selecting: false,
    selection: Editor.SelectionUtils.makeSelection([], 0),
  };

  state = Editor.reducer(state, {
    type: 'UpdateSelection',
    intersections: Typesetter.SceneGraph.findIntersections(p1, scene.hitboxes),
    selecting: false,
  });

  state = Editor.reducer(state, {
    type: 'UpdateSelection',
    intersections: Typesetter.SceneGraph.findIntersections(p2, scene.hitboxes),
    selecting: true,
  });

  return state;
};

describe('moving cursor with mouse', () => {
  describe('simple row', () => {
    let math: Editor.types.CharRow;

    beforeEach(() => {
      math = row([
        glyph('2'),
        glyph('x'),
        glyph('+'),
        glyph('5'),
        glyph('='),
        glyph('1'),
        glyph('0'),
      ]);
    });

    test('from left to right', async () => {
      const state = await getSelectionState(
        math,
        { x: 67, y: 30 },
        { x: 257, y: 30 },
      );

      expect(state.selection).toEqual({
        anchor: { path: [], offset: 2 },
        focus: { path: [], offset: 5 },
      });
    });

    test('from right to left', async () => {
      const state = await getSelectionState(
        math,
        { x: 257, y: 30 },
        { x: 67, y: 30 },
      );

      expect(state.selection).toEqual({
        anchor: { path: [], offset: 5 },
        focus: { path: [], offset: 2 },
      });
    });

    test('at the same location', async () => {
      const state = await getSelectionState(
        math,
        { x: 67, y: 30 },
        { x: 67, y: 30 },
      );

      expect(state.selection).toEqual({
        anchor: { path: [], offset: 2 },
        focus: { path: [], offset: 2 },
      });
    });
  });

  describe('adding fractions', () => {
    let math: Editor.types.CharRow;

    beforeEach(async () => {
      math = Editor.builders.row([
        Editor.builders.char('2'),
        Editor.builders.char('+'),
        Editor.builders.frac(
          [
            Editor.builders.frac(
              [Editor.builders.char('a')],
              [Editor.builders.char('b')],
            ),
            Editor.builders.char('+'),
            Editor.builders.frac(
              [Editor.builders.char('c')],
              [Editor.builders.char('d')],
            ),
          ],
          [Editor.builders.char('1')],
        ),
        Editor.builders.char('+'),
        Editor.builders.frac(
          [
            Editor.builders.frac(
              [Editor.builders.char('x')],
              [Editor.builders.char('y')],
            ),
            Editor.builders.char('+'),
            Editor.builders.char('1'),
          ],
          [Editor.builders.char('1')],
        ),
        Editor.builders.char('\u2212'),
        Editor.builders.char('y'),
      ]);
    });

    test('two-levels deep, common node in root row', async () => {
      const state = await getSelectionState(
        math,
        { x: 150, y: 24 },
        { x: 380, y: 24 },
      );

      expect(state.selection).toEqual({
        anchor: { path: [2, 0, 0, 0], offset: 1 },
        focus: { path: [4, 0, 0, 0], offset: 0 },
      });
    });

    test('two-levels deep, common node in fraction numerator', async () => {
      const state = await getSelectionState(
        math,
        { x: 142, y: 24 },
        { x: 244, y: 24 },
      );

      expect(state.selection).toEqual({
        anchor: { path: [2, 0, 0, 0], offset: 1 },
        focus: { path: [2, 0, 2, 0], offset: 0 },
      });
    });

    test('two-levels deep and one-level deep in fraction numerator', async () => {
      const state = await getSelectionState(
        math,
        { x: 145, y: 24 },
        { x: 216, y: 54 },
      );

      expect(state.selection).toEqual({
        anchor: { path: [2, 0, 0, 0], offset: 1 },
        focus: { path: [2, 0], offset: 2 },
      });
    });

    test('one-level deep and two-levels deep in fraction numerator', async () => {
      const state = await getSelectionState(
        math,
        { x: 216, y: 54 },
        { x: 145, y: 24 },
      );

      expect(state.selection).toEqual({
        anchor: { path: [2, 0], offset: 2 },
        focus: { path: [2, 0, 0, 0], offset: 1 },
      });
    });

    test('two-levels deep and at the root level', async () => {
      const state = await getSelectionState(
        math,
        { x: 145, y: 24 },
        { x: 34, y: 112 },
      );

      expect(state.selection).toEqual({
        anchor: { path: [2, 0, 0, 0], offset: 1 },
        focus: { path: [], offset: 1 },
      });
    });

    test('at the root level and two-levels deep', async () => {
      const state = await getSelectionState(
        math,
        { x: 34, y: 112 },
        { x: 145, y: 24 },
      );

      expect(state.selection).toEqual({
        anchor: { path: [], offset: 1 },
        focus: { path: [2, 0, 0, 0], offset: 1 },
      });
    });
  });
});
