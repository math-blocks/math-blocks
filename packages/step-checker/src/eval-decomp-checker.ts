import Fraction from "fraction.js";

import * as Semantic from "@math-blocks/semantic";

import {IStepChecker, Options} from "./step-checker";
import {Result, Step} from "./types";

// Disable automatic reducing
// @ts-ignore
Fraction.REDUCE = false;

const parseNode = (node: Semantic.Expression, options: Options): Fraction => {
    if (node.type === "number") {
        return new Fraction(node.value);
    } else if (node.type === "neg") {
        return parseNode(node.arg, options).mul(new Fraction("-1"));
    } else if (node.type === "div" && options.evalFractions) {
        // TODO: add a recursive option as well
        return parseNode(node.args[0], options).div(parseNode(node.args[1], options));
    } else {
        throw new Error(`cannot parse a number from ${node.type} node`);
    }
};

enum Direction {
    EVAL,
    DECOMP,
}

class EvalDecompChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    // This handles evaluation and decomposition of addition or multiplication.
    evalDecompNaryOp(
        a: Semantic.Expression,
        b: Semantic.Expression,
        op: "add" | "mul",
        direction: Direction,
    ): Result {
        const aTerms = op === "add" ? Semantic.getTerms(a) : Semantic.getFactors(a);
        const bTerms = op === "add" ? Semantic.getTerms(b) : Semantic.getFactors(b);

        if (a.type !== op && b.type !== op) {
            return {
                equivalent: false,
                steps: [],
            };
        }

        const steps: Step[] = [];

        let i = 0;
        for (let j = 0; j < bTerms.length; j++) {
            const aTerm = aTerms[i];
            const bTerm = bTerms[j];

            if (this.checker.exactMatch(aTerm, bTerm).equivalent) {
                i++;
                continue;
            }

            try {
                // Find the first non-exact match between two numbers
                const aVal = parseNode(aTerm, this.checker.options);
                const bVal = parseNode(bTerm, this.checker.options);

                // Accumulate a sum of numeric terms from aTerms until
                // it matches bTerm's value, we run into a non-numeric
                // term, or we run out of terms
                let accumulator = aVal;
                i++;
                while (i < aTerms.length) {
                    const nextTerm = parseNode(aTerms[i++], this.checker.options);
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
                return {
                    equivalent: false,
                    steps: [],
                };
            }
        }

        if (i < aTerms.length) {
            return {
                equivalent: false,
                steps: [],
            };
        }

        if (steps.length > 0) {
            return {
                equivalent: true,
                steps,
            };
        }

        return {
            equivalent: false,
            steps: [],
        };
    }

    // This handles
    evalMul(a: Semantic.Expression, b: Semantic.Expression, steps: Step[]): Result {
        return this.evalDecompNaryOp(a, b, "mul", Direction.EVAL);
    }

    // This is unidirectional since most of the time we're adding numbers instead
    // of decomposing them.
    evalAdd(a: Semantic.Expression, b: Semantic.Expression, steps: Step[]): Result {
        return this.evalDecompNaryOp(a, b, "add", Direction.EVAL);
    }

    decompSum(a: Semantic.Expression, b: Semantic.Expression, steps: Step[]): Result {
        return this.evalDecompNaryOp(b, a, "add", Direction.DECOMP);
    }

    decompProduct(a: Semantic.Expression, b: Semantic.Expression, steps: Step[]): Result {
        return this.evalDecompNaryOp(b, a, "mul", Direction.DECOMP);
    }

    runChecks(prev: Semantic.Expression, next: Semantic.Expression, steps: Step[]): Result {
        let result: Result;

        result = this.evalMul(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.evalAdd(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.decompProduct(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.decompSum(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            steps: [],
        };
    }
}

export default EvalDecompChecker;
