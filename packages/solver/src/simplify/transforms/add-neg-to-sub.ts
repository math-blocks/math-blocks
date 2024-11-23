import * as Semantic from '@math-blocks/semantic';

import type { Step } from '../../types';

const { NodeType } = Semantic;

export function addNegToSub(
  node: Semantic.types.Node,
): Step<Semantic.types.Node> | void {
  const terms = Semantic.util.getTerms(node);
  let changed = false;
  const newTerms = terms.map((term, index) => {
    if (index > 0 && term.type === NodeType.Neg && !term.subtraction) {
      changed = true;
      return Semantic.builders.neg(term.arg, true);
    } else {
      return term;
    }
  });
  if (!changed) {
    return undefined;
  }
  return {
    message: 'adding the inverse is the same as subtraction',
    before: node,
    after: Semantic.builders.add(newTerms),
    substeps: [],
  };
}
