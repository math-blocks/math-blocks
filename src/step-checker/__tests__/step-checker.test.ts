import {parse} from "../../text/text-parser";

import StepChecker, {Result, hasArgs} from "../step-checker";

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
            expect(result.reasons).toEqual([]);
        });

        test("a -> a", () => {
            const result = checkStep("a", "a");

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([]);
        });

        test("-1 -> -1", () => {
            const result = checkStep("-1", "-1");

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([]);
        });
    });

    it("1 + 2 -> 2 + 1", () => {
        const result = checkStep("1 + 2", "2 + 1");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    // nested commutative property
    it("(1 + 2) + (a + b) -> (2 + 1) + (b + a)", () => {
        const result = checkStep("(1 + 2) + (a + b)", "(b + a) + (2 + 1)");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
            "commutative property",
            "commutative property",
        ]);
    });

    // commutative property with multiplicative identity
    it("1 * 2 -> 2 * 1", () => {
        const result = checkStep("1 * 2", "2 * 1");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    // commutative property with additive identity
    it("2 + 0 -> 0 + 2", () => {
        const result = checkStep("2 + 0", "0 + 2");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("2 * 3 -> 3 * 2", () => {
        const result = checkStep("2 * 3", "3 * 2");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("a = 3 -> 3 = a", () => {
        const result = checkStep("a = 3", "3 = a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "symmetric property",
        ]);
    });

    it("x + (a + 2) -> x + (2 + a)", () => {
        const before = "x + (a + 2)";
        const after = "x + (2 + a)";

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("x + a + 2 -> x + 2 + a", () => {
        const result = checkStep("x + a + 2", "x + 2 + a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("x + a + 2 -> a + x + 2", () => {
        const result = checkStep("x + a + 2", "a + x + 2");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("x + a + 2 -> x + 2 + b [incorrect step]", () => {
        const result = checkStep("x + a + 2", "x + 2 + b");

        expect(result.equivalent).toBe(false);
    });

    it("a + 0 -> a", () => {
        const result = checkStep("a + 0", "a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a -> a + 0", () => {
        const result = checkStep("a", "a + 0");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a + b -> a + b + 0", () => {
        const result = checkStep("a + b", "a + b + 0");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a + b -> a + 0 + b", () => {
        const result = checkStep("a + b", "a + 0 + b");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a + b -> b + a + 0 -> b + 0 + a", () => {
        const result = checkStep("a + b", "b + 0 + a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
            "commutative property",
        ]);
    });

    it("a + b -> a + 0 + b + 0", () => {
        const result = checkStep("a + b", "a + 0 + b + 0");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("1 * a -> a", () => {
        const result = checkStep("1 * a", "a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("a -> a * 1", () => {
        const result = checkStep("a", "a * 1");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("2 * 3 -> 6", () => {
        const result = checkStep("2 * 3", "6");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    // TODO: make the reason for this be factoring
    it("6 -> 2 * 3", () => {
        const result = checkStep("6", "2 * 3");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    it("a * 2 * 3 -> a * 6", () => {
        const result = checkStep("a * 2 * 3", "a * 6");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    it("2 * 3 * 4 -> 6 * 4", () => {
        const result = checkStep("2 * 3 * 4", "6 * 4");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    it("2 + 3 -> 5", () => {
        const result = checkStep("2 + 3", "5");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("a + 2 + 3 -> a + 5", () => {
        const result = checkStep("a + 2 + 3", "a + 5");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("1 + 2 + 3 -> 1 + 5", () => {
        const result = checkStep("1 + 2 + 3", "1 + 5");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("10 - 5 -> 5", () => {
        const before = "10 - 5";
        const after = "5";

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("1 - 1/3 -> 2/3", () => {
        const before = "1 - 1/3";
        const after = "2/3";

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("5 - 5/2 -> 5/2", () => {
        const before = "5 - 5/2";
        const after = "5/2";

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("10 - 5 + 2 -> 7", () => {
        const result = checkStep("10 - 5 + 2", "7");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("10 - 5 + 2 -> 5 + 2", () => {
        const result = checkStep("10 - 5 + 2", "5 + 2");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("0 + (a + b) -> a + b", () => {
        const result = checkStep("0 + (a + b)", "a + b");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("1 * (a * b) -> a * b", () => {
        const result = checkStep("1 * (a * b)", "a * b");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("a * b -> b * a * 1 -> b * 1 * a", () => {
        const result = checkStep("a * b", "b * 1 * a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
            "commutative property",
        ]);
    });

    it("a * b -> a * 1 * b * 1", () => {
        const result = checkStep("a * b", "a * 1 * b * 1");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("0 -> 0 * a", () => {
        const result = checkStep("0", "0 * a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication by zero",
        ]);
    });

    it("a * 0 * b -> 0", () => {
        const result = checkStep("a * 0 * b", "0");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication by zero",
        ]);
    });

    it("a * (b + c) -> a * b + a * c", () => {
        const result = checkStep("a * (b + c)", "a * b + a * c");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("(b + c) * a -> b * a + c * a", () => {
        const result = checkStep("(b + c) * a", "b * a + c * a");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("a * (b + c) -> a * b + c [incorrect]", () => {
        const result = checkStep("a * (b + c)", "a * b + c");

        expect(result.equivalent).toBe(false);
        expect(result.reasons.map(reason => reason.message)).toEqual([]);
    });

    // TODO: make this test pass
    it.skip("2 * a * (b + c) -> 2 * a * b + 2 * a * c", () => {
        const result = checkStep("2 * a * (b + c)", "2 * a * b + 2 * a * c");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("(a + b) * (x + y) -> (a + b) * x + (a + b) * y", () => {
        const result = checkStep(
            "(a + b) * (x + y)",
            "(a + b) * x + (a + b) * y",
        );

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("(a + b) * (x + y) -> a * (x + y) + b * (x + y)", () => {
        const result = checkStep(
            "(a + b) * (x + y)",
            "a * (x + y) + b * (x + y)",
        );

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("a * b + a * c -> a * (b + c)", () => {
        const result = checkStep("a * b + a * c", "a * (b + c)");

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "factoring",
        ]);
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
