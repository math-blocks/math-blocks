import {parse} from "@math-blocks/text-parser";

import StepChecker from "../step-checker";
import {Result} from "../types";

const checker = new StepChecker();

const checkStep = (prev: string, next: string): Result => {
    const result = checker.checkStep(parse(prev), parse(next), {
        checker,
        steps: [],
    });
    if (!result) {
        return {
            steps: [],
        };
    }
    return result;
};

// TODO: create a test helper

describe("StepChecker", () => {
    describe("no change", () => {
        test("1 -> 1", () => {
            const result = checkStep("1", "1");

            expect(result).toBeTruthy();
            expect(result.steps).toEqual([]);
        });

        test("a -> a", () => {
            const result = checkStep("a", "a");

            expect(result).toBeTruthy();
            expect(result.steps).toEqual([]);
        });

        test("-1 -> -1", () => {
            const result = checkStep("-1", "-1");

            expect(result).toBeTruthy();
            expect(result.steps).toEqual([]);
        });
    });
});
