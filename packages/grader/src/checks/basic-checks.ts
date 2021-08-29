import * as Semantic from "@math-blocks/semantic";
import type {Step} from "@math-blocks/step-utils";

import type {Check, Result, Mistake, Context} from "../types";

export const numberCheck: Check = (prev, next, context): Result | undefined => {
    if (
        prev.type === "number" &&
        next.type === "number" &&
        prev.value === next.value
    ) {
        return {
            steps: [],
        };
    }
    return;
};

export const identifierCheck: Check = (
    prev,
    next,
    context,
): Result | undefined => {
    if (
        prev.type === "Identifier" &&
        next.type === "Identifier" &&
        prev.name === next.name
    ) {
        return {
            steps: [],
        };
    }
    return;
};

export const exactMatch: Check = (prev, next, context): Result | undefined => {
    if (Semantic.util.deepEquals(prev, next)) {
        return {
            steps: [],
        };
    }
};

// General check if the args are equivalent for things with args
// than are an array and not a tuple.
// TODO: filter out equation checks if prev and next are equations since equations
// can't be nested
export const checkArgs: Check = (prev, next, context): Result | undefined => {
    const {checker} = context;

    if (
        prev.type === next.type &&
        Semantic.util.hasArgs(prev) &&
        Semantic.util.hasArgs(next)
    ) {
        const steps: Step[] = [];
        if (prev.args.length !== next.args.length) {
            return;
        }

        let remainingNextArgs = [...next.args];
        let pathExists = true;

        // Start with any mistakes that have already been reported.
        const realMistakes: Mistake[] = context.mistakes ?? [];

        for (const prevArg of prev.args) {
            const mistakes: Mistake[] = [];
            const newContext: Context = {
                ...context,
                // Continue not reporting mistakes if that's what the caller
                // of checkArgs wanted us to do.
                mistakes: context.mistakes ? mistakes : undefined,
            };
            const index = remainingNextArgs.findIndex((nextArg) => {
                const result = checker.checkStep(prevArg, nextArg, newContext);
                if (result) {
                    steps.push(...result.steps);
                    return result;
                }
            });

            // We continue to check the remaining args even after we find one
            // that doesn't have an equivalent next arg.  This is so that we
            // can report all of the mistakes if there happens to be more than
            // one.
            if (index === -1) {
                pathExists = false;
                // Only report mistakes when there is no path.
                realMistakes.push(...mistakes);
            }

            // If there's a matching arg, remove it from remainingNextArgs so
            // that we don't end up matching it twice.
            remainingNextArgs = [
                ...remainingNextArgs.slice(0, index),
                ...remainingNextArgs.slice(index + 1),
            ];
        }

        if (!pathExists) {
            // Update the context object so that the mistakes get reported back
            // up the call stack.
            if (context.mistakes) {
                context.mistakes = realMistakes;
            }
            return;
        }

        return {
            steps: steps,
        };
    } else if (prev.type === "neg" && next.type === "neg") {
        const result = checker.checkStep(prev.arg, next.arg, context);
        if (result && prev.subtraction === next.subtraction) {
            return result;
        }
    } else if (prev.type === "pow" && next.type === "pow") {
        const baseResult = checker.checkStep(prev.base, next.base, context);
        const expResult = checker.checkStep(prev.exp, next.exp, context);

        // TODO: report mistakes

        if (baseResult && expResult) {
            // TODO: file a ticket about where errors are reported for returns
            // that don't match the expected type.
            return {
                steps: [...baseResult.steps, ...expResult.steps],
            };
        }
    }

    return;
};
