import {Check, Step} from "../types";
import {FAILED_CHECK} from "../constants";
import {deepEquals, hasArgs} from "../util";

export const numberCheck: Check = (prev, next, context) => {
    if (
        prev.type === "number" &&
        next.type === "number" &&
        prev.value === next.value
    ) {
        return {
            steps: [],
        };
    }
    return FAILED_CHECK;
};
numberCheck.unfilterable = true;

export const identifierCheck: Check = (prev, next, context) => {
    if (
        prev.type === "identifier" &&
        next.type === "identifier" &&
        prev.name === next.name
    ) {
        return {
            steps: [],
        };
    }
    return FAILED_CHECK;
};
numberCheck.unfilterable = true;

export const exactMatch: Check = (prev, next, context) => {
    return deepEquals(prev, next)
        ? {
              steps: [],
          }
        : FAILED_CHECK;
};
exactMatch.unfilterable = true;

// General check if the args are equivalent for things with args
// than are an array and not a tuple.
export const checkArgs: Check = (prev, next, context) => {
    const {checker} = context;

    if (prev.type === next.type && hasArgs(prev) && hasArgs(next)) {
        const steps: Step[] = [];
        if (prev.args.length !== next.args.length) {
            return FAILED_CHECK;
        }
        const equivalent = prev.args.every((prevArg) =>
            next.args.some((nextArg) => {
                const result = checker.checkStep(prevArg, nextArg, context);
                if (result) {
                    steps.push(...result.steps);
                }
                return result;
            }),
        );
        return equivalent
            ? {
                  steps: steps,
              }
            : FAILED_CHECK;
    } else if (prev.type === "neg" && next.type === "neg") {
        const result = checker.checkStep(prev.arg, next.arg, context);
        if (result && prev.subtraction === next.subtraction) {
            return {
                steps: result.steps,
            };
        }
    }

    return FAILED_CHECK;
};
checkArgs.unfilterable = true;
