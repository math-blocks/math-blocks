import {Node as EditorNode} from "./editor-ast";
import {LayoutNode, hpackNat, makeGlyph, makeKern, makeFract} from "./layout";
import {FontMetrics} from "./metrics";
import {UnreachableCaseError} from './util';

const typeset = (fontMetrics: FontMetrics) => (fontSize: number) => (node: EditorNode): LayoutNode => {
  const _typeset = typeset(fontMetrics)(fontSize);
  const _makeGlyph = makeGlyph(fontMetrics)(fontSize);

  switch (node.type) {
    case "row": return hpackNat(node.children.map(_typeset));
    case "sup": {
      const box = hpackNat(node.children.map(_typeset));
      box.shift = -20;
      return box;
    }
    case "sub": {
      const box = hpackNat(node.children.map(_typeset));
      box.shift = 20;
      return box;
    }
    case "frac": {
      const numerator = hpackNat(node.numerator.map(_typeset));
      const denominator = hpackNat(node.denominator.map(_typeset));
      return makeFract(
        5,
        Math.max(numerator.width, denominator.width),
        numerator,
        denominator,
      );
    }
    case "parens": 
      return hpackNat([
        _makeGlyph("("),
        ...node.children.map(_typeset),
        _makeGlyph(")"),
      ]);
    case "glyph": {
      if (/[=\+\-]/.test(node.char)) {
        return hpackNat([
          makeKern(fontSize / 4),
          _makeGlyph(node.char),
          makeKern(fontSize / 4),
        ]);
      } else {
        return _makeGlyph(node.char);
      }
    }
    default: throw new UnreachableCaseError(node);
  }
};

export default typeset;
