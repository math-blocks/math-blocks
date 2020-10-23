import Fraction from "fraction.js";

import * as Semantic from "@math-blocks/semantic";

import {Result, Step, Context, Options, Check} from "./types";
import {FAILED_CHECK} from "./constants";

const parseNode = (node: Semantic.Expression, options: Options): Fraction => {
    if (node.type === "number") {
        return new Fraction(node.value);
    } else if (node.type === "neg") {
        return parseNode(node.arg, options).mul(new Fraction("-1"));
    } else if (node.type === "div" && options.evalFractions) {
        // TODO: add a recursive option as well
        return parseNode(node.args[0], options).div(
            parseNode(node.args[1], options),
        );
    } else {
        throw new Error(`cannot parse a number from ${node.type} node`);
    }
};

enum Direction {
    EVAL,
    DECOMP,
}

// This handles evaluation and decomposition of addition or multiplication.
function evalDecompNaryOp(
    a: Semantic.Expression,
    b: Semantic.Expression,
    op: "add" | "mul",
    direction: Direction,
    context: Context,
): Result | void {
    const aTerms = op === "add" ? Semantic.getTerms(a) : Semantic.getFactors(a);
    const bTerms = op === "add" ? Semantic.getTerms(b) : Semantic.getFactors(b);

    if (a.type !== op && b.type !== op) {
        return FAILED_CHECK;
    }

    const steps: Step[] = [];

    let i = 0;
    for (let j = 0; j < bTerms.length; j++) {
        const aTerm = aTerms[i];
        const bTerm = bTerms[j];

        if (context.checker.exactMatch(aTerm, bTerm)) {
            i++;
            continue;
        }

        try {
            // Find the first non-exact match between two numbers
            const aVal = parseNode(aTerm, context.checker.options);
            const bVal = parseNode(bTerm, context.checker.options);

            // Accumulate a sum of numeric terms from aTerms until
            // it matches bTerm's value, we run into a non-numeric
            // term, or we run out of terms
            let accumulator = aVal;
            i++;
            while (i < aTerms.length) {
                const nextTerm = parseNode(
                    aTerms[i++],
                    context.checker.options,
                );
                accumulator.toString();
                switch (op) {
                    case "add":
                        accumulator = accumulator.add(nextTerm);
                        break;
                    case "mul":
                        accumulator = accumulator.mul(nextTerm);
                        break;
                }
                accumulator.toString();
                bVal.toString();
                if (accumulator.equals(bVal)) {
                    steps.push({
                        message:
                            op === "add"
                                ? direction === Direction.EVAL
                                    ? "evaluation of addition"
                                    : "decompose sum"
                                : direction === Direction.EVAL
                                ? "evaluation of multiplication"
                                : "decompose product",
                        // We include the whole nodes for now
                        // TODO: also specify which children we're involved in this step
                        // TODO: each step should have its own type so that we can include
                        // step specific data in the steps if necessary.
                        nodes: [a, b],
                    });
                    break;
                }
            }
        } catch (e) {
            return FAILED_CHECK;
        }
    }

    if (i < aTerms.length) {
        return FAILED_CHECK;
    }

    if (steps.length > 0) {
        return {
            steps,
        };
    }

    return FAILED_CHECK;
}

const evalMul: Check = (prev, next, context) => {
    return evalDecompNaryOp(prev, next, "mul", Direction.EVAL, context);
};

// This is unidirectional since most of the time we're adding numbers instead
// of decomposing them.
const evalAdd: Check = (prev, next, context) => {
    return evalDecompNaryOp(prev, next, "add", Direction.EVAL, context);
};

const decompSum: Check = (prev, next, context) => {
    return evalDecompNaryOp(next, prev, "add", Direction.DECOMP, context);
};

const decompProduct: Check = (prev, next, context) => {
    return evalDecompNaryOp(next, prev, "mul", Direction.DECOMP, context);
};

export const runChecks: Check = (prev, next, context) => {
    const checks = [evalMul, evalAdd, decompProduct, decompSum];

    for (const check of checks) {
        const result = check(prev, next, context);
        if (result) {
            return result;
        }
    }

    return FAILED_CHECK;
};
