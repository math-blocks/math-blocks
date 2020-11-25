import {ParsingTypes} from "@math-blocks/semantic";

import {Check, Result, Context} from "./types";

/**
 * Returns a Check that runs all checks until one returns a result.
 *
 * @param {Check[]} checks
 * @returns {Check}
 */
export const first = (checks: Check[]): Check => (prev, next, context) => {
    for (const check of checks) {
        const result = runCheck(check, prev, next, context);
        if (result) {
            return result;
        }
    }

    return;
};

/**
 * Returns a Check that runs all checks and returns the shortest result.
 *
 * @param {Check[]} checks
 * @returns {Check}
 */
export const shortest = (checks: Check[]): Check => (prev, next, context) => {
    const results: Result[] = checks
        .map((check) => runCheck(check, prev, next, context))
        .filter(notUndefined);

    if (results.length === 0) {
        return;
    }

    let shortestResult = results[0];
    for (let i = 1; i < results.length; i++) {
        const result = results[i];
        if (result.steps.length < shortestResult.steps.length) {
            shortestResult = result;
        }
    }

    return shortestResult;
};

function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

/**
 * Run a single check.  If there's a path between prev and next return a Result.
 * If not, return undefined.
 *
 * @param {Check} check
 * @param {Expression} prev
 * @param {Expression} next
 * @param {Context} context
 */
const runCheck = (
    check: Check,
    prev: ParsingTypes.Expression,
    next: ParsingTypes.Expression,
    context: Context,
): Result | undefined => {
    // TODO: create a copy of context before calling 'check' just in case.
    const result = check(prev, next, context);
    if (result) {
        context.successfulChecks.add(check.name);
        return result;
    }

    // We can't rely on simply calling each symmetric check with a 'reversed'
    // param since some paths modify the root node multiple times.  If we
    // reverse for one of the checks then the subsequent checks in that path
    // must also be reversed.
    if (check.symmetric) {
        const result = check(next, prev, {
            ...context,
            reversed: !context.reversed,
        });
        if (result) {
            context.successfulChecks.add(check.name);
            return result;
        }
    }
};
