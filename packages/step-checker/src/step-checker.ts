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
    checkFactoring,
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
} from "./checks/integer-checks";
import {
    divByFrac,
    divByOne,
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

const runChecks = (
    checks: Check[],
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result | void => {
    for (const check of checks) {
        if (check.parallel) {
            const result1 = check(prev, next, context, false);
            const result2 = check(next, prev, context, true);

            if (result1 && result2) {
                if (result1.steps.length < result2.steps.length) {
                    return result1;
                } else {
                    return result2;
                }
            } else if (result1) {
                return result1;
            } else if (result2) {
                return result2;
            }
        } else {
            const result = check(prev, next, context, false);
            if (result) {
                return result;
            }

            if (check.symmetric) {
                const result = check(next, prev, context, true);
                if (result) {
                    return result;
                }
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
            checkFactoring,
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

            // fraction checks
            // NOTE: these must appear after eval checks
            // TODO: add checks to avoid infinite loops so that we don't have to worry about ordering
            divByFrac,
            divByOne,
            divBySame,
            mulByFrac,
            divIsMulByOneOver,
            checkDivisionCanceling,
        ];

        // TODO: handle roots and other things that don't pass the hasArgs test

        return runChecks(checks, prev, next, context);
    }
}

export default StepChecker;
