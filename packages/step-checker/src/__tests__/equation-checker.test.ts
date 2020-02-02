import {parse} from "@math-blocks/text-parser";

import StepChecker from "../step-checker";
import {Result} from "../types";

const checker = new StepChecker();

const checkStep = (prev: string, next: string): Result => {
    return checker.checkStep(parse(prev), parse(next), []);
};

describe("EquationChecker", () => {
    describe("adding the same value to both sides", () => {
        it("x = y -> x + 5 = y + 5", () => {
            const result = checkStep("x = y", "x + 5 = y + 5");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x + 5 = y + 5 -> x = y", () => {
            const result = checkStep("x + 5 = y + 5", "x = y");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "removing the same term from both sides",
            ]);
        });

        it("x = y -> 5 + x = y + 5", () => {
            const result = checkStep("x = y", "5 + x = y + 5");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x + 10 = y + 15 -> x + 10 + 5 = y + 15 + 5", () => {
            const result = checkStep(
                "x + 10 = y + 15",
                "x + 10 + 5 = y + 15 + 5",
            );

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("2x + 5 = 10 -> 2x + 5 - 5 = 10 [incorrect]", () => {
            const result = checkStep("2x + 5 = 10", "2x + 5 - 5 = 10");

            expect(result.equivalent).toBe(false);
            expect(result.steps).toEqual([]);
        });
    });

    describe("subtracting the same value from both sides", () => {
        it("x = y -> x - 5 = y - 5", () => {
            const result = checkStep("x = y", "x - 5 = y - 5");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "subtracting the same value from both sides",
            ]);
        });

        it("x - 5 = y - 5 -> x = y", () => {
            const result = checkStep("x - 5 = y - 5", "x = y");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "removing the same term from both sides",
            ]);
        });

        it("x + 10 = y + 15 -> x + 10 - 5 -> y + 15 - 5", () => {
            const result = checkStep(
                "x + 10 = y + 15",
                "x + 10 - 5 = y + 15 - 5",
            );

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "subtracting the same value from both sides",
            ]);
        });

        it("2x + 5 = 10 -> 2x + 5 - 5 = 10 - 10 [incorrect step]", () => {
            const result = checkStep("2x + 5 = 10", "2x + 5 - 5 = 10 - 10");

            expect(result.equivalent).toBe(false);
            expect(result.steps).toEqual([]);
        });
    });

    describe("multiplying both sides by the same value", () => {
        it("x = y -> x * 5 = y * 5", () => {
            const result = checkStep("x = y", "x * 5 = y * 5");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiply both sides by the same value",
            ]);
        });

        it("x * 10 = y * 15 -> x * 10 * 5 = y * 15 * 5", () => {
            const result = checkStep(
                "x * 10 = y * 15",
                "x * 10 * 5 = y * 15 * 5",
            );

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiply both sides by the same value",
            ]);
        });

        test("2(x + 2.5) = (5)2 -> x + 2.5 = 5", () => {
            const result = checkStep("2(x + 2.5) = (5)2", "x + 2.5 = 5");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "remove common factor on both sides",
            ]);
        });
    });

    describe("dividing both sides", () => {
        it("x = y -> x / 5 = y / 5", () => {
            const result = checkStep("x = y", "x / 5 = y / 5");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "divide both sides by the same value",
            ]);
        });

        it("x / 5 = y / 5 -> x = y", () => {
            const result = checkStep("x / 5 = y / 5", "x = y");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "remove division by the same amount",
            ]);
        });

        it("x = y -> x / 5 = y / 10 [incorrect step]", () => {
            const result = checkStep("x = y", "x / 5 = y / 10");

            expect(result.equivalent).toBe(false);
            expect(result.steps).toEqual([]);
        });
    });
});
