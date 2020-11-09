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

const MISTAKE_PRIORITIES = {
    // Equation mistakes
    "different values were added to both sides": 10,
    "different values were multiplied on both sides": 10,

    // Expression mistakes
    "adding a non-identity valid is not allowed": 5,
    "multiplying a non-identity valid is not allowed": 5,
};

export const checkMistake = (prev: string, next: string): Mistake[] => {
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
        // Deduplicate mistakes based on the message and matching node ids
        const uniqueMistakes: Mistake[] = [];
        for (const mistake of context.mistakes) {
            if (
                !uniqueMistakes.find((um) => {
                    if (
                        um.message === mistake.message &&
                        um.nodes.length === mistake.nodes.length
                    ) {
                        const umIds = um.nodes.map((node) => node.id);
                        const mIds = mistake.nodes.map((node) => node.id);
                        return umIds.every((id, index) => id === mIds[index]);
                    }
                    return false;
                })
            ) {
                uniqueMistakes.push(mistake);
            }
        }

        // Find the highest priority mistake filter out all mistakes with a
        // lower priority
        if (uniqueMistakes.length > 0) {
            const priorities = uniqueMistakes.map((mistake) => {
                // @ts-ignore: properly type mistakes using an enum instead of strings
                return MISTAKE_PRIORITIES[mistake.message];
            });
            const maxPriority = Math.max(...priorities);
            const maxPriorityMistakes = uniqueMistakes.filter((mistake) => {
                // @ts-ignore: properly type mistakes using an enum instead of strings
                return MISTAKE_PRIORITIES[mistake.message] === maxPriority;
            });
            return maxPriorityMistakes;
        } else {
            throw new Error("No mistakes found");
        }
    }
    throw new Error("Unexpected result");
};
