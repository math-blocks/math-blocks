// @flow
import {type EditorCursor} from "./editor";
import {type Node as EditorNode} from "./editor-ast";
import {type LayoutNode, hpackNat, makeGlyph, makeKern, makeFract, makeSubSup, makeBox} from "./layout";
import {type FontMetrics} from "./metrics";
import {UnreachableCaseError} from './util';

export type LayoutCursor = {
  path: EditorNode[],
  // these are node ids instead of indices
  prev: number | null,
  next: number | null,
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
  const jmetrics = fontMetrics.glyphMetrics["j".charCodeAt(0)];
  const Emetrics = fontMetrics.glyphMetrics["E".charCodeAt(0)];

  switch (node.type) {
    case "row": {
      const row = hpackNat(node.children.map(_typeset));
      row.id = node.id;
      return row;
    }
    case "subsup": {
      const newMultiplier = multiplier === 1.0 ? 0.7 : 0.5;
      const _typeset = typeset(fontMetrics)(baseFontSize)(newMultiplier);
      let subBox;
      if (node.sub) {
        const {sub} = node;
        subBox = hpackNat(sub.children.map(_typeset));
        subBox.id = sub.id;
        // TODO: try to reuse getCharDepth
        if (jmetrics) {
          const jDepth = baseFontSize * newMultiplier * (jmetrics.height - jmetrics.bearingY) / fontMetrics.unitsPerEm;
          subBox.depth = Math.max(subBox.depth, jDepth);
        }

        // TODO: grab the max bearingY of all of [0-9a-zA-Z]
        if (Emetrics) {
          const EHeight = baseFontSize * newMultiplier * Emetrics.bearingY / fontMetrics.unitsPerEm;
          subBox.height = Math.max(subBox.height, EHeight);
        }
      } 
      let supBox;
      if (node.sup) {
        const {sup} = node;
        supBox = hpackNat(sup.children.map(_typeset));
        supBox.id = sup.id;
        // TODO: try to reuse getCharDepth
        if (jmetrics) {
          const jDepth = baseFontSize * newMultiplier * (jmetrics.height - jmetrics.bearingY) / fontMetrics.unitsPerEm;
          supBox.depth = Math.max(supBox.depth, jDepth);
        }

        // TODO: grab the max bearingY of all of [0-9a-zA-Z]
        if (Emetrics) {
          const EHeight = baseFontSize * newMultiplier * Emetrics.bearingY / fontMetrics.unitsPerEm;
          supBox.height = Math.max(supBox.height, EHeight);
        }
      }
      const parentBox = makeSubSup(multiplier, subBox, supBox);
      parentBox.id = node.id;
      return parentBox;
    }
    case "frac": {
      const numerator = hpackNat(node.numerator.children.map(_typeset));
      const denominator = hpackNat(node.denominator.children.map(_typeset));

      // TODO: try to reuse getCharDepth
      if (jmetrics) {
        const jDepth = baseFontSize * multiplier * (jmetrics.height - jmetrics.bearingY) / fontMetrics.unitsPerEm;
        numerator.depth = Math.max(numerator.depth, jDepth);
        denominator.depth = Math.max(denominator.depth, jDepth);
      }

      // TODO: grab the max bearingY of all of [0-9a-zA-Z]
      if (Emetrics) {
        const EHeight = baseFontSize * multiplier * Emetrics.bearingY / fontMetrics.unitsPerEm;
        numerator.height = Math.max(numerator.height, EHeight);
        denominator.height = Math.max(denominator.height, EHeight);
      }

      numerator.id = node.numerator.id;
      denominator.id = node.denominator.id;

      const frac = makeFract(multiplier, 5, numerator, denominator);
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
      if (/[=\+\-\u00B7\u2212]/.test(node.char)) {
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
