import {Check} from "../types";

// TODO: Implement this.
// It should handle things like: 2a + 3 + 5a + 7 -> 7a + 10
const collectLikeTerms: Check = (prev, next, context) => {
    return undefined;
};

export const runChecks: Check = (prev, next, context) => {
    const result = collectLikeTerms(prev, next, context);
    if (result) {
        return result;
    }

    return;
};