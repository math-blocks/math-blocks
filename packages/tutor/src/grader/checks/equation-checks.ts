import { notEmpty } from '@math-blocks/core';
import * as Semantic from '@math-blocks/semantic';

import { MistakeId } from '../enums';
import type { Check, Result, Mistake, Context } from '../types';

import { correctResult } from './util';

const { NodeType } = Semantic;

// TODO: create sub-steps that includes the opposite operation when reversed is true
// TODO: include which nodes were added/removed in each reason
// TODO: handle square rooting both sides
// TODO: handle applying the same exponent to both sides

const NUMERATOR = 0;
const DENOMINATOR = 1;

export const checkAddSub: Check = (prev, next, context): Result | undefined => {
  if (prev.type !== NodeType.Equals || next.type !== NodeType.Equals) {
    return;
  }

  const { checker } = context;

  const [prevLHS, prevRHS] = prev.args;
  const [nextLHS, nextRHS] = next.args;

  if (
    !Semantic.util.isNumeric(prevLHS) ||
    !Semantic.util.isNumeric(prevRHS) ||
    !Semantic.util.isNumeric(nextLHS) ||
    !Semantic.util.isNumeric(nextRHS)
  ) {
    return;
  }

  // TODO: take into account LHS and RHS being swapped
  // e.g. y = x -> x + 10 = y + 10
  if (nextLHS.type === NodeType.Add || nextRHS.type === NodeType.Add) {
    const prevTermsLHS = Semantic.util.getTerms(prevLHS);
    const prevTermsRHS = Semantic.util.getTerms(prevRHS);
    const nextTermsLHS = Semantic.util.getTerms(nextLHS);
    const nextTermsRHS = Semantic.util.getTerms(nextRHS);

    // Which terms from the previous step appear in the next step on each
    // side.
    const oldTermsLHS = Semantic.util.intersection(nextTermsLHS, prevTermsLHS);
    const oldTermsRHS = Semantic.util.intersection(nextTermsRHS, prevTermsRHS);

    // All previous terms for each side should appear in the next step as
    // terms as well.  If any are missing then we're doing something other
    // than adding something to both sides.
    if (
      oldTermsLHS.length !== prevTermsLHS.length ||
      oldTermsRHS.length !== prevTermsRHS.length
    ) {
      return;
    }

    const newTermsLHS = Semantic.util.difference(nextTermsLHS, prevTermsLHS);
    const newTermsRHS = Semantic.util.difference(nextTermsRHS, prevTermsRHS);

    const areNewTermsEquivalent = checker.checkStep(
      Semantic.builders.add(newTermsLHS),
      Semantic.builders.add(newTermsRHS),
      context,
    );

    // If what we're adding to both sides isn't equivalent then report that
    // this step was incorrect and include which nodes weren't the same.
    if (!areNewTermsEquivalent) {
      if (!context.mistakes) {
        return;
      }
      context.mistakes.push({
        id: MistakeId.EQN_ADD_DIFF,
        // TODO: make structures that are specific to each mistake
        // In this case we might like to differentiate between new terms
        // on the LHS from those on the RHS.
        prevNodes: context.reversed ? [...newTermsLHS, ...newTermsRHS] : [],
        nextNodes: context.reversed ? [] : [...newTermsLHS, ...newTermsRHS],
        corrections: [],
      });
      return;
    }

    if (newTermsLHS.length === 0 || newTermsRHS.length === 0) {
      // TODO: write a test for this
      return;
    }

    // We prefer adding fewer terms to both sides.
    const newTerms =
      newTermsLHS.length < newTermsRHS.length ? newTermsLHS : newTermsRHS;

    const newPrev = Semantic.builders.eq([
      Semantic.builders.add([...prevTermsLHS, ...newTerms]),
      Semantic.builders.add([...prevTermsRHS, ...newTerms]),
    ]);

    // This checkStep allows for commutation of the result, but doesn't
    // handle evaluation that might happen during result1.
    const result = checker.checkStep(newPrev, next, context);

    if (result) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        [],
        result.steps,
        'adding the same value to both sides',
        'removing adding the same value to both sides',
      );
    }
  }
};
checkAddSub.symmetric = true;

export const checkAddSubVert: Check = (
  prev,
  next,
  context,
): Result | undefined => {
  if (
    prev.type !== NodeType.Equals ||
    next.type !== NodeType.VerticalAdditionToRelation
  ) {
    return;
  }

  if (next.relOp !== 'eq') {
    return;
  }

  const { checker } = context;

  const origEq = Semantic.builders.eq<Semantic.types.NumericNode>([
    Semantic.builders.add(next.originalRelation.left.filter(notEmpty)),
    Semantic.builders.add(next.originalRelation.right.filter(notEmpty)),
  ]);

  let result: Result | undefined = undefined;

  result = checker.checkStep(prev, origEq, context);

  // TODO: come up with a way to short-circuit continued to checking since we
  // know if this fails then something is wrong.
  if (!result) {
    return;
  }

  // TODO: add a style check to see whether actions line up with the right columns
  // in originalRelation and resultingRelation.
  const leftActions = next.actions.left.filter(notEmpty);
  const rightActions = next.actions.right.filter(notEmpty);

  if (leftActions.length !== 1 || rightActions.length !== 1) {
    // TODO: handle multiple actions later
    // We can add handling for multiple actions at the same time using `groupTerms`
    // from collect-like-term.ts in the `solver` package to help with this.
    return;
  }

  const mistakes: Mistake[] = [];
  const newContext: Context = {
    ...context,
    // Continue not reporting mistakes if that's what the caller
    // of checkArgs wanted us to do.
    mistakes: context.mistakes ? mistakes : undefined,
  };

  const actionResult = checker.checkStep(
    leftActions[0],
    rightActions[0],
    newContext,
  );
  if (actionResult) {
    const { resultingRelation } = next;
    if (!resultingRelation) {
      // The actions match, report success
      return correctResult(
        prev,
        next,
        context.reversed,
        [],
        result.steps,
        'adding the same value to both sides',
      );
    } else {
      // Create an equation where the actions have been applied to the original
      // equation.
      // TODO: consider handling each of the equation separately.
      const appliedActionsEq: Semantic.types.Eq<Semantic.types.NumericNode> = {
        ...origEq,
        args: [
          Semantic.builders.add([
            ...Semantic.util.getTerms(origEq.args[0]),
            ...leftActions,
          ]),
          Semantic.builders.add([
            ...Semantic.util.getTerms(origEq.args[1]),
            ...rightActions,
          ]),
        ],
      };
      const resultingEq = Semantic.builders.eq<Semantic.types.NumericNode>([
        Semantic.builders.add(resultingRelation.left.filter(notEmpty)),
        Semantic.builders.add(resultingRelation.right.filter(notEmpty)),
      ]);

      const resultingResult = checker.__checkStep(
        appliedActionsEq,
        resultingEq,
      );

      if (resultingResult.result) {
        // The actions match, report success
        return correctResult(
          prev,
          next,
          context.reversed,
          [],
          result.steps,
          'adding the same value to both sides',
        );
      } else {
        if (!context.mistakes) {
          return;
        }

        // TODO: extract the args from resultingResult.mistakes since their
        // parents have different ids from what's in the `next` node that was
        // passed to checkAddSubVert.
        const { mistakes } = resultingResult;
        if (mistakes.length > 0) {
          const mistake = mistakes[0];
          if (mistake.id === MistakeId.EVAL_ADD) {
            const nodeIds = [
              ...mistake.prevNodes.map((node) => node.id),
              ...mistake.nextNodes.map((node) => node.id),
            ];
            const mistakeNodes: Semantic.types.Node[] = [];

            // Get IDs from prevNodes and nextNodes and then find
            // the nodes with the same IDs within `next`.
            Semantic.util.traverse(next, {
              exit: (node) => {
                if (nodeIds.includes(node.id)) {
                  mistakeNodes.push(node);
                }
              },
            });

            const realMistake: Mistake = {
              id: MistakeId.EVAL_ADD,
              prevNodes: [],
              nextNodes: mistakeNodes,
              corrections: [],
            };
            context.mistakes.push(realMistake);
          }
        }
      }
    }
  } else {
    if (!context.mistakes) {
      return;
    }
    const mistake: Mistake = {
      id: MistakeId.EQN_ADD_DIFF,
      prevNodes: [],
      nextNodes: [leftActions[0], rightActions[0]],
      corrections: [],
    };
    context.mistakes.push(mistake);
  }

  return;
};

export const checkMul: Check = (prev, next, context): Result | undefined => {
  if (prev.type !== NodeType.Equals || next.type !== NodeType.Equals) {
    return;
  }

  const { checker } = context;

  const [prevLHS, prevRHS] = prev.args;
  const [nextLHS, nextRHS] = next.args;

  // TODO: take into account LHS and RHS being swapped
  // e.g. y = x -> x * 10 = y * 10
  if (nextLHS.type === NodeType.Mul || nextRHS.type === NodeType.Mul) {
    if (
      !Semantic.util.isNumeric(prevLHS) ||
      !Semantic.util.isNumeric(prevRHS) ||
      !Semantic.util.isNumeric(nextLHS) ||
      !Semantic.util.isNumeric(nextRHS)
    ) {
      return;
    }

    const prevFactorsLHS = Semantic.util.getFactors(prevLHS);
    const prevFactorsRHS = Semantic.util.getFactors(prevRHS);
    const nextFactorsLHS = Semantic.util.getFactors(nextLHS);
    const nextFacotrsRHS = Semantic.util.getFactors(nextRHS);

    const oldFactorsLHS = Semantic.util.intersection(
      nextFactorsLHS,
      prevFactorsLHS,
    );
    const oldFactorsRHS = Semantic.util.intersection(
      nextFacotrsRHS,
      prevFactorsRHS,
    );

    // All previous factors for each side should appear in the next step as
    // factors as well.  If any are missing then we're doing something other
    // than multiplying something to both sides.
    if (
      oldFactorsLHS.length !== prevFactorsLHS.length ||
      oldFactorsRHS.length !== prevFactorsRHS.length
    ) {
      return;
    }

    const newFactorsLHS = Semantic.util.difference(
      Semantic.util.getFactors(nextLHS),
      prevFactorsLHS,
    );
    const newFactorsRHS = Semantic.util.difference(
      Semantic.util.getFactors(nextRHS),
      prevFactorsRHS,
    );

    const areNewFactorsEquivalent = checker.checkStep(
      Semantic.builders.mul(newFactorsLHS),
      Semantic.builders.mul(newFactorsRHS),
      context,
    );

    // If what we're multiplying both sides by isn't equivalent then fail
    if (!areNewFactorsEquivalent) {
      if (!context.mistakes) {
        return;
      }
      context.mistakes.push({
        id: MistakeId.EQN_MUL_DIFF,
        // TODO: make structures that are specific to each mistake
        // In this case we might like to differentiate between new factors
        // on the LHS from those on the RHS.
        prevNodes: context.reversed ? [...newFactorsLHS, ...newFactorsRHS] : [],
        nextNodes: context.reversed ? [] : [...newFactorsLHS, ...newFactorsRHS],
        corrections: [],
      });
      return;
    }

    // We prefer multiplying both sides by fewer factors.
    const newFactors =
      newFactorsLHS.length < newFactorsRHS.length
        ? newFactorsLHS
        : newFactorsRHS;

    // We place the new factors at the start since it is common to go
    // from x = y -> 2x = 2y or x + 1 = y - 2 -> 5(x + 1) = 5(y - 2)
    const newPrev = Semantic.builders.eq([
      Semantic.builders.mul([...newFactors, ...prevFactorsLHS]),
      Semantic.builders.mul([...newFactors, ...prevFactorsRHS]),
    ]);

    // This checkStep allows for commutation of the result, but doesn't
    // handle evaluation that might happen during result1.
    const result = checker.checkStep(newPrev, next, context);

    if (result) {
      return correctResult(
        prev,
        newPrev,
        context.reversed,
        [],
        result.steps,
        'multiply both sides by the same value',
        'remove multiplication from both sides',
      );
    }
  }
};
checkMul.symmetric = true;

export const checkDiv: Check = (prev, next, context): Result | undefined => {
  if (prev.type !== NodeType.Equals || next.type !== NodeType.Equals) {
    return;
  }

  const { checker } = context;

  const [prevLHS, prevRHS] = prev.args;
  const [nextLHS, nextRHS] = next.args;

  if (!Semantic.util.isNumeric(prevLHS) || !Semantic.util.isNumeric(prevRHS)) {
    return;
  }

  if (nextLHS.type === NodeType.Div && nextRHS.type === NodeType.Div) {
    if (
      checker.checkStep(prevLHS, nextLHS.args[NUMERATOR], context) &&
      checker.checkStep(prevRHS, nextRHS.args[NUMERATOR], context)
    ) {
      const areDenominatorsEquivalent = checker.checkStep(
        nextLHS.args[DENOMINATOR],
        nextRHS.args[DENOMINATOR],
        context,
      );

      if (!areDenominatorsEquivalent) {
        return;
      }

      const denFactorsLSH = Semantic.util.getFactors(nextLHS.args[DENOMINATOR]);
      const denFactorsRHS = Semantic.util.getFactors(nextRHS.args[DENOMINATOR]);

      const denFactors =
        denFactorsLSH.length < denFactorsRHS.length
          ? denFactorsLSH
          : denFactorsRHS;

      const newPrev = Semantic.builders.eq([
        Semantic.builders.div(prevLHS, Semantic.builders.mul(denFactors)),
        Semantic.builders.div(prevRHS, Semantic.builders.mul(denFactors)),
      ]);

      const result = checker.checkStep(newPrev, next, context);

      if (result) {
        return correctResult(
          prev,
          newPrev,
          context.reversed,
          [],
          result.steps,
          'divide both sides by the same value',
          'remove division by the same amount',
        );
      }
    }
  }
};
checkDiv.symmetric = true;
