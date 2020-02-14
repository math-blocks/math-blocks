import {parse} from "@math-blocks/text-parser";

import StepChecker from "../step-checker";
import {Result} from "../types";

const checker = new StepChecker();

const checkStep = (prev: string, next: string): Result => {
    return checker.checkStep(parse(prev), parse(next), []);
};

describe("AxiomChecker", () => {
    describe("symmetricProperty", () => {
        it("a = 3 -> 3 = a", () => {
            const result = checkStep("a = 3", "3 = a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "symmetric property",
            ]);
        });

        it("a = b = c -> b = c = a", () => {
            const result = checkStep("a = b = c", "b = c = a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "symmetric property",
            ]);
        });

        it("a = 1 + 2 -> 3 = a", () => {
            const result = checkStep("a = 1 + 2", "3 = a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "symmetric property",
                "evaluation of addition",
            ]);
        });
    });

    describe("commuteAddition", () => {
        it("1 + 2 -> 2 + 1", () => {
            const result = checkStep("1 + 2", "2 + 1");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("(2 - 1) + (1 + 1) -> 2 + 1", () => {
            const result = checkStep("(2 - 1) + (1 + 1)", "2 + 1");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
                "evaluation of addition",
                "commutative property",
            ]);
        });

        // nested commutative property
        it("(1 + 2) + (a + b) -> (2 + 1) + (b + a)", () => {
            const result = checkStep("(1 + 2) + (a + b)", "(b + a) + (2 + 1)");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "commutative property",
                "commutative property",
                "commutative property",
            ]);
        });

        it("1 + 2 + 3 + 4 -> 6 [incorrect]", () => {
            const result = checkStep("1 + 2 + 3 + 4", "6");

            expect(result.equivalent).toBe(false);
        });

        // commutative property with additive identity
        it("2 + 0 -> 0 + 2", () => {
            const result = checkStep("2 + 0", "0 + 2");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("x + (a + 2) -> x + (2 + a)", () => {
            const before = "x + (a + 2)";
            const after = "x + (2 + a)";

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("x + a + 2 -> x + 2 + a", () => {
            const result = checkStep("x + a + 2", "x + 2 + a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("x + a + 2 -> a + x + 2", () => {
            const result = checkStep("x + a + 2", "a + x + 2");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("x + a + 2 -> x + 2 + b [incorrect step]", () => {
            const result = checkStep("x + a + 2", "x + 2 + b");

            expect(result.equivalent).toBe(false);
        });
    });

    describe("commuteMultiplication", () => {
        // commutative property with multiplicative identity
        it("1 * 2 -> 2 * 1", () => {
            const result = checkStep("1 * 2", "2 * 1");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("2 * 3 -> 3 * 2", () => {
            const result = checkStep("2 * 3", "3 * 2");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("(1 + 1) * (1 + 2) -> 3 * 2", () => {
            const result = checkStep("(1 + 1) * (1 + 2)", "3 * 2");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "evaluation of addition",
                "evaluation of addition",
                "commutative property",
            ]);
        });

        it("3 * 2 -> (1 + 1) * (1 + 2)", () => {
            const result = checkStep("3 * 2", "(1 + 1) * (1 + 2)");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "decompose sum",
                "decompose sum",
                "commutative property",
            ]);
        });
    });

    describe("addZero", () => {
        it("a + 0 -> a", () => {
            const result = checkStep("a + 0", "a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("a -> a + 0", () => {
            const result = checkStep("a", "a + 0");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("a + b -> a + b + 0", () => {
            const result = checkStep("a + b", "a + b + 0");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("a + b -> a + 0 + b", () => {
            const result = checkStep("a + b", "a + 0 + b");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("a + b -> b + a + 0 -> b + 0 + a", () => {
            const result = checkStep("a + b", "b + 0 + a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "addition with identity",
                "commutative property",
            ]);
        });

        it("a + b -> a + 0 + b + 0", () => {
            const result = checkStep("a + b", "a + 0 + b + 0");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("0 + (a + b) -> a + b", () => {
            const result = checkStep("0 + (a + b)", "a + b");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "addition with identity",
            ]);
        });
    });

    describe("mulOne", () => {
        it("1 * a -> a", () => {
            const result = checkStep("1 * a", "a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiplication with identity",
            ]);
        });

        it("a -> a * 1", () => {
            const result = checkStep("a", "a * 1");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiplication with identity",
            ]);
        });

        it("1 * (a * b) -> a * b", () => {
            const result = checkStep("1 * (a * b)", "a * b");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiplication with identity",
            ]);
        });

        it("a * b -> b * a * 1 -> b * 1 * a", () => {
            const result = checkStep("a * b", "b * 1 * a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiplication with identity",
                "commutative property",
            ]);
        });

        it("a * b -> a * 1 * b * 1", () => {
            const result = checkStep("a * b", "a * 1 * b * 1");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiplication with identity",
            ]);
        });
    });

    describe("checkDistribution", () => {
        it("a * (b + c) -> a * b + a * c", () => {
            const result = checkStep("a * (b + c)", "a * b + a * c");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("(b + c) * a -> b * a + c * a", () => {
            const result = checkStep("(b + c) * a", "b * a + c * a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("a * (b + c) -> a * b + c [incorrect]", () => {
            const result = checkStep("a * (b + c)", "a * b + c");

            expect(result.equivalent).toBe(false);
            expect(result.steps.map(reason => reason.message)).toEqual([]);
        });

        // TODO: make this test pass
        it.skip("2 * a * (b + c) -> 2 * a * b + 2 * a * c", () => {
            const result = checkStep(
                "2 * a * (b + c)",
                "2 * a * b + 2 * a * c",
            );

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("(a + b) * (x + y) -> (a + b) * x + (a + b) * y", () => {
            const result = checkStep(
                "(a + b) * (x + y)",
                "(a + b) * x + (a + b) * y",
            );

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("(a + b) * (x + y) -> a * (x + y) + b * (x + y)", () => {
            const result = checkStep(
                "(a + b) * (x + y)",
                "a * (x + y) + b * (x + y)",
            );

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "distribution",
            ]);
        });
    });

    describe("checkFactoring", () => {
        it("a * b + a * c -> a * (b + c)", () => {
            const result = checkStep("a * b + a * c", "a * (b + c)");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "factoring",
            ]);
        });
    });

    describe("mulByZero", () => {
        it("0 -> 0 * a", () => {
            const result = checkStep("0", "0 * a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiplication by zero",
            ]);
        });

        it("a * 0 * b -> 0", () => {
            const result = checkStep("a * 0 * b", "0");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiplication by zero",
            ]);
        });
    });
});
