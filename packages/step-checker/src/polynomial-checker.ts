import * as Semantic from "@math-blocks/semantic";

import {Context} from "./step-checker";
import {Result} from "./types";

// TODO: Implement this.
// It should handle things like: 2a + 3 + 5a + 7 -> 7a + 10
function collectLikeTerms(
    a: Semantic.Expression,
    b: Semantic.Expression,
    context: Context,
): Result {
    return {
        equivalent: false,
        steps: [],
    };
}

export function runChecks(
    prev: Semantic.Expression,
    next: Semantic.Expression,
    context: Context,
): Result {
    const result = collectLikeTerms(prev, next, context);
    if (result.equivalent) {
        return result;
    }

    return {
        equivalent: false,
        steps: [],
    };
}
