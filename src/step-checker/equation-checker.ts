import * as Semantic from "../semantic/semantic";
import * as Util from "../semantic/util";

import {IStepChecker} from "./step-checker";
import {Result, Step} from "./types";

class EquationChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    checkAddSub(a: Semantic.Eq, b: Semantic.Eq, steps: Step[]): Result {
        const {checker} = this;

        const [lhsA, rhsA] = a.args;
        const [lhsB, rhsB] = b.args;

        if (lhsB.type === "add" && rhsB.type === "add") {
            const lhsNewTerms = checker.difference(
                Util.getTerms(lhsB),
                Util.getTerms(lhsA),
                steps,
            );
            const rhsNewTerms = checker.difference(
                Util.getTerms(rhsB),
                Util.getTerms(rhsA),
                steps,
            );
            const lhsNew = Util.addTerms(lhsNewTerms);
            const rhsNew = Util.addTerms(rhsNewTerms);
            const result = checker.checkStep(lhsNew, rhsNew, steps);

            // TODO: handle adding multiple things to lhs and rhs as the same time
            // TODO: do we want to enforce that the thing being added is exactly
            // the same or do we want to allow equivalent expressions?
            if (result.equivalent && result.steps.length === 0) {
                if (
                    Util.isSubtraction(lhsNewTerms[0]) &&
                    Util.isSubtraction(rhsNewTerms[0])
                ) {
                    return {
                        equivalent: true,
                        steps: [
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
                    steps: [
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
            steps: [],
        };
    }

    checkMul(a: Semantic.Eq, b: Semantic.Eq, steps: Step[]): Result {
        const {checker} = this;

        const [lhsA, rhsA] = a.args;
        const [lhsB, rhsB] = b.args;

        if (lhsB.type === "mul" && rhsB.type === "mul") {
            const lhsNewFactors = checker.difference(
                Util.getFactors(lhsB),
                Util.getFactors(lhsA),
                steps,
            );
            const rhsNewFactors = checker.difference(
                Util.getFactors(rhsB),
                Util.getFactors(rhsA),
                steps,
            );
            const result = checker.checkStep(
                Util.mulFactors(lhsNewFactors),
                Util.mulFactors(rhsNewFactors),
                steps,
            );

            // TODO: do we want to enforce that the thing being added is exactly
            // the same or do we want to allow equivalent expressions?
            if (result.equivalent && result.steps.length === 0) {
                return {
                    equivalent: true,
                    steps: [
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
            steps: [],
        };
    }

    checkDiv(a: Semantic.Eq, b: Semantic.Eq, steps: Step[]): Result {
        const {checker} = this;

        const [lhsA, rhsA] = a.args;
        const [lhsB, rhsB] = b.args;

        if (lhsB.type === "div" && rhsB.type === "div") {
            if (
                checker.checkStep(lhsA, lhsB.args[0], steps).equivalent &&
                checker.checkStep(rhsA, rhsB.args[0], steps).equivalent
            ) {
                if (
                    checker.checkStep(lhsB.args[1], rhsB.args[1], steps)
                        .equivalent
                ) {
                    return {
                        equivalent: true,
                        steps: [
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
            steps: [],
        };
    }

    checkStep(
        a: Semantic.Expression,
        b: Semantic.Expression,
        steps: Step[],
    ): Result {
        if (a.type !== "eq" || b.type !== "eq") {
            return {
                equivalent: false,
                steps: [],
            };
        }

        let result: Result;

        result = this.checkAddSub(a, b, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.checkMul(a, b, steps);
        if (result.equivalent) {
            return result;
        }

        result = this.checkDiv(a, b, steps);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            steps: [],
        };
    }
}

export default EquationChecker;
