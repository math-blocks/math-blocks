import {EditorCursor} from "./editor";
import {Node as EditorNode} from "./editor-ast";
import {LayoutNode, hpackNat, makeGlyph, makeKern, makeFract} from "./layout";
import {FontMetrics} from "./metrics";
import {UnreachableCaseError} from './util';

export type LayoutCursor = {
  path: EditorNode[],
  // these are node ids instead of indices
  prev: number | null,
  next: number | null,
};

export const getRenderCursor = (cursor: EditorCursor, node: EditorNode): LayoutCursor => {
  const currentNode = cursor.path[cursor.path.length - 1];
  switch (currentNode.type) {
    case "row":
    case "sup":
    case "sub":
    case "parens": {
      const result = {
        path: cursor.path,
        prev: cursor.prev != null ? cursor.prev : null,
        next: cursor.next != null ? cursor.next : null,
      };
      return result;
    }
    default: throw new Error("Can't get render cursor");
  }
};

const typeset = 
  (fontMetrics: FontMetrics) => 
  (baseFontSize: number) => 
  (multiplier: number = 1) => 
  (node: EditorNode): LayoutNode => 
{
  const _typeset = typeset(fontMetrics)(baseFontSize)(multiplier);
  const fontSize = multiplier * baseFontSize;
  const _makeGlyph = makeGlyph(fontMetrics)(fontSize);

  switch (node.type) {
    case "row": {
      const row = hpackNat(node.children.map(_typeset));
      row.id = node.id;
      return row;
    }
    case "sup": {
      const _typeset = typeset(fontMetrics)(baseFontSize)(multiplier === 1.0 ? 0.8 : 0.64);
      const box = hpackNat(node.children.map(_typeset));
      box.shift = -0.5 * fontSize;
      box.id = node.id;
      return box;
    }
    case "sub": {
      const _typeset = typeset(fontMetrics)(baseFontSize)(multiplier === 1.0 ? 0.8 : 0.64);
      const box = hpackNat(node.children.map(_typeset));
      box.shift = 0.35 * fontSize;
      box.id = node.id;
      return box;
    }
    case "frac": {
      const numerator = hpackNat(node.numerator.children.map(_typeset));
      const denominator = hpackNat(node.denominator.children.map(_typeset));

      console.log(numerator.depth);

      const jmetrics = fontMetrics.glyphMetrics["j".charCodeAt(0)];
      // TODO: try to reuse getCharDepth
      if (jmetrics) {
        const jDepth = baseFontSize * multiplier * (jmetrics.height - jmetrics.bearingY) / fontMetrics.unitsPerEm;
        numerator.depth = Math.max(numerator.depth, jDepth);
      }

      const Emetrics = fontMetrics.glyphMetrics["E".charCodeAt(0)];
      // TODO: grab the max bearingY of all of [0-9a-zA-Z]
      if (Emetrics) {
        const EHeight = baseFontSize * multiplier * Emetrics.bearingY / fontMetrics.unitsPerEm;
        denominator.height = Math.max(denominator.height, EHeight);
      }

      numerator.id = node.numerator.id;
      denominator.id = node.denominator.id;

      const frac = makeFract(5, numerator, denominator);
      frac.id = node.id;
      return frac;
    }
    case "parens": {
      const parens = hpackNat([
        _makeGlyph("("),
        ...node.children.map(_typeset),
        _makeGlyph(")"),
      ]);
      parens.id = node.id;
      return parens;
    }
    case "glyph": {
      const glyph = _makeGlyph(node.char);
      if (/[=\+\-]/.test(node.char)) {
        const box = hpackNat([
          makeKern(fontSize / 4),
          glyph,
          makeKern(fontSize / 4),
        ]);
        box.id = node.id;
        return box;
      } else {
        glyph.id = node.id;
        return glyph;
      }
    }
    default: throw new UnreachableCaseError(node);
  }
};

export default typeset;
