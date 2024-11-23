import { util, types, builders, NodeType } from '@math-blocks/semantic';

import type { Step } from '../../types';

const isPower = (node: types.Node): node is types.Pow =>
  node.type === NodeType.Power;

const isMul = (node: types.Node): node is types.Mul =>
  node.type === NodeType.Mul;

const isDiv = (node: types.Node): node is types.Div =>
  node.type === NodeType.Div;

const getBase = (node: types.Node): types.Node => {
  return isPower(node) ? node.base : node;
};

// TODO: combine this with multiplyPowers
// OR... we could just always run multiplePowers first when simplifying
export function dividePowers(node: types.Node): Step<types.Node> | void {
  if (!isDiv(node)) {
    return undefined;
  }

  const numFactors = util.getFactors(node.args[0]);
  const denFactors = util.getFactors(node.args[1]);

  const numMap: Map<string, types.Node[]> = new Map();
  const denMap: Map<string, types.Node[]> = new Map();

  for (const fact of numFactors) {
    const base = getBase(fact);
    const key = util.normalize(base);
    const arr = numMap.get(key) || [];
    arr.push(fact);
    numMap.set(key, arr);
  }

  for (const fact of denFactors) {
    const base = getBase(fact);
    const key = util.normalize(base);
    const arr = denMap.get(key) || [];
    arr.push(fact);
    denMap.set(key, arr);
  }

  let modified = false;
  const newFactors: types.Node[] = [];
  for (const key of numMap.keys()) {
    if (denMap.has(key)) {
      const numFactors = numMap.get(key) as types.Node[];
      const denFactors = denMap.get(key) as types.Node[];

      const numExps = numFactors.map((factor) => {
        if (isPower(factor)) {
          return factor.exp;
        }
        return builders.number('1');
      });

      const denExps = denFactors.map((factor) => {
        if (isPower(factor)) {
          return factor.exp;
        }
        return builders.number('1');
      });

      const newFactor = builders.pow(
        getBase(numFactors[0]),
        builders.add([
          ...numExps,
          ...denExps.map((exp) => builders.neg(exp, true)),
        ]),
      );
      newFactors.push(newFactor);
      modified = true;
    } else {
      const factors = numMap.get(key);
      if (factors) {
        newFactors.push(...factors);
      }
    }
  }

  // TODO: have an option to says whether we want to get rid of all
  // denominators or not
  // for (const key of denMap.keys()) {
  //   if (!numMap.has(key)) {
  //     const denFactors = denMap.get(key) as types.Node[];
  //     const denExps = denFactors.map((factor) => {
  //       if (isPower(factor)) {
  //         return factor.exp;
  //       }
  //       return builders.number('1');
  //     });

  //     const newFactor = builders.pow(
  //       getBase(denFactors[0]),
  //       builders.add([...denExps.map((exp) => builders.neg(exp, true))]),
  //     );
  //     newFactors.push(newFactor);
  //   }
  // }

  if (!modified) {
    return undefined;
  }

  const implicit = isMul(node.args[0]) ? node.args[0].implicit : true;

  return {
    message: 'divide powers',
    before: node,
    after: builders.mul(newFactors, implicit),
    substeps: [],
  };
}
