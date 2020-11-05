import {parse} from "@math-blocks/text-parser";

import StepChecker from "../step-checker";
import {Context, Result, Mistake} from "../types";

const checker = new StepChecker();

export const checkStep = (
    prev: string,
    next: string,
): Result & {successfulChecks: Set<string>} => {
    const successfulChecks = new Set<string>();
    const context = {
        checker,
        steps: [],
        successfulChecks,
        reversed: false,
        mistakes: [],
    };
    const result = checker.checkStep(parse(prev), parse(next), context);
    if (!result) {
        throw new Error("No path found");
    }
    return {
        ...result,
        successfulChecks,
    };
};

// Mistakes that appear earlier in this list are given priority.
const MISTAKE_MESSAGES = [
    // Equation mistakes
    "different values were added to both sides",
    "different values were multiplied on both sides",

    // Expression mistakes
    "adding a non-identity valid is not allowed",
    "multiplying a non-identity valid is not allowed",
];

export const checkMistake = (prev: string, next: string): Mistake => {
    const successfulChecks = new Set<string>();
    const context: Context = {
        checker,
        steps: [],
        successfulChecks,
        reversed: false,
        mistakes: [],
    };
    const result = checker.checkStep(parse(prev), parse(next), context);
    if (!result) {
        if (context.mistakes.length > 0) {
            let mistake = context.mistakes[0];
            let index = MISTAKE_MESSAGES.indexOf(mistake.message);

            for (let i = 0; i < context.mistakes.length; i++) {
                const currentMistake = context.mistakes[i];

                if (index > MISTAKE_MESSAGES.indexOf(currentMistake.message)) {
                    index = i;
                    mistake = currentMistake;
                }
            }

            // TODO: figure out how to how report multiple mistakes
            return mistake;
        } else {
            throw new Error("No mistakes found");
        }
    }
    throw new Error("Unexpected result");
};
