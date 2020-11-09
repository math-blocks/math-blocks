import {Status} from "../enums";
import {Check, Step} from "../types";
import {deepEquals, hasArgs} from "./util";

export const numberCheck: Check = (prev, next, context) => {
    if (
        prev.type === "number" &&
        next.type === "number" &&
        prev.value === next.value
    ) {
        return {
            status: Status.Correct,
            steps: [],
        };
    }
    return;
};
numberCheck.unfilterable = true;

export const identifierCheck: Check = (prev, next, context) => {
    if (
        prev.type === "identifier" &&
        next.type === "identifier" &&
        prev.name === next.name
    ) {
        return {
            status: Status.Correct,
            steps: [],
        };
    }
    return;
};
numberCheck.unfilterable = true;

export const exactMatch: Check = (prev, next, context) => {
    if (deepEquals(prev, next)) {
        return {
            status: Status.Correct,
            steps: [],
        };
    }
};
exactMatch.unfilterable = true;

// General check if the args are equivalent for things with args
// than are an array and not a tuple.
// TODO: filter out equation checks if prev and next are equations since equations
// can't be nested
export const checkArgs: Check = (prev, next, context) => {
    const {checker} = context;

    if (prev.type === next.type && hasArgs(prev) && hasArgs(next)) {
        const steps: Step[] = [];
        if (prev.args.length !== next.args.length) {
            return;
        }

        let remainingNextArgs = [...next.args];
        let pathExists = true;
        for (const prevArg of prev.args) {
            const index = remainingNextArgs.findIndex((nextArg) => {
                const result = checker.checkStep(prevArg, nextArg, context);
                if (result) {
                    if (result.status === Status.Correct) {
                        steps.push(...result.steps);
                        return result;
                    } else {
                        // TODO: how do we bubble up incorrect answers
                        // throw new Error(
                        //     "TODO: handle incorrect results in checkArgs",
                        // );
                    }
                }
            });

            // We continue to check the remaining args even after we find one
            // that doesn't have an equivalent next arg.  This is so that we
            // can collect all of the mistakes if there happens to be more than
            // one.
            if (index === -1) {
                pathExists = false;
            }

            // If there's a matching arg, remove it from remainingNextArgs so
            // that we don't end up matching it twice.
            remainingNextArgs = [
                ...remainingNextArgs.slice(0, index),
                ...remainingNextArgs.slice(index + 1),
            ];
        }

        if (!pathExists) {
            return;
        }

        return {
            status: Status.Correct,
            steps: steps,
        };
    } else if (prev.type === "neg" && next.type === "neg") {
        const result = checker.checkStep(prev.arg, next.arg, context);
        if (result && prev.subtraction === next.subtraction) {
            return result;
        }
    }

    return;
};
checkArgs.unfilterable = true;
