// @flow
import * as Editor from "./editor";
import * as Layout from "./layout";
import {type FontMetrics} from "./metrics";
import {UnreachableCaseError} from './util';

export type LayoutCursor = {
  path: Editor.Node[],
  // these are node ids instead of indices
  prev: number | null,
  next: number | null,
};

const typeset = 
  (fontMetrics: FontMetrics) => 
  (baseFontSize: number) => 
  (multiplier: number = 1) => 
  (node: Editor.Node): Layout.Node => 
{
  const _typeset = typeset(fontMetrics)(baseFontSize)(multiplier);
  const fontSize = multiplier * baseFontSize;
  const _makeGlyph = Layout.makeGlyph(fontMetrics)(fontSize);
  const jmetrics = fontMetrics.glyphMetrics["j".charCodeAt(0)];
  const Emetrics = fontMetrics.glyphMetrics["E".charCodeAt(0)];

  switch (node.type) {
    case "row": {
      const row = Layout.hpackNat(node.children.map(_typeset));
      row.id = node.id;
      return row;
    }
    case "subsup": {
      const newMultiplier = multiplier === 1.0 ? 0.7 : 0.5;
      const _typeset = typeset(fontMetrics)(baseFontSize)(newMultiplier);
      let subBox;
      if (node.sub) {
        const {sub} = node;
        subBox = Layout.hpackNat(sub.children.map(_typeset));
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
        supBox = Layout.hpackNat(sup.children.map(_typeset));
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
      const parentBox = Layout.makeSubSup(multiplier, subBox, supBox);
      parentBox.id = node.id;
      return parentBox;
    }
    case "frac": {
      const numerator = Layout.hpackNat(node.numerator.children.map(_typeset));
      const denominator = Layout.hpackNat(node.denominator.children.map(_typeset));

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

      const frac = Layout.makeFract(multiplier, 5, numerator, denominator);
      frac.id = node.id;
      return frac;
    }
    case "parens": {
      const parens = Layout.hpackNat([
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
        const box = Layout.hpackNat([
          Layout.makeKern(fontSize / 4),
          glyph,
          Layout.makeKern(fontSize / 4),
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
