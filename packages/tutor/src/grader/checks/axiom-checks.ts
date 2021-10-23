import * as Semantic from '@math-blocks/semantic';
import * as Solver from '@math-blocks/solver';

import type { Result, Check } from '../types';
import { MistakeId } from '../enums';

import { exactMatch, checkArgs } from './basic-checks';
import { zip, correctResult } from './util';

const { NodeType } = Semantic;

export const addZero: Check = (prev, next, context) => {
  if (next.type !== NodeType.Add) {
    return;
  }

  if (!Semantic.util.isNumeric(prev)) {
    return;
  }

  const { checker } = context;

  // Check that each new term is equivalent to zero
  const identity = Semantic.builders.number('0');

  const identitySteps: Solver.Step[] = [];
  const nonIdentityArgs: Semantic.types.NumericNode[] = [];

  const newNextArgs = next.args.map((arg) => {
    // The order of the args passed to checkStep is important.  We want to
    // maintain the correct direction.
    const result = checker.checkStep(identity, arg, {
      ...context,
      // This has the effect of discarding any mistakes accumulated by
      // this call to checkStep.
      // 'identity' is synthetic which means if any mistakes are reported
      // invovling it, we won't be able to report those back to the user
      // it's not a node that appears in any of the expressions that the
      // user has entered themselves.
      mistakes: undefined,
    });
    if (result) {
      identitySteps.push(...result.steps);
      // We include all identities in the output so that we can handle
      // expressions with multiple identities, e.g. a + 0 + b + 0.
      // We create a new number("0") each time so that we can differentiate
      // each instance.
      return Semantic.builders.number('0');
    } else {
      nonIdentityArgs.push(arg);
      return arg;
    }
  });

  // If we haven't removed any identities then this check has failed
  if (nonIdentityArgs.length === next.args.length) {
    if (!context.mistakes) {
      return;
    }

    const prevTerms = Semantic.util.getTerms(prev);
    const newNonIdentityTerms = Semantic.util.difference(
      nonIdentityArgs,
      prevTerms,
    );
    const oldTerms = Semantic.util.intersection(prevTerms, next.args);

    if (
      newNonIdentityTerms.length > 0 &&
      // check that no terms were removed
      oldTerms.length === prevTerms.length
    ) {
      context.mistakes.push({
        id: MistakeId.EXPR_ADD_NON_IDENTITY,
        prevNodes: context.reversed ? newNonIdentityTerms : [],
        nextNodes: context.reversed ? [] : newNonIdentityTerms,
        corrections: [],
      });
    }
    return;
  }

  const newNext = Semantic.builders.add(newNextArgs);
  const newPrev = Semantic.builders.add(nonIdentityArgs);

  // This first check is fine since nonIdentityArgs only contains nodes from
  // an expression entered by a user.
  const result1 = context.checker.checkStep(prev, newPrev, context);
  // This second check is not fine since newNext contains 'identity'.
  // TODO: If a mistake is reported involving 'identity' then we'll need to
  // filter it out of the 'mistakes' array.  We should try to come up with a
  // scenario where this will matter.
  const result2 = context.checker.checkStep(newNext, next, context);

  if (result1 && result2) {
    // TODO: figure out how to incorporate steps from result2.
    // Do we need to apply afterSteps to newNext in correctResult?
    return correctResult(
      // If there are no steps from prev to newPrev, use prev since it
      // won't have any new nodes.  We can do this here because result1
      // comes from calling checkStep() on prev and newPrev.  This is
      // currently the only check that does this.
      result1.steps.length > 0 ? newPrev : prev,
      // Same for newNext and next
      result2.steps.length > 0 ? newNext : next,
      context.reversed,
      result1.steps,
      identitySteps,
      'addition with identity',
    );
  }

  return;
};
addZero.symmetric = true;

export const mulOne: Check = (prev, next, context) => {
  // This check prunes a lot of paths... we could try multiplying by "1" as
  // long as prev.
  // This is going in the direction of (a)(1) -> a
  // so if we have -a we can go from (-a)(1) -> a
  // TODO: figure out how we can drop this without running into recursion limits
  if (next.type !== NodeType.Mul) {
    return;
  }

  if (!Semantic.util.isNumeric(prev)) {
    return;
  }

  const { checker } = context;

  const identity = Semantic.builders.number('1');

  const identitySteps: Solver.Step[] = [];
  const nonIdentityArgs: Semantic.types.NumericNode[] = [];

  const newNextArgs = next.args.map((arg) => {
    // The order of the args passed to checkStep is important.  We want to
    // maintain the correct direction.
    const result = checker.checkStep(identity, arg, {
      ...context,
      // This has the effect of discarding any mistakes accumulated by
      // this call to checkStep.
      // 'identity' is synthetic which means if any mistakes are reported
      // invovling it, we won't be able to report those back to the user
      // it's not a node that appears in any of the expressions that the
      // user has entered themselves.
      mistakes: undefined,
    });
    if (result) {
      identitySteps.push(...result.steps);
      // We include all identities in the output so that we can handle
      // expressions with multiple identities, e.g. a * 1 * b * 1
      // We create a new number("1") each time so that we can differentiate
      // each instance.
      return Semantic.builders.number('1');
    } else {
      nonIdentityArgs.push(arg);
      return arg;
    }
  });

  // If we haven't removed any identities then this check has failed
  if (nonIdentityArgs.length === next.args.length) {
    if (!context.mistakes) {
      return;
    }

    const prevFactors = Semantic.util.getFactors(prev);
    const newNonIdentityFactors = Semantic.util.difference(
      next.args,
      prevFactors,
    );
    const oldFactors = Semantic.util.intersection(prevFactors, next.args);
    if (
      newNonIdentityFactors.length > 0 &&
      // check that no factors were removed
      oldFactors.length === prevFactors.length
    ) {
      context.mistakes.push({
        id: MistakeId.EXPR_MUL_NON_IDENTITY,
        prevNodes: context.reversed ? newNonIdentityFactors : [],
        nextNodes: context.reversed ? [] : newNonIdentityFactors,
        corrections: [],
      });
    }
    return;
  }

  const newNext = Semantic.builders.mul(newNextArgs);

  // TODO: provide a way to have different levels of messages, e.g.
  // "multiplying by one doesn't change an expression.
  const reason = 'multiplication with identity';

  const newPrev = Semantic.builders.mul(nonIdentityArgs);

  // This first check is fine since nonIdentityArgs only contains nodes from
  // an expression entered by a user.
  const result1 = context.checker.checkStep(prev, newPrev, context);
  // This second check is not fine since newNext contains 'identity'.
  // TODO: If a mistake is reported involving 'identity' then we'll need to
  // filter it out of the 'mistakes' array.  We should try to come up with a
  // scenario where this will matter.
  // TODO: instead of trying to filter mistakes out at each point, we can
  // wait until the end and cross check the ids against those in the original
  // expressions.
  const result2 = context.checker.checkStep(newNext, next, context);

  if (result1 && result2) {
    // TODO: figure out how to incorporate steps from result2.
    // Do we need to apply afterSteps to newNext in correctResult?
    return correctResult(
      // If there are no steps from prev to newPrev, use prev since it
      // won't have any new nodes.  We can do this here because result1
      // comes from calling checkStep() on prev and newPrev.  This is
      // currently the only check that does this.
      result1.steps.length > 0 ? newPrev : prev,
      // Same for newNext and next
      result2.steps.length > 0 ? newNext : next,
      context.reversed,
      result1.steps,
      identitySteps,
      reason,
    );
  }

  return;
};
mulOne.symmetric = true;

export const mulByZero: Check = (prev, next, context) => {
  const { checker } = context;

  if (prev.type !== NodeType.Mul) {
    return;
  }

  const identitySteps: Solver.Step[] = [];

  // It's sufficient to find only one zero since mutliplying one zero is
  // enough to turn the whole product to zero.
  const hasZero = prev.args.some((arg) => {
    const result = checker.checkStep(
      arg,
      Semantic.builders.number('0'),
      context,
    );
    if (result) {
      identitySteps.push(...result.steps);
      return result;
    }
  });
  const newPrev = Semantic.builders.number('0');
  const result = checker.checkStep(newPrev, next, context);

  if (hasZero && result) {
    return correctResult(
      prev,
      newPrev,
      context.reversed,
      identitySteps,
      result.steps,
      'multiplication by zero',
    );
  }
};

mulByZero.symmetric = true;

export const commuteAddition: Check = (prev, next, context) => {
  const { checker } = context;

  if (
    prev.type === NodeType.Add &&
    next.type === NodeType.Add &&
    prev.args.length === next.args.length
  ) {
    const pairs = zip(prev.args, next.args);

    // Check if the args are the same disregarding order.
    const result1 = checkArgs(prev, next, context);

    // If they aren't we can stop this check right here.
    if (!result1) {
      return;
    }

    // If at least some of the pairs don't line up then it's safe to
    // say the args have been reordered.
    const reordered = pairs.some(([first, second]) => {
      // It's safe to ignore the steps (or mistakes) from this call to
      // checkStep since we're already getting the reasons why the nodes
      // are equivalent from the call to checkArgs
      const result = checker.checkStep(first, second, {
        ...context,
        mistakes: undefined,
      });
      return !result;
    });

    const newPrev = Solver.applySteps(prev, result1.steps);

    if (reordered && result1) {
      // No need to run checkStep(newPrev, next) since we already know
      // they're equivalent because of checkArgs.  The only difference
      // is the order of the args which is what we're communicate with
      // the "commutative property" message in the result.

      // We'd like any of the reasons from the checkArgs call to appear
      // first since it'll be easier to see that commutative property is
      // be applied once all of the values are the same.
      //
      // What about when we're going in reverse and splitting numbers up?
      // That seems like a very unlikely situation.
      //
      // The order doesn't really matter.  We could provide a way to indicate
      // the precedence between different operations and use that to decide
      // the ordering.
      return correctResult(
        newPrev,
        next,
        context.reversed,
        result1.steps,
        [],
        'commutative property',
      );
    }
  }
};

export const commuteMultiplication: Check = (prev, next, context) => {
  const { checker } = context;

  if (
    prev.type === NodeType.Mul &&
    next.type === NodeType.Mul &&
    prev.args.length === next.args.length
  ) {
    const pairs = zip(prev.args, next.args);

    // Check if the arguments are the same disregarding order.
    const result1 = checkArgs(prev, next, context);

    // If the args are the same then we can stop here.
    if (!result1) {
      return;
    }

    const reordered = pairs.some(
      ([first, second]) =>
        // It's safe to ignore the steps (and mistakes) from these
        // checks since we already have the steps from the checkArgs
        // call.
        !checker.checkStep(first, second, {
          ...context,
          mistakes: undefined,
        }),
    );

    const newPrev = Solver.applySteps(prev, result1.steps);

    if (reordered && result1) {
      // No need to run checkStep(newPrev, next) since we already know
      // they're equivalent because of checkArgs.  The only difference
      // is the order of the args which is what we're communicate with
      // the "commutative property" message in the result.

      return correctResult(
        newPrev,
        next,
        context.reversed,
        result1.steps,
        [],
        'commutative property',
      );
    }
  }
};

// TODO: check that context.reversed is being handled correctly
export const symmetricProperty: Check = (
  prev,
  next,
  context,
): Result | undefined => {
  // We prefer that 'symmetric property' always appear last in the list of
  // steps.  This is because it's common to do a bunch of steps to an equation
  // and then swap sides at the last moment so that the variable that we're
  // looking to isolate is on the left.
  if (!context.reversed) {
    return;
  }

  if (
    prev.type === NodeType.Equals &&
    next.type === NodeType.Equals &&
    prev.args.length === next.args.length
  ) {
    // TODO: actually check that this is the case
    const prevArgs = prev.args as TwoOrMore<Semantic.types.NumericNode>;
    const nextArgs = next.args as TwoOrMore<Semantic.types.NumericNode>;

    const pairs = zip(prevArgs, nextArgs);

    // If there are only two args, we swap them and then check that it
    // exactly matches the next step.
    if (pairs.length === 2) {
      const newPrev = Semantic.builders.eq([prevArgs[1], prevArgs[0]]);
      const result = exactMatch(newPrev, next, context);

      if (result) {
        return {
          steps: [
            ...result.steps,
            {
              message: 'symmetric property',
              before: newPrev,
              after: prev,
              substeps: [],
            },
          ],
        };
      }
    }

    // If at least one of the pairs doesn't match then we've swapped the
    // pairs around.  The issue with using checkStep here is that we could
    // end up making changes to items that are equivalent, e.g.
    // x + 0 = x -> x = x + 0 in which case we wouldn't identify this as
    // the symmetric property of equality.
    const reordered = pairs.some(
      ([first, second]) =>
        // Ignore any mistakes from this check since this call is only
        // to determine if the commutative property might be in play.
        // The call to checkArgs below is where we end up collecting
        // mistakes from.
        !context.checker.checkStep(first, second, {
          ...context,
          mistakes: undefined,
        }),
    );

    if (reordered) {
      const result = checkArgs(prev, next, context);

      if (result) {
        const newNext = Solver.applySteps(next, result.steps);
        return {
          steps: [
            ...result.steps,
            {
              message: 'symmetric property',
              before: newNext,
              after: prev,
              substeps: [],
            },
          ],
        };
      }
    }
  }
};

symmetricProperty.symmetric = true;

// NOTE: This check doesn't strictly check the associative property of
// multiplication, but rather can "mul" nodes that are args of a parent "mul"
// node be removed (or added).
export const associativeMul: Check = (prev, next, context) => {
  if (prev.type !== NodeType.Mul) {
    return;
  }

  const { checker } = context;

  if (prev.args.some((arg) => arg.type === NodeType.Mul)) {
    // for (const arg of prev.args) {
    //     console.log(arg);
    // }
    // console.log(JSON.stringify(prev, null, 4));
    // throw new Error("foo");
    const factors: Semantic.types.NumericNode[] = [];
    for (const arg of prev.args) {
      factors.push(...Semantic.util.getFactors(arg));
    }
    const newPrev = Semantic.builders.mul(factors);
    newPrev.source = 'associativeMul';

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        [],
        result.steps,
        'associative property of multiplication',
      );
    }
  }
};
associativeMul.symmetric = true;

// NOTE: This check doesn't strictly check the associative property of addition,
// but rather can parens be removed (or added) for "add" nodes that are args of
// a parent "add" node.
export const associativeAdd: Check = (prev, next, context) => {
  if (prev.type !== NodeType.Add) {
    return;
  }

  const { checker } = context;

  if (prev.args.some((arg) => arg.type === NodeType.Add)) {
    const terms: Semantic.types.NumericNode[] = [];
    for (const arg of prev.args) {
      terms.push(...Semantic.util.getTerms(arg));
    }
    const newPrev = Semantic.builders.add(terms);

    const result = checker.checkStep(newPrev, next, context);

    if (result) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        [],
        result.steps,
        'associative property of addition',
      );
    }
  }
};
associativeAdd.symmetric = true;
