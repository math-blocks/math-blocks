import fs from 'fs';
import path from 'path';
import { Blob } from 'buffer';

import * as Typesetter from '@math-blocks/typesetter';
import * as Editor from '@math-blocks/editor';
import * as Semantic from '@math-blocks/semantic';
import { getFontData, parse } from '@math-blocks/opentype';

import type { FontData } from '@math-blocks/opentype';

const {
  row,
  char: glyph,
  frac,
  root,
  subsup,
  delimited,
  limits,
} = Editor.builders;

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

describe('moving cursor with mouse', () => {
  describe('simple row', () => {
    let math: Editor.types.CharRow;
    let scene: Typesetter.SceneGraph.Scene;

    beforeEach(async () => {
      math = row([
        glyph('2'),
        glyph('x'),
        glyph('+'),
        glyph('5'),
        glyph('='),
        glyph('1'),
        glyph('0'),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 64;
      const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
      };
      scene = Typesetter.typeset(math, context);
    });

    test('middle of row', () => {
      const point = { x: 131, y: 22 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.row.left).toEqualEditorNodes([
        glyph('2'),
        glyph('x'),
        glyph('+'),
      ]);

      expect(zipper.row.right).toEqualEditorNodes([
        glyph('5'),
        glyph('='),
        glyph('1'),
        glyph('0'),
      ]);
    });

    test('end of row', () => {
      const point = { x: 311, y: 22 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.row.left).toEqualEditorNodes([
        glyph('2'),
        glyph('x'),
        glyph('+'),
        glyph('5'),
        glyph('='),
        glyph('1'),
        glyph('0'),
      ]);

      expect(zipper.row.right).toEqualEditorNodes([]);
    });
  });

  describe('fraction', () => {
    let math: Editor.types.CharRow;
    let scene: Typesetter.SceneGraph.Scene;

    beforeEach(async () => {
      math = row([
        frac([glyph('1'), glyph('2')], [glyph('x'), glyph('+'), glyph('y')]),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 64;
      const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
      };
      scene = Typesetter.typeset(math, context);
    });

    test('numerator left', () => {
      const point = { x: 20, y: 32 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.left).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([]);
      expect(zipper.row.right).toEqualEditorNodes([glyph('1'), glyph('2')]);
    });

    test('numerator middle', () => {
      const point = { x: 78, y: 32 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.left).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([glyph('1')]);
      expect(zipper.row.right).toEqualEditorNodes([glyph('2')]);
    });

    test('numerator right', () => {
      const point = { x: 137, y: 32 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.left).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([glyph('1'), glyph('2')]);
      expect(zipper.row.right).toEqualEditorNodes([]);
    });

    test('denominator', () => {
      const point = { x: 111, y: 121 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.right).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([glyph('x'), glyph('+')]);
      expect(zipper.row.right).toEqualEditorNodes([glyph('y')]);
    });
  });

  describe('subsup', () => {
    let math: Editor.types.CharRow;
    let scene: Typesetter.SceneGraph.Scene;

    beforeEach(async () => {
      math = row([
        frac([glyph('1')], [glyph('x')]),
        glyph('+'),
        glyph('a'),
        subsup([glyph('n')], [glyph('2')]),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 64;
      const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
      };
      scene = Typesetter.typeset(math, context);
    });

    test('superscript left', () => {
      const point = { x: 162, y: 6 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.right).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([]);
      expect(zipper.row.right).toEqualEditorNodes([glyph('2')]);
    });

    test('superscript right', () => {
      const point = { x: 178, y: 6 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.right).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([glyph('2')]);
      expect(zipper.row.right).toEqualEditorNodes([]);
    });

    test('subscript left', () => {
      const point = { x: 162, y: 143 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.left).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([]);
      expect(zipper.row.right).toEqualEditorNodes([glyph('n')]);
    });

    test('subscript right', () => {
      const point = { x: 178, y: 143 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.left).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([glyph('n')]);
      expect(zipper.row.right).toEqualEditorNodes([]);
    });
  });

  describe('root', () => {
    let math: Editor.types.CharRow;
    let scene: Typesetter.SceneGraph.Scene;

    beforeEach(async () => {
      math = row([root([glyph('3')], [glyph('x'), glyph('+'), glyph('1')])]);

      const fontData = await stixFontLoader();
      const fontSize = 64;
      const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
      };
      scene = Typesetter.typeset(math, context);
    });

    test('index', () => {
      const point = { x: 10, y: 19 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.left).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([]);
      expect(zipper.row.right).toEqualEditorNodes([glyph('3')]);
    });

    test('radicand', () => {
      const point = { x: 147, y: 45 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.right).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([glyph('x'), glyph('+')]);
      expect(zipper.row.right).toEqualEditorNodes([glyph('1')]);
    });
  });

  describe('delimited', () => {
    let math: Editor.types.CharRow;
    let scene: Typesetter.SceneGraph.Scene;

    beforeEach(async () => {
      math = row([
        delimited([glyph('x'), glyph('+'), glyph('1')], glyph('('), glyph(')')),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 64;
      const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
      };
      scene = Typesetter.typeset(math, context);
    });

    test('simple', () => {
      const point = { x: 129, y: 32 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.left).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([glyph('x'), glyph('+')]);
      expect(zipper.row.right).toEqualEditorNodes([glyph('1')]);
    });
  });

  describe('limits', () => {
    let math: Editor.types.CharRow;
    let scene: Typesetter.SceneGraph.Scene;

    beforeEach(async () => {
      math = row([
        limits(
          glyph('\u2211'), // \sum
          [glyph('i'), glyph('='), glyph('0')],
          [glyph('\u221e')], // infinity
        ),
        glyph('i'),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 64;
      const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
      };
      scene = Typesetter.typeset(math, context);
    });

    test('above', () => {
      const point = { x: 44, y: 21 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.right).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([glyph('\u221e')]);
      expect(zipper.row.right).toEqualEditorNodes([]);
    });

    test('below', () => {
      const point = { x: 44, y: 143 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      if (!zipper) {
        throw new Error('zipper is undefined');
      }

      expect(zipper.breadcrumbs).toHaveLength(1);
      expect(zipper.breadcrumbs[0].focus.left).toEqual([]);
      expect(zipper.row.left).toEqualEditorNodes([glyph('i'), glyph('=')]);
      expect(zipper.row.right).toEqualEditorNodes([glyph('0')]);
    });

    test('inner', () => {
      const point = { x: 44, y: 82 };
      const intersections = Typesetter.SceneGraph.findIntersections(
        point,
        scene.hitboxes,
      );

      const zipper = Editor.rowToZipper(math, intersections);

      // We don't handle this case yet
      expect(zipper).toBeUndefined();
    });
  });
});
