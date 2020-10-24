import {parse} from "@math-blocks/text-parser";

import StepChecker from "../step-checker";
import {Result} from "../types";

const checker = new StepChecker();

export const checkStep = (
    prev: string,
    next: string,
): Result & {successfulChecks: Set<string>} => {
    const successfulChecks = new Set<string>();
    const result = checker.checkStep(parse(prev), parse(next), {
        checker,
        steps: [],
        successfulChecks,
    });
    if (!result) {
        throw new Error("no path found");
    }
    return {
        ...result,
        successfulChecks,
    };
};
