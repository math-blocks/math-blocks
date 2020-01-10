import {parse} from "../../text/text-parser";

import StepChecker from "../step-checker";
import {Result} from "../types";

const checker = new StepChecker();

const checkStep = (prev: string, next: string): Result => {
    return checker.checkStep(parse(prev), parse(next), []);
};

describe("EvalChecker", () => {
    describe("evalAdd", () => {
        it("2 + 3 -> 5", () => {
            const result = checkStep("2 + 3", "5");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
            ]);
        });

        it("a + 2 + 3 -> a + 5", () => {
            const result = checkStep("a + 2 + 3", "a + 5");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
            ]);
        });

        it("1 + 2 + 3 -> 1 + 5", () => {
            const result = checkStep("1 + 2 + 3", "1 + 5");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
            ]);
        });

        // Currently we're thinking about this in the following way:
        // 1 + 2 + 4 -> 7, 3 -> 3
        // A student though should be adding things that are adjacent
        // If they aren't adjacent, there should be a commutative property step
        it("1 + 2 + 3 + 4 -> 3 + 7", () => {
            const result = checkStep("1 + 2 + 3 + 4", "3 + 7");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
                "evaluation of addition",
            ]);
        });

        // TODO: the reason should be "evaluation of subtraction"
        it("10 - 5 -> 5", () => {
            const before = "10 - 5";
            const after = "5";

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
            ]);
        });

        // TODO: the reason should be "evaluation of subtraction"
        it("1 - 1/3 -> 2/3", () => {
            const before = "1 - 1/3";
            const after = "2/3";

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
            ]);
        });

        it("5 - 5/2 -> 5/2", () => {
            const before = "5 - 5/2";
            const after = "5/2";

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
            ]);
        });

        it("10 - 5 + 2 -> 7", () => {
            const result = checkStep("10 - 5 + 2", "7");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
            ]);
        });

        it("10 - 5 + 2 -> 5 + 2", () => {
            const result = checkStep("10 - 5 + 2", "5 + 2");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
            ]);
        });
    });

    describe("evalMul", () => {
        it("2 * 3 -> 6", () => {
            const result = checkStep("2 * 3", "6");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of multiplication",
            ]);
        });

        it("a * 2 * 3 -> a * 6", () => {
            const result = checkStep("a * 2 * 3", "a * 6");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of multiplication",
            ]);
        });

        it("2 * 3 * 4 -> 6 * 4", () => {
            const result = checkStep("2 * 3 * 4", "6 * 4");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of multiplication",
            ]);
        });

        it("1/2 * 1/3 -> 1/6", () => {
            const result = checkStep("1/2 * 1/3", "1/6");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of multiplication",
            ]);
        });

        it("2 * 1/3 -> 2/3", () => {
            const result = checkStep("2 * 1/3", "2/3");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of multiplication",
            ]);
        });

        it("2/3 * 3/4 -> 6/12", () => {
            const result = checkStep("2/3 * 3/4", "6/12");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of multiplication",
            ]);
        });

        // TODO: provide a separate step simplifying the fraction
        it("2/3 * 3/4 -> 1/2", () => {
            const result = checkStep("2/3 * 3/4", "1/2");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of multiplication",
            ]);
        });
    });

    describe("decompProduct", () => {
        it("6 -> 2 * 3", () => {
            const result = checkStep("6", "2 * 3");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "decompose product",
            ]);
        });

        it("6a -> 2 * 3 * a", () => {
            const result = checkStep("6a", "2 * 3 * a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "decompose product",
            ]);
        });

        it("4 * 6 -> 2 * 2 * 2 * 3", () => {
            const result = checkStep("4 * 6", "2 * 2 * 2 * 3");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "decompose product",
                "decompose product",
            ]);
        });
    });

    describe("decompSum", () => {
        it("5 -> 2 + 3", () => {
            const result = checkStep("5", "2 + 3");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "decompose sum",
            ]);
        });

        it("5 + a -> 2 + 3 + a", () => {
            const result = checkStep("5 + a", "2 + 3 + a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "decompose sum",
            ]);
        });

        it("5 + 10 -> 2 + 3 + 4 + 6", () => {
            const result = checkStep("5 + 10", "2 + 3 + 4 + 5");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "decompose sum",
            ]);
        });

        // We require the student to commute 10 + 5 to 5 + 10 before decomposition
        // In practice this shouldn't come up very often so let's defer doing anything
        // about it.
        it("10 + 5 -> 2 + 3 + 4 + 6 [incorrect]", () => {
            const result = checkStep("10 + 5", "2 + 3 + 4 + 5");

            expect(result.equivalent).toBe(false);
        });
    });
});
