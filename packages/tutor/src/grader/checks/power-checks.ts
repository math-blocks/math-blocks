import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';

import type { Check, Result } from '../types';

import { correctResult } from './util';
import { exactMatch } from './basic-checks';

const { NodeType } = Semantic;

const isPower = (node: Semantic.types.Node): node is Semantic.types.Pow => {
  return node.type === NodeType.Power;
};

// a*a*...*a -> a^n
// TODO: make check generic and then have runChecks do some preliminary checking.
export const powDef: Check = (prev, next, context): Result | undefined => {
  const { checker } = context;

  // Avoid infinite recursion
  if (prev.source === 'powDefReverse' || next.source === 'powDefReverse') {
    return;
  }

  if (!Semantic.util.isNumeric(next)) {
    return;
  }

  if (prev.type === NodeType.Mul) {
    // TODO: memoize helpers like getFactors, getTerms, difference, intersection, etc.
    const prevFactors = Semantic.util.getFactors(prev);
    const nextFactors = Semantic.util.getFactors(next);

    const commonFactors = Semantic.util.intersection(prevFactors, nextFactors);

    // TODO: also make helpers for getting unique factors/terms since we do this
    // in a number of places.
    const uniquePrevFactors = Semantic.util.difference(
      prevFactors,
      commonFactors,
    );
    const uniqueNextFactors = Semantic.util.difference(
      nextFactors,
      commonFactors,
    );

    const exps = uniqueNextFactors.filter(isPower);

    const expsWithNumberExp = exps.filter(
      (exp) => exp.exp.type === NodeType.Number,
    );

    if (expsWithNumberExp.length === 0) {
      return undefined;
    }

    const base = expsWithNumberExp[0].base;

    // This should never happen since if all the factors are the same,
    // checkArgs would've returned a successful result before we get here.
    if (uniquePrevFactors.length === 0) {
      return;
    }

    // NOTE: we use deepEquals instead of using checkStep to see if things
    // are equivalent.  We should probably do this elsewhere and rely more
    // on a fallback.  It's unlikely that a human would jump from something
    // equivalent to the 'base' to using that 'base' in a exponent node.
    const count = uniquePrevFactors.reduce(
      (count, f) => (Semantic.util.deepEquals(f, base) ? count + 1 : count),
      0,
    );

    // This can happen when there are no previous factors that equal
    // the base we're looking for
    if (count === 0) {
      return;
    }

    const nonBaseUniquePrevFactors = uniquePrevFactors.filter(
      (f) => !Semantic.util.deepEquals(f, base),
    );

    // We need to do this check since there might be multiple exponents
    // with the same base in next.
    const newPrev = Semantic.builders.mul([
      ...commonFactors,
      Semantic.builders.pow(base, Semantic.builders.number(String(count))),
      ...nonBaseUniquePrevFactors,
    ]);
    newPrev.source = 'powDef';
    const result = checker.checkStep(newPrev, next, context);

    if (result) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        [],
        result.steps,
        'multiplying a factor n-times is an exponent',
      );
    }
  }

  return undefined;
};
powDef.symmetric = true;

// a^n -> a*a*...*a
export const powDefReverse: Check = (
  prev,
  next,
  context,
): Result | undefined => {
  if (prev.type !== NodeType.Power) {
    return undefined;
  }

  // Avoid infinite recursion
  if (prev.source === 'powDef' || next.source === 'powDef') {
    return;
  }

  // Avoid recursion with self
  if (prev.source === 'powDefReverse' || next.source === 'powDefReverse') {
    return;
  }

  const { exp, base } = prev;
  const { checker } = context;

  // TODO: evaluate the exponent if necessary
  if (exp.type === NodeType.Number) {
    const factors: Semantic.types.NumericNode[] = [];
    const count = Number.parseInt(exp.value);
    if (count <= 1) {
      return undefined;
    }
    for (let i = 0; i < count; i++) {
      // TODO: clone base each time
      factors.push(base);
    }
    const newPrev = Semantic.builders.mul(factors);
    newPrev.source = 'powDefReverse';

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        [],
        result.steps,
        'a power is the same as multiplying the base n times',
      );
    }
  }

  return undefined;
};
powDefReverse.symmetric = true;

export const mulPowsSameBase: Check = (
  prev,
  next,
  context,
): Result | undefined => {
  const { checker } = context;

  if (prev.type !== NodeType.Mul) {
    return;
  }

  const factors = Semantic.util.getFactors(prev);

  // We don't actually need everything ƒactor to be a power, just as long as
  // there are some factors that powers

  type MutableOneOrMore<T> = [T, ...T[]];

  // TODO: create a util function that can be used here and in collectLikeTerms
  const map = new Map<
    Semantic.types.NumericNode,
    MutableOneOrMore<{
      exp: Semantic.types.NumericNode;
      factor: Semantic.types.NumericNode;
    }>
  >();

  for (const factor of factors) {
    // TODO: should we clone base and exp?
    const { base, exp } =
      factor.type === NodeType.Power
        ? factor
        : // TODO: track when we add "1" as an exponent so that we don't add
          // it below when it wasn't par of the original expression.
          { base: factor, exp: Semantic.builders.number('1') };

    let key: Semantic.types.NumericNode | undefined;
    for (const k of map.keys()) {
      // TODO: add an option to ignore mul.implicit
      if (exactMatch(k, base, context)) {
        key = k;
      }
    }
    if (!key) {
      map.set(base, [{ exp, factor }]);
    } else {
      map.get(key)?.push({ exp, factor });
    }
  }

  const newFactors: Semantic.types.NumericNode[] = [];

  let changed = false;
  for (const [k, values] of map.entries()) {
    if (values.length > 1) {
      if (
        values.some(
          (value) =>
            !exactMatch(value.exp, Semantic.builders.number('1'), context),
        )
      ) {
        newFactors.push(
          Semantic.builders.pow(
            k,
            Semantic.builders.add(values.map(({ exp }) => exp)),
          ),
        );
        changed = true;
        continue;
      }
    }
    // Avoid changing x -> x^1
    newFactors.push(Semantic.builders.pow(k, values[0].factor));
  }

  if (!changed) {
    return;
  }

  const newPrev = Semantic.builders.mul(newFactors);

  const result = checker.checkStep(newPrev, next, context);

  if (result) {
    return correctResult(
      prev,
      newPrev,
      context.reversed,
      [],
      result.steps,
      'multiplying powers adds their exponents',
    );
  }

  const newFactors2: Semantic.types.NumericNode[] = [];

  let changed2 = false;
  const evaluatedNodes: [
    Semantic.types.NumericNode,
    Semantic.types.NumericNode,
  ][] = [];
  for (const [k, values] of map.entries()) {
    if (values.length > 1) {
      if (
        values.some(
          (value) =>
            !exactMatch(value.exp, Semantic.builders.number('1'), context),
        )
      ) {
        const exp: Semantic.types.NumericNode = Semantic.builders.add(
          values.map(({ exp }) => exp),
        );
        if (Semantic.util.isNumber(exp)) {
          const evalExp = Semantic.builders.number(
            Semantic.util.evalNode(exp, checker.options).toString(),
          );
          // TODO: dedupe with logic in correctResult
          if (context.reversed) {
            evaluatedNodes.push([evalExp, exp]);
          } else {
            evaluatedNodes.push([exp, evalExp]);
          }
          newFactors2.push(Semantic.builders.pow(k, evalExp));
          changed2 = true;
          continue;
        }
      }
    }
    // Avoid changing x -> x^1
    newFactors2.push(Semantic.builders.pow(k, values[0].factor));
  }

  if (!changed2) {
    return;
  }

  const newPrev2 = Semantic.builders.mul(newFactors2);

  const result2 = checker.checkStep(newPrev2, next, context);

  if (result2) {
    // TODO: dedupe with logic in correctResult
    const steps: Solver.Step[] = context.reversed
      ? [
          ...result2.steps,
          ...evaluatedNodes.map<Solver.Step>((nodes) => ({
            message: 'decompose sum',
            before: nodes[0],
            after: nodes[1],
            substeps: [],
          })),
        ]
      : [
          ...evaluatedNodes.map<Solver.Step>((nodes) => ({
            message: 'evaluate sum',
            before: nodes[0],
            after: nodes[1],
            substeps: [],
          })),
          ...result2.steps,
        ];

    return correctResult(
      prev,
      // NOTE: we don't use newPrev2 here because we're manually appending
      // to results2.step.
      newPrev,
      context.reversed,
      [],
      steps,
      'multiplying powers adds their exponents',
    );
  }

  return undefined;
};
mulPowsSameBase.symmetric = true;

// TODO: dual for divPowsSameBase
// NOTE: make sure that (a^x)(b^(n+m))(c^y) -> (a^x)(b^n)(b^m)(c^y)

// (a^n)/(a^m) -> a^(n-m)
export const divPowsSameBase: Check = (
  prev,
  next,
  context,
): Result | undefined => {
  if (prev.type !== NodeType.Div) {
    return;
  }

  const { checker } = context;

  const [numerator, denominator] = prev.args;

  if (
    isPower(numerator) &&
    isPower(denominator) &&
    Semantic.util.deepEquals(numerator.base, denominator.base)
  ) {
    // TODO: It would be sweet if we had a way to template expressions so
    // that we could do: `${base}^(${numerator.exp}-${denominator.exp})`
    const newPrev = Semantic.builders.pow(
      numerator.base,
      Semantic.builders.add([
        numerator.exp,
        Semantic.builders.neg(denominator.exp, true),
      ]),
    );

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        [],
        result.steps,
        'dividing powers subtracts their exponents',
      );
    }

    if (Semantic.util.isNumber(newPrev.exp)) {
      const exp = Semantic.builders.number(
        Semantic.util.evalNode(newPrev.exp, checker.options).toString(),
      );
      const newPrev2 = Semantic.builders.pow(newPrev.base, exp);

      const result2 = checker.checkStep(newPrev2, next, context);

      if (result2) {
        // TODO: dedupe with logic in correctResult
        const steps: Solver.Step[] = context.reversed
          ? [
              ...result2.steps,
              {
                message: 'decompose sum',
                before: newPrev.exp,
                after: exp,
                substeps: [],
              },
            ]
          : [
              {
                message: 'evaluate sum',
                before: newPrev.exp,
                after: exp,
                substeps: [],
              },
              ...result2.steps,
            ];

        return correctResult(
          prev,
          // NOTE: we don't use newPrev2 here because we're manually
          // appending to results2.step.
          newPrev,
          context.reversed,
          [],
          steps,
          'dividing powers subtracts their exponents',
        );
      }
    }
  }

  return undefined;
};
divPowsSameBase.symmetric = true;

// TODO: dual for divPowsSameBase

// NOTE: this function was split out of powNegExp so that it could be called
// from divByFrac.
export const convertPowNegExpToDiv = (
  prev: Semantic.types.NumericNode,
): Semantic.types.NumericNode | undefined => {
  if (!isPower(prev) || !Semantic.util.isNegative(prev.exp)) {
    return;
  }

  return Semantic.builders.div(
    Semantic.builders.number('1'),
    Semantic.builders.pow(prev.base, prev.exp.arg),
  );
};

// a^(-n) -> 1 / a^n
export const powNegExp: Check = (prev, next, context): Result | undefined => {
  // TODO: make Check generic so that we only have to check call isNumeric()
  // once in checkStep().
  if (!Semantic.util.isNumeric(prev)) {
    return;
  }

  // avoid infinite recursion from dual
  if (
    prev.source === 'oneOverPowToNegPow' ||
    next.source === 'oneOverPowToNegPow'
  ) {
    return;
  }

  const newPrev = convertPowNegExpToDiv(prev);

  if (!newPrev) {
    return;
  }

  newPrev.source = 'powNegExp';

  const { checker } = context;
  const result = checker.checkStep(newPrev, next, context);

  if (result) {
    return correctResult(
      prev,
      newPrev,
      context.reversed,
      [],
      result.steps,
      // TODO: Create enums for all of the reasons so that it's easy to change the message later
      'A power with a negative exponent is the same as one over the power with the positive exponent',
    );
  }

  return undefined;
};
powNegExp.symmetric = true;

// 1 / a^n -> a^(-n)
export const oneOverPowToNegPow: Check = (
  prev,
  next,
  context,
): Result | undefined => {
  if (prev.type !== NodeType.Div) {
    return undefined;
  }

  // avoid infinite recursion from dual
  if (prev.source === 'powNegExp' || next.source === 'powNegExp') {
    return;
  }

  const [numerator, denominator] = prev.args;

  // We use exactMatch here since it's unlikely that people will combine this
  // step with one that results in the numerator being "1".
  if (!exactMatch(numerator, Semantic.builders.number('1'), context)) {
    return undefined;
  }

  if (!isPower(denominator)) {
    return;
  }

  const newPrev = Semantic.builders.pow(
    denominator.base,
    Semantic.builders.neg(denominator.exp),
  );
  newPrev.source = 'oneOverPowToNegPow';

  const { checker } = context;
  const result = checker.checkStep(newPrev, next, context);

  if (result) {
    return correctResult(
      prev,
      newPrev,
      context.reversed,
      [],
      result.steps,
      // TODO: Create enums for all of the reasons so that it's easy to change the message later
      'One over the power is the same a power with same base but the negative of the same exponent',
    );
  }

  return undefined;
};

// (a^n)^m -> a^(n*m)
export const powOfPow: Check = (prev, next, context): Result | undefined => {
  if (!isPower(prev)) {
    return;
  }

  if (!isPower(prev.base)) {
    return;
  }

  const { checker } = context;
  const newPrev = Semantic.builders.pow(
    prev.base.base,
    Semantic.builders.mul([
      // handle situations like (x^(ab))^(cd)
      ...Semantic.util.getFactors(prev.base.exp),
      ...Semantic.util.getFactors(prev.exp),
    ]),
  );

  const result = checker.checkStep(newPrev, next, context);

  if (result) {
    return correctResult(
      prev,
      newPrev,
      context.reversed,
      [],
      result.steps,
      'raising a power to another exponent is the same raising the power once an multiplying the exponents',
    );
  }

  return undefined;
};
powOfPow.symmetric = true;

// (xy)^n -> (x^n)(y^n)
export const powOfMul: Check = (prev, next, context): Result | undefined => {
  if (!(prev.type === NodeType.Power && prev.base.type === NodeType.Mul)) {
    return;
  }

  // avoid infinite recursion from dual
  if (prev.source === 'mulPowsSameExp' || next.source === 'mulPowsSameExp') {
    return;
  }

  const factors = Semantic.util.getFactors(prev.base);

  const newPrev = Semantic.builders.mul(
    factors.map((factor) => Semantic.builders.pow(factor, prev.exp)),
  );
  newPrev.source = 'powOfMul';

  const { checker } = context;

  const result = checker.checkStep(newPrev, next, context);

  if (result) {
    return correctResult(
      prev,
      newPrev,
      context.reversed,
      [],
      result.steps,
      'A product raised to a exponent is the same as raising each factor to that exponent',
    );
  }
};
powOfMul.symmetric = true;

// (a^n)(b^n)(c^n) -> (abc)^n
// NOTE: this check currently requires all exponents in the product to be the same.
// TODO: support (a^n)(b^n)(c^m) -> (ab^n)(c^m)
export const mulPowsSameExp: Check = (
  prev,
  next,
  context,
): Result | undefined => {
  if (prev.type !== NodeType.Mul) {
    return undefined;
  }

  if (!prev.args.every((arg) => arg.type === NodeType.Power)) {
    return undefined;
  }

  // avoid infinite recursion from dual
  if (prev.source === 'powOfMul' || next.source === 'powOfMul') {
    return;
  }

  const pows = prev.args as readonly Semantic.types.Pow[];
  const exps = pows.map((pow) => pow.exp);
  const firstExp = exps[0]; // TODO: clone this?

  // If some of the exponents are the same as firstExp then fail this check
  if (exps.some((exp) => !exactMatch(firstExp, exp, context))) {
    return undefined;
  }

  const bases = pows.map((pow) => pow.base);
  const newPrev = Semantic.builders.pow(Semantic.builders.mul(bases), firstExp);
  newPrev.source = 'mulPowsSameExp';

  const { checker } = context;

  const result = checker.checkStep(newPrev, next, context);

  if (result) {
    return correctResult(
      prev,
      newPrev,
      context.reversed,
      [],
      result.steps,
      'A product of powers raised to the same exponent are equal to the product of bases raised to that exponent',
    );
  }
};
mulPowsSameExp.symmetric = true;

// (x/y)^n -> x^n / y^n
export const powOfDiv: Check = (prev, next, context): Result | undefined => {
  if (!(prev.type === NodeType.Power && prev.base.type === NodeType.Div)) {
    return;
  }

  // avoid infinite recursion from dual
  if (
    prev.source === 'divOfPowsSameExp' ||
    next.source === 'divOfPowsSameExp'
  ) {
    return;
  }

  const [numerator, denominator] = prev.base.args;

  const newPrev = Semantic.builders.div(
    Semantic.builders.pow(numerator, prev.exp),
    Semantic.builders.pow(denominator, prev.exp),
  );

  newPrev.source = 'powOfDiv';

  const { checker } = context;

  const result = checker.checkStep(newPrev, next, context);

  if (result) {
    return correctResult(
      prev,
      newPrev,
      context.reversed,
      [],
      result.steps,
      'A fraction raised to a exponent is the same a fraction with the numerator and denominator each raised to that exponent',
    );
  }
};
powOfDiv.symmetric = true;

// x^n / y^n -> (x/y)^n
export const divOfPowsSameExp: Check = (
  prev,
  next,
  context,
): Result | undefined => {
  if (prev.type !== NodeType.Div) {
    return undefined;
  }

  if (!prev.args.every((arg) => arg.type === NodeType.Power)) {
    return undefined;
  }

  // avoid infinite recursion from dual
  if (prev.source === 'powOfDiv' || next.source === 'powOfDiv') {
    return;
  }

  const pows = prev.args as readonly Semantic.types.Pow[];
  const exps = [pows[0].exp, pows[1].exp];
  if (!exactMatch(exps[0], exps[1], context)) {
    return undefined;
  }

  const newPrev = Semantic.builders.pow(
    Semantic.builders.div(pows[0].base, pows[1].base),
    exps[0], // TODO: clone this
  );
  newPrev.source = 'mulPowsSameExp';

  const { checker } = context;

  const result = checker.checkStep(newPrev, next, context);

  if (result) {
    return correctResult(
      prev,
      newPrev,
      context.reversed,
      [],
      result.steps,
      'A quotient of powers raised to the same exponent are equal to the quotient of bases raised to that exponent',
    );
  }
};
divOfPowsSameExp.symmetric = true;

// x^0 -> 1
// NOTE: 0^0 is defined as 1 for convenience
export const powToZero: Check = (prev, next, context): Result | undefined => {
  if (prev.type !== NodeType.Power) {
    return;
  }

  const { checker } = context;

  const result1 = checker.checkStep(
    prev.exp,
    Semantic.builders.number('0'),
    context,
  );
  if (result1) {
    const newPrev = Semantic.builders.number('1');
    const result2 = checker.checkStep(newPrev, next, context);
    if (result2) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        result1.steps,
        result2.steps,
        'anything raised to 0 is equal to 1',
      );
    }
  }
};
powToZero.symmetric = true;

// x^1 -> x
export const powToOne: Check = (prev, next, context): Result | undefined => {
  if (prev.type !== NodeType.Power) {
    return;
  }

  const { checker } = context;

  const result1 = checker.checkStep(
    prev.exp,
    Semantic.builders.number('1'),
    context,
  );
  if (result1) {
    // TODO: clone prev.base?
    const newPrev = prev.base;
    const result2 = checker.checkStep(newPrev, next, context);

    if (result2) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        result1.steps,
        result2.steps,
        'raising something to the 1st power is a no-op',
      );
    }
  }
};
powToOne.symmetric = true;

// 1^x -> 1
export const powOfOne: Check = (prev, next, context) => {
  if (prev.type !== NodeType.Power) {
    return;
  }

  const { checker } = context;

  const result1 = checker.checkStep(
    prev.base,
    Semantic.builders.number('1'),
    context,
  );
  if (result1) {
    const newPrev = Semantic.builders.number('1');
    const result2 = checker.checkStep(newPrev, next, context);
    if (result2) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        result1.steps,
        result2.steps,
        '1 raised to any power is equal to 1',
      );
    }
  }
};
powOfOne.symmetric = true;

// 0^x -> 0
export const powOfZero: Check = (prev, next, context): Result | undefined => {
  if (prev.type !== NodeType.Power) {
    return;
  }

  const { checker } = context;

  const result1 = checker.checkStep(
    prev.base,
    Semantic.builders.number('0'),
    context,
  );
  if (result1) {
    const newPrev = Semantic.builders.number('0');
    const result2 = checker.checkStep(newPrev, next, context);
    if (result2) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        result1.steps,
        result2.steps,
        '0 raised to any power (except for 0) is 0',
      );
    }
  }
};
powOfZero.symmetric = true;

// TODO: we'll have to do something similar to divByFrac's call to convertPowNegExpToDiv
// (-1)^(2n) -> 1, (-1)^(2n + 1) -> 1, where 'n' is an integer

// TODO: include roots in this file as well
// TODO: figure out a text representation for roots
// \root[n](x) -> x^(1/n)
// \root[n](x^m) -> x^(m/n) or (\root[n](x))^m -> x^(m/n)
