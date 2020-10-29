import * as Semantic from "@math-blocks/semantic";

import {exactMatch} from "./util";
import {Result, IStepChecker, Options, Context, Check} from "./types";
import {FAILED_CHECK} from "./constants";
import {checkArgs} from "./util";

import {
    symmetricProperty,
    commuteAddition,
    commuteMultiplication,
    addZero,
    mulOne,
    checkDistribution,
    mulByZero,
} from "./checks/axiom-checks";
import {checkAddSub, checkMul, checkDiv} from "./checks/equation-checks";
import {evalMul, evalAdd} from "./checks/eval-checks";
import {
    addInverse,
    subIsNeg,
    mulTwoNegsIsPos,
    doubleNegative,
    negIsMulNegOne,
    moveNegToFirstFactor,
} from "./checks/integer-checks";
import {
    divByFrac,
    divBySame,
    mulByFrac,
    divIsMulByOneOver,
    checkDivisionCanceling,
} from "./checks/fraction-checks";

// TODO: write a function to determine if an equation is true or not
// e.g. 2 = 5 -> false, 5 = 5 -> true

// We'll want to eventually be able to describe hierarchical relations
// between steps in addition sequential relations.
// We still want each step to be responsible for deciding how to combine
// the result of checkStep with the new reason.

const numberCheck: Check = (prev, next, context) => {
    if (
        prev.type === "number" &&
        next.type === "number" &&
        prev.value === next.value
    ) {
        return {
            steps: [],
        };
    }
    return FAILED_CHECK;
};
numberCheck.unfilterable = true;

const identifierCheck: Check = (prev, next, context) => {
    if (
        prev.type === "identifier" &&
        next.type === "identifier" &&
        prev.name === next.name
    ) {
        return {
            steps: [],
        };
    }
    return FAILED_CHECK;
};
numberCheck.unfilterable = true;

const runChecks = (
    checks: Check[],
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result | void => {
    // TODO: create a copy of context before calling 'check' just in case.
    for (const check of checks) {
        const result = check(prev, next, context);
        if (result) {
            context.successfulChecks.add(check.name);
            return result;
        }

        // We can't rely on simply calling each symmetric check with a 'reversed'
        // param since some paths modify the root node multiple times.  If we
        // reverse for one of the checks then the subsequent checks in that path
        // must also be reversed.
        if (check.symmetric) {
            const result = check(next, prev, {
                ...context,
                reversed: !context.reversed,
            });
            if (result) {
                context.successfulChecks.add(check.name);
                return result;
            }
        }
    }

    return FAILED_CHECK;
};

const defaultOptions: Options = {
    skipEvalChecker: false,
    evalFractions: true,
};

class StepChecker implements IStepChecker {
    options: Options;

    constructor(options?: Options) {
        this.options = {
            ...defaultOptions,
            ...options,
        };
    }

    // TODO: check adding by inverse
    // TODO: dividing a fraction: a/b / c -> a / bc
    // TODO: add an identity check for all operations
    // TODO: check removal of parens, i.e. associative property
    // TODO: handle roots and other things that don't pass the hasArgs test

    checkStep(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        context: Context,
    ): Result | void {
        const checks = [
            // basic checks
            numberCheck,
            identifierCheck,
            exactMatch,

            // axiom checks
            symmetricProperty,
            commuteAddition, // should appear before addZero
            commuteMultiplication, // should appear before mulOne
            addZero,
            mulOne,
            checkDistribution,
            // checkFactoring,
            mulByZero,

            // We do this after axiom checks so that we can include commute steps
            // first and then check if there's an exact match.  checkArgs ignores
            // ordering of args so if we ran it first we'd never see any commute
            // steps in the output.
            checkArgs,

            // equation checks
            checkAddSub,
            checkMul,
            checkDiv,

            ...(this.options.skipEvalChecker ? [] : [evalMul, evalAdd]),

            // integer checks
            addInverse,
            subIsNeg,
            mulTwoNegsIsPos,
            doubleNegative,
            negIsMulNegOne,
            moveNegToFirstFactor,

            // fraction checks
            // NOTE: these must appear after eval checks
            // TODO: add checks to avoid infinite loops so that we don't have to worry about ordering
            divByFrac,
            divBySame,
            mulByFrac,
            divIsMulByOneOver,
            checkDivisionCanceling,
        ];

        const filters = context.filters;
        const filteredChecks = filters
            ? checks.filter((check) => {
                  if (check.unfilterable) {
                      return true;
                  }
                  let result = true;
                  if (filters.allowedChecks) {
                      result = result && filters.allowedChecks.has(check.name);
                  }
                  if (filters.disallowedChecks) {
                      result =
                          result && !filters.disallowedChecks.has(check.name);
                  }
                  return result;
              })
            : checks;

        return runChecks(filteredChecks, prev, next, context);
    }
}

export default StepChecker;
