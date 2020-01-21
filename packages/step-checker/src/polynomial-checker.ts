import * as Semantic from "@math-blocks/semantic";

import {IStepChecker} from "./step-checker";
import {Result, Step} from "./types";

class PolynomialChecker {
    checker: IStepChecker;

    constructor(checker: IStepChecker) {
        this.checker = checker;
    }

    // TODO: Implement this.
    // It should handle things like: 2a + 3 + 5a + 7 -> 7a + 10
    collectLikeTerms(
        a: Semantic.Expression,
        b: Semantic.Expression,
        steps: Step[],
    ): Result {
        return {
            equivalent: false,
            steps: [],
        };
    }

    runChecks(
        prev: Semantic.Expression,
        next: Semantic.Expression,
        steps: Step[],
    ): Result {
        const result = this.collectLikeTerms(prev, next, steps);
        if (result.equivalent) {
            return result;
        }

        return {
            equivalent: false,
            steps: [],
        };
    }
}

export default PolynomialChecker;
