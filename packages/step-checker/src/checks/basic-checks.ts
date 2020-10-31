import {Check, Step, Status} from "../types";
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
export const checkArgs: Check = (prev, next, context) => {
    const {checker} = context;

    if (prev.type === next.type && hasArgs(prev) && hasArgs(next)) {
        const steps: Step[] = [];
        if (prev.args.length !== next.args.length) {
            return;
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
        if (equivalent) {
            return {
                status: Status.Correct,
                steps: steps,
            };
        }
    } else if (prev.type === "neg" && next.type === "neg") {
        const result = checker.checkStep(prev.arg, next.arg, context);
        if (result && prev.subtraction === next.subtraction) {
            return {
                status: Status.Correct,
                steps: result.steps,
            };
        }
    }

    return;
};
checkArgs.unfilterable = true;
