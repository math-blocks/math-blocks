import * as Semantic from "../semantic/semantic";
import * as Util from "../semantic/util";

import {IStepChecker} from "./step-checker";
import {Result, Reason} from "./types";

class EquationChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    checkAddSub(a: Semantic.Eq, b: Semantic.Eq, reasons: Reason[]): Result {
        const {checker} = this;

        const [lhsA, rhsA] = a.args;
        const [lhsB, rhsB] = b.args;

        if (lhsB.type === "add" && rhsB.type === "add") {
            const lhsNewTerms = checker.difference(
                Util.getTerms(lhsB),
                Util.getTerms(lhsA),
                reasons,
            );
            const rhsNewTerms = checker.difference(
                Util.getTerms(rhsB),
                Util.getTerms(rhsA),
                reasons,
            );
            const lhsNew = Util.addTerms(lhsNewTerms);
            const rhsNew = Util.addTerms(rhsNewTerms);
            const result = checker.checkStep(lhsNew, rhsNew, reasons);

            // TODO: handle adding multiple things to lhs and rhs as the same time
            // TODO: do we want to enforce that the thing being added is exactly
            // the same or do we want to allow equivalent expressions?
            if (result.equivalent && result.reasons.length === 0) {
                if (
                    Util.isSubtraction(lhsNewTerms[0]) &&
                    Util.isSubtraction(rhsNewTerms[0])
                ) {
                    return {
                        equivalent: true,
                        reasons: [
                            {
                                message:
                                    "subtracting the same value from both sides",
                                nodes: [],
                            },
                        ],
                    };
                }
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "adding the same value to both sides",
                            nodes: [],
                        },
                    ],
                };
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    checkMul(a: Semantic.Eq, b: Semantic.Eq, reasons: Reason[]): Result {
        const {checker} = this;

        const [lhsA, rhsA] = a.args;
        const [lhsB, rhsB] = b.args;

        if (lhsB.type === "mul" && rhsB.type === "mul") {
            const lhsNewFactors = checker.difference(
                Util.getFactors(lhsB),
                Util.getFactors(lhsA),
                reasons,
            );
            const rhsNewFactors = checker.difference(
                Util.getFactors(rhsB),
                Util.getFactors(rhsA),
                reasons,
            );
            const result = checker.checkStep(
                Util.mulFactors(lhsNewFactors),
                Util.mulFactors(rhsNewFactors),
                reasons,
            );

            // TODO: do we want to enforce that the thing being added is exactly
            // the same or do we want to allow equivalent expressions?
            if (result.equivalent && result.reasons.length === 0) {
                return {
                    equivalent: true,
                    reasons: [
                        {
                            message: "multiplying both sides by the same value",
                            nodes: [],
                        },
                    ],
                };
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    checkDiv(a: Semantic.Eq, b: Semantic.Eq, reasons: Reason[]): Result {
        const {checker} = this;

        const [lhsA, rhsA] = a.args;
        const [lhsB, rhsB] = b.args;

        if (lhsB.type === "div" && rhsB.type === "div") {
            if (
                checker.checkStep(lhsA, lhsB.args[0], reasons).equivalent &&
                checker.checkStep(rhsA, rhsB.args[0], reasons).equivalent
            ) {
                if (
                    checker.checkStep(lhsB.args[1], rhsB.args[1], reasons)
                        .equivalent
                ) {
                    return {
                        equivalent: true,
                        reasons: [
                            {
                                message:
                                    "dividing both sides by the same value",
                                nodes: [],
                            },
                        ],
                    };
                } else {
                    // TODO: custom error message for this case
                }
            }
        }
        return {
            equivalent: false,
            reasons: [],
        };
    }

    checkStep(
        a: Semantic.Expression,
        b: Semantic.Expression,
        reasons: Reason[],
    ): Result {
        if (a.type !== "eq" || b.type !== "eq") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        let result: Result;

        result = this.checkAddSub(a, b, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.checkMul(a, b, reasons);
        if (result.equivalent) {
            return result;
        }

        result = this.checkDiv(a, b, reasons);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }
}

export default EquationChecker;
