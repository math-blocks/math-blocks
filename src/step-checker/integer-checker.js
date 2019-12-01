// @flow
import * as Arithmetic from "./arithmetic.js";
import * as Semantic from "../semantic.js";

import {isNegative, isSubtraction} from "./arithmetic.js";

import type {IStepChecker, Result} from "./step-checker.js";

class IntegerChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    addInverse(prev: Semantic.Expression, next: Semantic.Expression): Result {
        const {checker} = this;
        if (prev.type !== "add") {
            return {
                equivalent: false,
                reasons: [],
            };
        }

        const indicesToRemove = new Set();
        const terms = Arithmetic.getTerms(prev);
        for (let i = 0; i < terms.length; i++) {
            for (let j = 0; j < terms.length; j++) {
                if (i === j) {
                    continue;
                }
                const a = terms[i];
                const b = terms[j];
                // TODO: add a sub-step in the subtraction case
                if (isNegative(b) || isSubtraction(b)) {
                    const result = checker.checkStep(a, b.args[0]);
                    if (result.equivalent) {
                        // TODO: capture the reasons and include them down below
                        indicesToRemove.add(i);
                        indicesToRemove.add(j);
                    }
                }
            }
        }
        if (indicesToRemove.size > 0) {
            const newPrev = Arithmetic.add(
                terms.filter((term, index) => !indicesToRemove.has(index)),
            );
            const {equivalent, reasons} = checker.checkStep(newPrev, next);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...reasons,
                        {
                            message: "adding inverse",
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

    doubleNegative(
        prev: Semantic.Expression,
        next: Semantic.Expression,
    ): Result {
        const {checker} = this;
        if (isNegative(prev) && isNegative(prev.args[0])) {
            const newPrev = prev.args[0].args[0];
            const {equivalent, reasons} = checker.checkStep(newPrev, next);
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...reasons,
                        {
                            message: "negative of a negative is positive",
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

    subIsNeg(prev: Semantic.Expression, next: Semantic.Expression): Result {
        const {checker} = this;
        if (isSubtraction(prev) && isNegative(next)) {
            const {equivalent, reasons} = checker.checkStep(
                prev.args[0],
                next.args[0],
            );
            if (equivalent) {
                return {
                    equivalent: true,
                    reasons: [
                        ...reasons,
                        {
                            message:
                                "subtracting is the same as adding the inverse",
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

    // TODO: rename these methods to differentiate the StepChecker method from
    // this method
    checkStep(a: Semantic.Expression, b: Semantic.Expression): Result {
        let result;

        result = this.addInverse(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.addInverse(b, a);
        if (result.equivalent) {
            return result;
        }

        result = this.subIsNeg(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.subIsNeg(b, a);
        if (result.equivalent) {
            return result;
        }

        result = this.doubleNegative(a, b);
        if (result.equivalent) {
            return result;
        }

        result = this.doubleNegative(b, a);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            reasons: [],
        };
    }
}

export default IntegerChecker;
