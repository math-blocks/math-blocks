import * as Semantic from "@math-blocks/semantic";

import {exactMatch} from "./util";
import {Result, HasArgs, IStepChecker, Options, Context, Check} from "./types";

import * as fractionChecker from "./fraction-checker";
import * as equationChecker from "./equation-checker";
import * as integerChecker from "./integer-checker";
import * as evalChecker from "./eval-decomp-checker";
// import * as polynomialChecker from "./polynomial-checker";
import * as axiomChecker from "./axiom-checker";
import {FAILED_CHECK} from "./constants";
import {checkArgs} from "./util";

export const hasArgs = (a: Semantic.Expression): a is HasArgs =>
    a.type === "add" ||
    a.type === "mul" ||
    a.type === "eq" ||
    a.type === "neq" ||
    a.type === "lt" ||
    a.type === "lte" ||
    a.type === "gt" ||
    a.type === "gte" ||
    a.type === "div";

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
        let result: Result | void;

        result = exactMatch(prev, next);
        if (result) {
            return result;
        }

        result = axiomChecker.runChecks(prev, next, context);
        if (result) {
            return result;
        }

        // We do this after axiom checks so that we can include commute steps
        // first and then check if there's an exact match.  checkArgs ignores
        // ordering of args so if we ran it first we'd never see any commute
        // steps in the output.
        result = checkArgs(prev, next, context);
        if (result) {
            return result;
        }

        // TODO: handle roots and other things that don't pass the hasArgs test

        result = equationChecker.runChecks(prev, next, context);
        if (result) {
            return result;
        }

        if (!this.options.skipEvalChecker) {
            result = evalChecker.runChecks(prev, next, context);
            if (result) {
                return result;
            }
        }

        result = integerChecker.runChecks(prev, next, context);
        if (result) {
            return result;
        }

        // FractionChecker must appear after EvalChecker
        // TODO: add checks to avoid infinite loops so that we don't have to worry about ordering
        result = fractionChecker.runChecks(prev, next, context);
        if (result) {
            return result;
        }

        result = numberCheck(prev, next, context);
        if (result) {
            return result;
        }

        result = identifierCheck(prev, next, context);
        if (result) {
            return result;
        }

        return FAILED_CHECK;
    }
}

export default StepChecker;
