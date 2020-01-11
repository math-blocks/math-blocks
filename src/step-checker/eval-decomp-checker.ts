import Fraction from "fraction.js";

import * as Semantic from "../semantic/semantic";
import * as Util from "../semantic/util";

import {IStepChecker} from "./step-checker";
import {Result, Step} from "./types";

// Disable automatic reducing
// @ts-ignore
Fraction.REDUCE = false;

const parseNode = (node: Semantic.Expression): Fraction => {
    if (node.type === "number") {
        return new Fraction(node.value);
    } else if (node.type === "neg") {
        return parseNode(node.arg).mul(new Fraction("-1"));
    } else if (node.type === "div") {
        return parseNode(node.args[0]).div(parseNode(node.args[1]));
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
        const aTerms = op === "add" ? Util.getTerms(a) : Util.getFactors(a);
        const bTerms = op === "add" ? Util.getTerms(b) : Util.getFactors(b);

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
                const aVal = parseNode(aTerm);
                const bVal = parseNode(bTerm);

                // Accumulate a sum of numeric terms from aTerms until
                // it matches bTerm's value, we run into a non-numeric
                // term, or we run out of terms
                let accumulator = aVal;
                i++;
                while (i < aTerms.length) {
                    const nextTerm = parseNode(aTerms[i++]);
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
    evalMul(
        a: Semantic.Expression,
        b: Semantic.Expression,
        steps: Step[],
    ): Result {
        return this.evalDecompNaryOp(a, b, "mul", Direction.EVAL);
    }

    // This is unidirectional since most of the time we're adding numbers instead
    // of decomposing them.
    evalAdd(
        a: Semantic.Expression,
        b: Semantic.Expression,
        steps: Step[],
    ): Result {
        return this.evalDecompNaryOp(a, b, "add", Direction.EVAL);
    }

    decompSum(
        a: Semantic.Expression,
        b: Semantic.Expression,
        steps: Step[],
    ): Result {
        return this.evalDecompNaryOp(b, a, "add", Direction.DECOMP);
    }

    decompProduct(
        a: Semantic.Expression,
        b: Semantic.Expression,
        steps: Step[],
    ): Result {
        return this.evalDecompNaryOp(b, a, "mul", Direction.DECOMP);
    }

    runChecks(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        steps: Step[],
    ): Result {
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
