import * as Semantic from "@math-blocks/semantic";

import {deepEquals} from "./util";
import {Result, Step, HasArgs, IStepChecker, Options, Context} from "./types";

import * as fractionChecker from "./fraction-checker";
import * as equationChecker from "./equation-checker";
import * as integerChecker from "./integer-checker";
import * as evalChecker from "./eval-decomp-checker";
// import * as polynomialChecker from "./polynomial-checker";
import * as axiomChecker from "./axiom-checker";

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

    /**
     * checkArgs will return true if each node has the same args even if the
     * order doesn't match.
     */
    checkArgs<T extends HasArgs>(prev: T, next: T, context: Context): Result {
        const _reasons: Step[] = [];
        if (prev.args.length !== next.args.length) {
            return {
                equivalent: false,
                steps: [],
            };
        }
        const equivalent = prev.args.every((prevArg) =>
            next.args.some((nextArg) => {
                const result = this.checkStep(prevArg, nextArg, context);
                if (result.equivalent) {
                    _reasons.push(...result.steps);
                }
                return result.equivalent;
            }),
        );
        return {
            equivalent,
            steps: _reasons,
        };
    }

    /**
     * Returns all of the elements that appear in both as and bs.
     */
    intersection(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        context: Context,
    ): Semantic.Expression[] {
        const result: Semantic.Expression[] = [];
        for (const a of as) {
            const index = bs.findIndex(
                (b) => this.checkStep(a, b, context).equivalent,
            );
            if (index !== -1) {
                result.push(a);
                bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
            }
        }
        return result;
    }

    /**
     * Returns all of the elements that appear in as but not in bs.
     */
    difference(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        context: Context,
    ): Semantic.Expression[] {
        const result: Semantic.Expression[] = [];
        for (const a of as) {
            const index = bs.findIndex(
                (b) => this.checkStep(a, b, context).equivalent,
            );
            if (index !== -1) {
                bs = [...bs.slice(0, index), ...bs.slice(index + 1)];
            } else {
                result.push(a);
            }
        }
        return result;
    }

    /**
     * Returns true if all every element in as is equivalent to an element in bs
     * and vice versa.
     */
    equality(
        as: Semantic.Expression[],
        bs: Semantic.Expression[],
        context: Context,
    ): boolean {
        return as.every((a) =>
            bs.some((b) => this.checkStep(a, b, context).equivalent),
        );
    }

    exactMatch(prev: Semantic.Expression, next: Semantic.Expression): Result {
        return {
            equivalent: deepEquals(prev, next),
            steps: [],
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
    ): Result {
        let result: Result;

        result = this.exactMatch(prev, next);
        if (result.equivalent) {
            return result;
        }

        result = axiomChecker.runChecks(prev, next, context);
        if (result.equivalent) {
            return result;
        }

        // General check if the args are equivalent for things with args
        // than are an array and not a tuple.
        //
        // We do this after axiom checks so that we can include commute steps
        // first and then check if there's an exact match.  checkArgs ignores
        // ordering of args so if we ran it first we'd never see any commute
        // steps in the output.
        if (prev.type === next.type && hasArgs(prev) && hasArgs(next)) {
            result = this.checkArgs(prev, next, context);
            if (result.equivalent) {
                return result;
            }
        } else if (prev.type === "neg" && next.type === "neg") {
            let result = this.checkStep(prev.arg, next.arg, context);
            result = {
                equivalent:
                    prev.subtraction === next.subtraction && result.equivalent,
                steps:
                    prev.subtraction === next.subtraction && result.equivalent
                        ? result.steps
                        : [],
            };
            if (result.equivalent) {
                return result;
            }
        }
        // TODO: handle roots and other things that don't pass the hasArgs test

        result = equationChecker.runChecks(prev, next, context);
        if (result.equivalent) {
            return result;
        }

        if (!this.options.skipEvalChecker) {
            result = evalChecker.runChecks(prev, next, context);
            if (result.equivalent) {
                return result;
            }
        }

        result = integerChecker.runChecks(prev, next, context);
        if (result.equivalent) {
            return result;
        }

        // FractionChecker must appear after EvalChecker
        // TODO: add checks to avoid infinite loops so that we don't have to worry about ordering
        result = fractionChecker.runChecks(prev, next, context);
        if (result.equivalent) {
            return result;
        }

        if (prev.type === "number" && next.type === "number") {
            return {
                equivalent: prev.value === next.value,
                steps: [],
            };
        } else if (prev.type === "identifier" && next.type === "identifier") {
            return {
                equivalent: prev.name === next.name,
                steps: [],
            };
        }

        return {
            equivalent: false,
            steps: [],
        };
    }
}

export default StepChecker;
