import { util, types, builders, NodeType } from '@math-blocks/semantic';

import type { Step } from '../../types';

const isPower = (node: types.NumericNode): node is types.Pow =>
  node.type === NodeType.Power;

const isMul = (node: types.NumericNode): node is types.Mul =>
  node.type === NodeType.Mul;

const getBase = (node: types.NumericNode): types.NumericNode => {
  return isPower(node) ? node.base : node;
};

export function multiplyPowers(
  node: types.NumericNode,
): Step<types.NumericNode> | void {
  const factors = util.getFactors(node);

  if (factors.length < 2) {
    return undefined;
  }

  // A mapping from base to array of factors with that base
  const map: Map<string, types.NumericNode[]> = new Map();

  for (const factor of factors) {
    const base = getBase(factor);
    const key = util.normalize(base);
    const arr = map.get(key) || [];
    arr.push(factor);
    map.set(key, arr);
  }

  // TODO: check if there's any entries in the map with more than one factor
  const newFactors: types.NumericNode[] = [];
  // TODO: add substeps to simplify addition of exponents
  const substeps: Step<types.NumericNode>[] = [];

  const implicit = isMul(node) ? node.implicit : false;

  let modified = false;
  for (const factors of map.values()) {
    if (factors.length === 1) {
      newFactors.push(factors[0]);
    } else {
      const base = getBase(factors[0]);
      const exps = factors.map((factor) => {
        if (isPower(factor)) {
          return factor.exp;
        }
        return builders.number('1');
      });
      newFactors.push(builders.pow(base, builders.add(exps)));
      modified = true;
    }
  }

  if (!modified) {
    return undefined;
  }

  return {
    message: 'multiply powers',
    before: node,
    after: builders.mul(newFactors, implicit),
    substeps: substeps,
  };
}
