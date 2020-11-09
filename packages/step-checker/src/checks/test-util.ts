import {parse} from "@math-blocks/text-parser";

import {checkStep as _checkStep} from "../step-checker";
import {Result, Mistake} from "../types";

export const checkStep = (
    prev: string,
    next: string,
): Result & {successfulChecks: Set<string>} => {
    const {result, successfulChecks} = _checkStep(parse(prev), parse(next));
    if (!result) {
        throw new Error("No path found");
    }
    return {
        ...result,
        successfulChecks,
    };
};

export const checkMistake = (prev: string, next: string): Mistake[] => {
    const {result, mistakes} = _checkStep(parse(prev), parse(next));
    if (!result) {
        if (mistakes.length > 0) {
            return mistakes;
        } else {
            throw new Error("No mistakes found");
        }
    }
    throw new Error("Unexpected result");
};
