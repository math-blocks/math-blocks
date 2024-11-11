import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from '../layout';

import type { Context, HBox, VBox } from '../types';
import { RenderMode } from '../enums';

const AccentMap: Record<Editor.AccentType, string> = {
  [Editor.AccentType.Overline]: '\u0305',
  [Editor.AccentType.Underline]: '\u0332',
  [Editor.AccentType.Hat]: '\u0302',
  [Editor.AccentType.Tilde]: '\u0303',
  [Editor.AccentType.Vector]: '\u20D7',
};

export const typesetAccent = (
  typesetChild: (index: number, context: Context) => HBox | null,
  node: Editor.types.CharAccent,
  context: Context,
): VBox => {
  const inner = typesetChild(0, { ...context, renderMode: RenderMode.Static });
  if (!inner) {
    throw new Error("Delimited's content should be defined");
  }

  if (inner.type === 'HBox') {
    console.log(inner);
  }

  const fontSize = Layout.fontSizeForContext(context);

  const char = AccentMap[node.accent];
  const { font } = context.fontData;
  let glyphID = font.getGlyphID(char);

  const construction = font.math.variants.getHorizGlyphConstruction(glyphID);

  if (node.children[0].children.length > 1 && construction) {
    for (const variant of construction.mathGlyphVariantRecords) {
      const { variantGlyph, advanceMeasurement } = variant;
      const realAdvance =
        (fontSize * advanceMeasurement) / font.head.unitsPerEm;
      if (Math.floor(realAdvance) < Math.ceil(inner.width)) {
        glyphID = variantGlyph;
      }
    }
  }

  const metrics = font.getGlyphMetrics(glyphID);
  const accent = Layout.makeGlyph(char, glyphID, context, true);
  const box = Layout.makeStaticHBox([accent], context) as Mutable<HBox>;

  // TODO: Use the MathTopAccentAttachment table to determine how much to
  // shift the accent.
  if (metrics.advance === 0) {
    box.shift = inner.width;
  } else {
    // center the accent over the inner box
    box.shift = (inner.width - Layout.getWidth(accent)) / 2;
  }

  const width = Layout.getWidth(inner);

  const AccentBaseHeight = Layout.getConstantValue(
    font.math.constants.accentBaseHeight,
    context,
  );

  const kern = Layout.makeKern(
    // bottom of the accent bounding box
    ((metrics.bearingY - metrics.height) * fontSize) / font.head.unitsPerEm -
      // minus the max height of base glyphs that don't need to adjust the accent
      AccentBaseHeight,
  );

  return Layout.makeVBox(width, inner, [kern, box], [], context);
};
