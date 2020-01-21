import {parse} from "@math-blocks/text-parser";

import StepChecker, {hasArgs} from "../step-checker";
import {Result} from "../types";

const checker = new StepChecker();

const checkStep = (prev: string, next: string): Result => {
    return checker.checkStep(parse(prev), parse(next), []);
};

// TODO: create a test helper

describe("StepChecker", () => {
    describe("no change", () => {
        test("1 -> 1", () => {
            const result = checkStep("1", "1");

            expect(result.equivalent).toBe(true);
            expect(result.steps).toEqual([]);
        });

        test("a -> a", () => {
            const result = checkStep("a", "a");

            expect(result.equivalent).toBe(true);
            expect(result.steps).toEqual([]);
        });

        test("-1 -> -1", () => {
            const result = checkStep("-1", "-1");

            expect(result.equivalent).toBe(true);
            expect(result.steps).toEqual([]);
        });
    });

    describe("checkArgs", () => {
        it("should return false immediately if the number of steps are different", () => {
            jest.spyOn(checker, "checkStep");
            expect.assertions(2);

            const sum1 = parse("1 + 2 + 3");
            const sum2 = parse("1 + 2 + 3 + 4");
            if (hasArgs(sum1) && hasArgs(sum2)) {
                const result = checker.checkArgs(sum1, sum2, []);

                expect(result.equivalent).toBe(false);
                expect(checker.checkStep).not.toHaveBeenCalled();
            }
        });
    });
});
