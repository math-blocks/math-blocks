import * as Semantic from "@math-blocks/semantic";
import {parse} from "@math-blocks/text-parser";

import StepChecker, {hasArgs} from "../step-checker";
import {Result} from "../types";

const checker = new StepChecker();

const checkStep = (prev: string, next: string): Result => {
    return checker.checkStep(parse(prev), parse(next), {
        checker,
        steps: [],
    });
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
                const result = checker.checkArgs(sum1, sum2, {
                    checker,
                    steps: [],
                });

                expect(result.equivalent).toBe(false);
                expect(checker.checkStep).not.toHaveBeenCalled();
            }
        });
    });

    describe("difference", () => {
        it("should return an empty array if both have the same values", () => {
            const left = [Semantic.number("1"), Semantic.number("2")];
            const right = [Semantic.number("1"), Semantic.number("2")];
            const result = checker.difference(left, right, {
                checker,
                steps: [],
            });

            expect(result).toEqual([]);
        });

        it("should return the difference for unique values", () => {
            const left = [Semantic.number("1"), Semantic.number("2")];
            const right = [Semantic.number("2")];
            const result = checker.difference(left, right, {
                checker,
                steps: [],
            });

            expect(result).toEqual([left[0]]);
        });

        it("should return the original left array if there are no matches", () => {
            const left = [Semantic.number("1"), Semantic.number("2")];
            const right = [Semantic.number("3")];
            const result = checker.difference(left, right, {
                checker,
                steps: [],
            });

            expect(result).toEqual(left);
        });

        it("should return the handle duplicates", () => {
            const left = [Semantic.number("1"), Semantic.number("1")];
            const right = [Semantic.number("1")];
            const result = checker.difference(left, right, {
                checker,
                steps: [],
            });

            expect(result).toEqual([left[1]]);
        });
    });
});
