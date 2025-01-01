import { builders, types, util } from '@math-blocks/semantic';

import type { Step } from '../types';

import { powerRule } from './transforms/power';
import { productRule } from './transforms/product';
import { quotientRule } from './transforms/quotient';
import { simplify } from '../simplify/simplify';

// TODO: provide a way to specify which variable we're differentiating with respect to
export function differentiate(node: types.Node): Step | void {
  const substeps: Step[] = [];

  switch (node.type) {
    case 'Add': {
      const termSteps = node.args
        .map(differentiate)
        .filter((step) => step !== undefined);
      const after = builders.add(
        termSteps
          .map((step) => step.after)
          .filter((node) => !util.deepEquals(node, builders.number('0'))),
      );

      substeps.push({
        message: 'differentiate',
        before: node,
        after,
        substeps: termSteps,
      });
      break;
    }
    case 'Power': {
      const step = powerRule(differentiate, node);
      if (step) {
        substeps.push(step);
      }
      break;
    }
    case 'Mul': {
      const step = productRule(differentiate, node);
      if (step) {
        substeps.push(step);
      }
      break;
    }
    case 'Div': {
      const step = quotientRule(differentiate, node);
      if (step) {
        substeps.push(step);
      }
      break;
    }
    case 'Identifier': {
      if (node.name === 'x') {
        return {
          message: 'differentiate',
          before: node,
          after: builders.number('1'),
          substeps: [],
        };
      }
      break;
    }
    case 'Neg': {
      const argStep = differentiate(node.arg);
      if (!argStep) {
        return;
      }
      substeps.push({
        message: 'differentiate',
        before: node,
        after: builders.neg(argStep.after),
        substeps: [argStep],
      });
      break;
    }
    default: {
      if (util.isNumber(node)) {
        return {
          message: 'differentiate',
          before: node,
          after: builders.number('0'),
          substeps: [],
        };
      }
    }
  }

  // TODO: simplify
  let sol = substeps[substeps.length - 1].after;
  const step = simplify(sol);
  if (step) {
    substeps.push(step);
    sol = step.after;
  }

  if (substeps.length > 0) {
    return {
      message: 'differentiate',
      before: node,
      after: sol,
      substeps,
    };
  }
}
