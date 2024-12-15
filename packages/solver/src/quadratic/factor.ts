import { types, builders, util } from '@math-blocks/semantic';

import type { Step } from '../types';
import Fraction from 'fraction.js';
import { print } from '@math-blocks/testing';

function getBaseAndExp(node: types.Node): [types.Node, types.Node] {
  if (node.type === 'Power') {
    return [node.base, node.exp];
  }

  return [node, builders.number('1')];
}

function getCoeff(node: types.Node): number {
  const factors = util.getFactors(node);
  const constFactors = factors.filter((factor) => util.isNumber(factor));
  builders.mul(constFactors, true);
  const frac = util.evalNode(builders.mul(constFactors, true));
  return frac.n * frac.s;
}

function isSquareOf(node: types.Node, other: types.Node): boolean {
  const square = builders.mul(
    util.getFactors(other).map((factor) => {
      const [base, exp] = getBaseAndExp(factor);
      const newExp = util.evalNode(builders.mul([exp, builders.number('2')]));
      const evalExp =
        newExp.d !== 1
          ? builders.div(
              builders.number(newExp.n.toString()),
              builders.number(newExp.d.toString()),
            )
          : builders.number(newExp.n.toString());
      return builders.pow(base, evalExp);
    }),
    true,
  );

  return util.normalize(node) === util.normalize(square);
}

function findNumbers(b: number, c: number): [number, number] | null {
  // Calculate the discriminant
  const discriminant = b * b - 4 * c;

  // If discriminant is negative, no real solution exists
  if (discriminant < 0) {
    return null; // No real roots
  }

  // Calculate the two roots using the quadratic formula
  const sqrtDiscriminant = Math.sqrt(discriminant);
  const x = (b + sqrtDiscriminant) / 2;
  const y = (b - sqrtDiscriminant) / 2;

  // Return the two numbers (x, y) or (y, x)
  return [x, y];
}

function add(nodes: readonly types.Node[]): types.Node {
  return builders.add(
    nodes.map((node) => {
      if (node.type === 'Neg') {
        return builders.neg(node.arg, true);
      } else {
        return node;
      }
    }),
  );
}

function mul(nodes: readonly types.Node[]): types.Node {
  let negative = false;
  const factors = nodes.map((node) => {
    if (node.type === 'Neg') {
      negative = !negative;
      return node.arg;
    } else {
      return node;
    }
  });
  return negative
    ? builders.neg(builders.mul(factors, true), true)
    : builders.mul(factors, true);
}

export function factor(node: types.Add): Step | void {
  if (node.args.length !== 3) {
    return;
  }

  const constTerms = node.args.filter((arg) => util.isNumber(arg));

  if (constTerms.length !== 1) {
    return;
  }

  const constTerm = constTerms[0];

  // TODO: simplify all terms before proceeding

  const varTerms = node.args.filter((arg) => !util.isNumber(arg));

  const varTermsWithoutCoeff = varTerms.map((term) => {
    const factors = util.getFactors(term);
    const varFactors = factors.filter((factor) => !util.isNumber(factor));
    return builders.mul(varFactors, true);
  });

  // TODO: check that all exponents are numbers

  let quadraticTerm: types.Node;
  let linearTerm: types.Node;
  if (isSquareOf(varTermsWithoutCoeff[0], varTermsWithoutCoeff[1])) {
    quadraticTerm = varTerms[0];
    linearTerm = varTerms[1];
  } else if (isSquareOf(varTermsWithoutCoeff[1], varTermsWithoutCoeff[0])) {
    quadraticTerm = varTerms[1];
    linearTerm = varTerms[0];
  } else {
    return;
  }

  const [a, b, c] = [
    getCoeff(quadraticTerm),
    getCoeff(linearTerm),
    getCoeff(constTerm),
  ];

  const variable = builders.mul(
    util.getFactors(linearTerm).filter((factor) => !util.isNumber(factor)),
  );

  const numbers = findNumbers(b, a * c);
  if (!numbers) {
    return;
  }
  let [b0, b1] = numbers;

  // Check if a/b0 = b1/c, if not swap b0 and b1
  const frac1 = new Fraction(a, b0);
  const frac2 = new Fraction(b1, c);
  if (!frac1.equals(frac2)) {
    [b0, b1] = [b1, b0];
  }

  const substeps: Step[] = [];

  // TODO: handle b0 and b1 being negative
  const step1 = add([
    quadraticTerm,
    mul([builders.number(b0.toString()), variable]),
    mul([builders.number(b1.toString()), variable]),
    builders.number(c.toString()),
  ]);
  substeps.push({
    message: 'split linear term',
    before: node,
    after: step1,
    substeps: [],
  });
  print(step1);

  // TODO: handle cases like 3x^2 + 11x - 4
  const step2 = add([
    mul([
      variable,
      add([variable, builders.number(new Fraction(c, b1).toString())]),
    ]),
    mul([builders.number(b1.toString()), variable]),
    builders.number(c.toString()),
  ]);
  substeps.push({
    message: 'factor', // x out of x^2 + 2x
    before: step1,
    after: step2,
    substeps: [],
  });

  const step3 = add([
    mul([
      variable,
      add([variable, builders.number(new Fraction(c, b1).toString())]),
    ]),
    mul([
      builders.number(b1.toString()),
      add([variable, builders.number(new Fraction(c, b1).toString())]),
    ]),
  ]);
  substeps.push({
    message: 'factor', // 3 out of 3x + 6
    before: step2,
    after: step3,
    substeps: [],
  });

  const step4 = mul([
    add([variable, builders.number(b1.toString())]),
    add([variable, builders.number(new Fraction(c, b1).toString())]),
  ]);
  substeps.push({
    message: 'factor', // (x + 3) out of x(x + 2) + 3(x + 2)
    before: step3,
    after: step4,
    substeps: [],
  });

  return {
    message: 'factor quadratic', // TODO: include variable in message
    before: node,
    after: step4,
    substeps,
  };
}
