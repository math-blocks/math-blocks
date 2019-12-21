import * as Semantic from "../../semantic";
import {parse} from "../../text/text-parser";

import StepChecker from "../step-checker";

const checker = new StepChecker();

const checkStep = (prev: Semantic.Expression, next: Semantic.Expression) =>
    checker.checkStep(prev, next, []);

// TODO: create a test helper
// TODO: rename checkStep to isEquivalent

describe("Expressions", () => {
    describe("no change", () => {
        test("1 -> 1", () => {
            const a = parse("1");
            const b = parse("1");

            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([]);
        });

        test("a -> a", () => {
            const a = parse("a");
            const b = parse("a");

            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([]);
        });

        test("-1 -> -1", () => {
            const a = parse("-1");
            const b = parse("-1");

            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([]);
        });
    });

    it("1 + 2 -> 2 + 1", () => {
        const before = parse("1 + 2");
        const after = parse("2 + 1");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    // nested commutative property
    it("(1 + 2) + (a + b) -> (2 + 1) + (b + a)", () => {
        const before = parse("(1 + 2) + (a + b)");
        const after = parse("(b + a) + (2 + 1)");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
            "commutative property",
            "commutative property",
        ]);
    });

    // commutative property with multiplicative identity
    it("1 * 2 -> 2 * 1", () => {
        const before = parse("1 * 2");
        const after = parse("2 * 1");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    // commutative property with additive identity
    it("2 + 0 -> 0 + 2", () => {
        const before = parse("2 + 0");
        const after = parse("0 + 2");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("2 * 3 -> 3 * 2", () => {
        const before = parse("2 * 3");
        const after = parse("3 * 2");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("a = 3 -> 3 = a", () => {
        const before = parse("a = 3");
        const after = parse("3 = a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "symmetric property",
        ]);
    });

    it("x + (a + 2) -> x + (2 + a)", () => {
        const before = parse("x + (a + 2)");
        const after = parse("x + (2 + a)");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("x + a + 2 -> x + 2 + a", () => {
        const before = parse("x + a + 2");
        const after = parse("x + 2 + a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("x + a + 2 -> a + x + 2", () => {
        const before = parse("x + a + 2");
        const after = parse("a + x + 2");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("x + a + 2 -> x + 2 + b [incorrect step]", () => {
        const before = parse("x + a + 2");
        const after = parse("x + 2 + b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(false);
    });

    it("a + 0 -> a", () => {
        const before = parse("a + 0");
        const after = parse("a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a -> a + 0", () => {
        const before = parse("a");
        const after = parse("a + 0");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a + b -> a + b + 0", () => {
        const before = parse("a + b");
        const after = parse("a + b + 0");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a + b -> a + 0 + b", () => {
        const before = parse("a + b");
        const after = parse("a + 0 + b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a + b -> b + a + 0 -> b + 0 + a", () => {
        const before = parse("a + b");
        const after = parse("b + 0 + a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
            "commutative property",
        ]);
    });

    it("a + b -> a + 0 + b + 0", () => {
        const before = parse("a + b");
        const after = parse("a + 0 + b + 0");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("1 * a -> a", () => {
        const before = parse("1 * a");
        const after = parse("a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("a -> a * 1", () => {
        const before = parse("a");
        const after = parse("a * 1");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("2 * 3 -> 6", () => {
        const before = parse("2 * 3");
        const after = parse("6");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    // TODO: make the reason for this be factoring
    it("6 -> 2 * 3", () => {
        const before = parse("6");
        const after = parse("2 * 3");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    it("a * 2 * 3 -> a * 6", () => {
        const before = parse("a * 2 * 3");
        const after = parse("a * 6");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    it("2 * 3 * 4 -> 6 * 4", () => {
        const before = parse("2 * 3 * 4");
        const after = parse("6 * 4");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    it("2 + 3 -> 5", () => {
        const before = parse("2 + 3");
        const after = parse("5");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("a + 2 + 3 -> a + 5", () => {
        const before = parse("a + 2 + 3");
        const after = parse("a + 5");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("1 + 2 + 3 -> 1 + 5", () => {
        const before = parse("1 + 2 + 3");
        const after = parse("1 + 5");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("10 - 5 -> 5", () => {
        const before = parse("10 - 5");
        const after = parse("5");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("10 - 5 + 2 -> 7", () => {
        const before = parse("10 - 5 + 2");
        const after = parse("7");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("10 - 5 + 2 -> 5 + 2", () => {
        const before = parse("10 - 5 + 2");
        const after = parse("5 + 2");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("0 + (a + b) -> a + b", () => {
        const before = parse("0 + (a + b)");
        const after = parse("a + b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("1 * (a * b) -> a * b", () => {
        const before = parse("1 * (a * b)");
        const after = parse("a * b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("a * b -> b * a * 1 -> b * 1 * a", () => {
        const before = parse("a * b");
        const after = parse("b * 1 * a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
            "commutative property",
        ]);
    });

    it("a * b -> a * 1 * b * 1", () => {
        const before = parse("a * b");
        const after = parse("a * 1 * b * 1");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("0 -> 0 * a", () => {
        const before = parse("0");
        const after = parse("0 * a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication by zero",
        ]);
    });

    it("a * 0 * b -> 0", () => {
        const before = parse("a * 0 * b");
        const after = parse("0");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication by zero",
        ]);
    });

    it("a * (b + c) -> a * b + a * c", () => {
        const before = parse("a * (b + c)");
        const after = parse("a * b + a * c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("(b + c) * a -> b * a + c * a", () => {
        const before = parse("(b + c) * a");
        const after = parse("b * a + c * a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("a * (b + c) -> a * b + c [incorrect]", () => {
        const before = parse("a * (b + c)");
        const after = parse("a * b + c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(false);
        expect(result.reasons.map(reason => reason.message)).toEqual([]);
    });

    // TODO: make this test pass
    it.skip("2 * a * (b + c) -> 2 * a * b + 2 * a * c", () => {
        const before = parse("2 * a * (b + c)");
        const after = parse("2 * a * b + 2 * a * c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("(a + b) * (x + y) -> (a + b) * x + (a + b) * y", () => {
        const before = parse("(a + b) * (x + y)");
        const after = parse("(a + b) * x + (a + b) * y");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("(a + b) * (x + y) -> a * (x + y) + b * (x + y)", () => {
        const before = parse("(a + b) * (x + y)");
        const after = parse("a * (x + y) + b * (x + y)");
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("a * b + a * c -> a * (b + c)", () => {
        const before = parse("a * b + a * c");
        const after = parse("a * (b + c)");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "factoring",
        ]);
    });
});
