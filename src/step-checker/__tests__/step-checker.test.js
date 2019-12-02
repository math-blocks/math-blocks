// @flow
import * as Semantic from "../../semantic.js";

import StepChecker from "../step-checker.js";

const checker = new StepChecker();

const checkStep = (prev: Semantic.Expression, next: Semantic.Expression) =>
    checker.checkStep(prev, next);

const add = (...args: Semantic.Expression[]): Semantic.Add => ({
    type: "add",
    args,
});

const mul = (...args: Semantic.Expression[]): Semantic.Mul => ({
    type: "mul",
    implicit: false,
    args,
});

const eq = (...args: Semantic.Expression[]): Semantic.Eq => ({
    type: "eq",
    args,
});

const number = (value: string): Semantic.Number => {
    if (/^[a-z]/.test(value)) {
        throw new Error("numbers can't contain letters");
    }
    return {
        type: "number",
        value,
    };
};

const ident = (name: string): Semantic.Identifier => {
    if (/^[0-9]/.test(name)) {
        throw new Error("identifiers can't start with a number");
    }
    return {
        type: "identifier",
        name,
    };
};

const sub = (arg: Semantic.Expression): Semantic.Neg => ({
    type: "neg",
    subtraction: true,
    args: [arg],
});

// TODO: create a test helper
// TODO: rename checkStep to isEquivalent

describe("Expressions", () => {
    describe("no change", () => {
        test("1 -> 1", () => {
            const a = number("1");
            const b = number("1");

            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([]);
        });

        test("a -> a", () => {
            const a = ident("a");
            const b = ident("a");

            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([]);
        });

        test("-1 -> -1", () => {
            const a = sub(number("1"));
            const b = sub(number("1"));

            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([]);
        });
    });

    it("1 + 2 -> 2 + 1", () => {
        const before = add(number("1"), number("2"));
        const after = add(number("2"), number("1"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    // nested commutative property
    it("(1 + 2) + (a + b) -> (2 + 1) + (b + a)", () => {
        const before = add(
            add(number("1"), number("2")),
            add(ident("a"), ident("b")),
        );
        const after = add(
            add(ident("b"), ident("a")),
            add(number("2"), number("1")),
        );

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
        const before = mul(number("1"), number("2"));
        const after = mul(number("2"), number("1"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    // commutative property with additive identity
    it("2 + 0 -> 0 + 2", () => {
        const before = add(number("2"), number("0"));
        const after = add(number("0"), number("2"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("2 * 3 -> 3 * 2", () => {
        const before = mul(number("3"), number("2"));
        const after = mul(number("2"), number("3"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("a = 3 -> 3 = a", () => {
        const before = eq(ident("a"), number("3"));
        const after = eq(number("3"), ident("a"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "symmetric property",
        ]);
    });

    it("x + (a + 2) -> x + (2 + a)", () => {
        const before = add(ident("x"), add(ident("a"), number("2")));
        const after = add(ident("x"), add(number("2"), ident("a")));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("x + a + 2 -> x + 2 + a", () => {
        const before = add(ident("x"), ident("a"), number("2"));
        const after = add(ident("x"), number("2"), ident("a"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("x + a + 2 -> a + x + 2", () => {
        const before = add(ident("x"), ident("a"), number("2"));
        const after = add(ident("a"), ident("x"), number("2"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("x + a + 2 -> x + 2 + b [incorrect step]", () => {
        const before = add(ident("x"), ident("a"), number("2"));
        const after = add(ident("x"), number("2"), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(false);
    });

    it("a + 0 -> a", () => {
        const before = add(ident("a"), number("0"));
        const after = ident("a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a -> a + 0", () => {
        const before = ident("a");
        const after = add(ident("a"), number("0"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a + b -> a + b + 0", () => {
        const before = add(ident("a"), ident("b"));
        const after = add(ident("a"), ident("b"), number("0"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a + b -> a + 0 + b", () => {
        const before = add(ident("a"), ident("b"));
        const after = add(ident("a"), number("0"), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("a + b -> b + a + 0 -> b + 0 + a", () => {
        const before = add(ident("a"), ident("b"));
        const after = add(ident("b"), number("0"), ident("a"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
            "commutative property",
        ]);
    });

    it("a + b -> a + 0 + b + 0", () => {
        const before = add(ident("a"), ident("b"));
        const after = add(ident("a"), number("0"), ident("b"), number("0"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("1 * a -> a", () => {
        const before = mul(ident("a"), number("1"));
        const after = ident("a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("a -> a * 1", () => {
        const before = ident("a");
        const after = mul(ident("a"), number("1"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("2 * 3 -> 6", () => {
        const before = mul(number("2"), number("3"));
        const after = number("6");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    // TODO: make the reason for this be factoring
    it("6 -> 2 * 3", () => {
        const before = number("6");
        const after = mul(number("2"), number("3"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    it("a * 2 * 3 -> a * 6", () => {
        const before = mul(number("2"), number("3"));
        const after = number("6");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    it("2 * 3 * 4 -> 6 * 4", () => {
        const before = mul(number("2"), number("3"));
        const after = number("6");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of multiplication",
        ]);
    });

    it("2 + 3 -> 5", () => {
        const before = add(number("2"), number("3"));
        const after = number("5");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("a + 2 + 3 -> a + 5", () => {
        const before = add(number("2"), number("3"));
        const after = number("5");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("1 + 2 + 3 -> 1 + 5", () => {
        const before = add(number("1"), number("2"), number("3"));
        const after = add(number("1"), number("5"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "evaluation of addition",
        ]);
    });

    it("0 + (a + b) -> a + b", () => {
        const ZERO = number("0");
        const before = add(ZERO, add(ident("a"), ident("b")));
        const after = add(ident("a"), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "addition with identity",
        ]);
    });

    it("1 * (a * b) -> a * b", () => {
        const ONE = number("1");
        const before = mul(ONE, mul(ident("a"), ident("b")));
        const after = mul(ident("a"), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("a * b -> b * a * 1 -> b * 1 * a", () => {
        const before = mul(ident("a"), ident("b"));
        const after = mul(ident("b"), number("1"), ident("a"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
            "commutative property",
        ]);
    });

    it("a * b -> a * 1 * b * 1", () => {
        const before = mul(ident("a"), ident("b"));
        const after = mul(ident("a"), number("1"), ident("b"), number("1"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication with identity",
        ]);
    });

    it("0 -> 0 * a", () => {
        const before = number("0");
        const after = mul(number("0"), ident("a"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication by zero",
        ]);
    });

    it("a * 0 * b -> 0", () => {
        const before = mul(ident("a"), number("0"), ident("b"));
        const after = number("0");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplication by zero",
        ]);
    });

    it("a * (b + c) -> a * b + a * c", () => {
        const before = mul(ident("a"), add(ident("b"), ident("c")));
        const after = add(
            mul(ident("a"), ident("b")),
            mul(ident("a"), ident("c")),
        );

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("(b + c) * a -> b * a + c * a", () => {
        const before = mul(add(ident("b"), ident("c")), ident("a"));
        const after = add(
            mul(ident("b"), ident("a")),
            mul(ident("c"), ident("a")),
        );

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("a * (b + c) -> a * b + c [incorrect]", () => {
        const before = mul(ident("a"), add(ident("b"), ident("c")));
        const after = add(mul(ident("a"), ident("b")), ident("c"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(false);
        expect(result.reasons.map(reason => reason.message)).toEqual([]);
    });

    // TODO: make this test pass
    it.skip("2 * a * (b + c) -> 2 * a * b + 2 * a * c", () => {
        const before = mul(
            number("2"),
            ident("a"),
            add(ident("b"), ident("c")),
        );
        const after = add(
            mul(number("2"), ident("a"), ident("b")),
            mul(number("2"), ident("a"), ident("c")),
        );

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("(a + b) * (x + y) -> (a + b) * x + (a + b) * y", () => {
        const before = mul(
            add(ident("a"), ident("b")),
            add(ident("x"), ident("y")),
        );
        const after = add(
            mul(add(ident("a"), ident("b")), ident("x")),
            mul(add(ident("a"), ident("b")), ident("y")),
        );

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("(a + b) * (x + y) -> a * (x + y) + b * (x + y)", () => {
        const before = mul(
            add(ident("a"), ident("b")),
            add(ident("x"), ident("y")),
        );
        const after = add(
            mul(ident("a"), add(ident("x"), ident("y"))),
            mul(ident("b"), add(ident("x"), ident("y"))),
        );

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    it("a * b + a * c -> a * (b + c)", () => {
        const before = add(
            mul(ident("a"), ident("b")),
            mul(ident("a"), ident("c")),
        );
        const after = mul(ident("a"), add(ident("b"), ident("c")));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "factoring",
        ]);
    });
});
