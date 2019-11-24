// @flow
import * as Semantic from "../semantic.js";
import {checkStep} from "../step-checker.js";

const add = (...args: Semantic.Expression[]): Semantic.Add => ({
    type: "add",
    args,
});

const mul = (...args: Semantic.Expression[]): Semantic.Mul => ({
    type: "mul",
    implicit: false,
    args,
});

const div = (
    numerator: Semantic.Expression,
    denominator: Semantic.Expression,
): Semantic.Div => ({
    type: "div",
    args: [numerator, denominator],
});

const eq = (...args: Semantic.Expression[]): Semantic.Eq => ({
    type: "eq",
    args,
});

const number = (value: string): Semantic.Number => ({
    type: "number",
    value,
});

const ident = (name: string): Semantic.Identifier => {
    if (/^[0-9]/.test(name)) {
        throw new Error("identifiers can't start with a number");
    }
    return {
        type: "identifier",
        name,
    };
};

const neg = (arg: Semantic.Expression): Semantic.Neg => ({
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

            const reasons = [];
            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([]);
        });

        test("a -> a", () => {
            const a = ident("a");
            const b = ident("a");

            const reasons = [];
            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([]);
        });

        test("-1 -> -1", () => {
            const a = neg(number("1"));
            const b = neg(number("1"));

            const reasons = [];
            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([]);
        });
    });

    it("1 + 2 -> 2 + 1", () => {
        const before = add(number("1"), number("2"));
        const after = add(number("2"), number("1"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["commutative property"]);
    });

    it("1 * 2 -> 2 * 1", () => {
        const before = mul(number("1"), number("2"));
        const after = mul(number("2"), number("1"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["commutative property"]);
    });

    it("a = 3 -> 3 = a", () => {
        const before = eq(ident("a"), number("3"));
        const after = eq(number("3"), ident("a"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["symmetric property"]);
    });

    it("x + (a + 2) -> x + (2 + a)", () => {
        const before = add(ident("x"), add(ident("a"), number("2")));
        const after = add(ident("x"), add(number("2"), ident("a")));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["commutative property"]);
    });

    it("x + a + 2 -> x + 2 + a", () => {
        const before = add(ident("x"), ident("a"), number("2"));
        const after = add(ident("x"), number("2"), ident("a"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["commutative property"]);
    });

    it("x + a + 2 -> a + x + 2", () => {
        const before = add(ident("x"), ident("a"), number("2"));
        const after = add(ident("a"), ident("x"), number("2"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["commutative property"]);
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
        expect(result.reasons).toEqual(["addition with identity"]);
    });

    it("a -> a + 0", () => {
        const before = ident("a");
        const after = add(ident("a"), number("0"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["addition with identity"]);
    });

    it("a + b -> a + b + 0", () => {
        const before = add(ident("a"), ident("b"));
        const after = add(ident("a"), ident("b"), number("0"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["addition with identity"]);
    });

    it("a + b -> a + 0 + b", () => {
        const before = add(ident("a"), ident("b"));
        const after = add(ident("a"), number("0"), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["addition with identity"]);
    });

    it("a + b -> a + 0 + b + 0", () => {
        const before = add(ident("a"), ident("b"));
        const after = add(ident("a"), number("0"), ident("b"), number("0"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["addition with identity"]);
    });

    it("1 * a -> a", () => {
        const before = mul(ident("a"), number("1"));
        const after = ident("a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["multiplication with identity"]);
    });

    it("a -> a * 1", () => {
        const before = ident("a");
        const after = mul(ident("a"), number("1"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["multiplication with identity"]);
    });

    it("1 -> a/a", () => {
        const before = number("1");
        const after = div(ident("a"), ident("a"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["division by the same value"]);
    });

    it("a -> a * b/b", () => {
        const before = ident("a");
        const after = mul(ident("a"), div(ident("b"), ident("b")));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["multiplication with identity"]);
    });

    it("a -> a / 1", () => {
        const before = ident("a");
        const after = div(ident("a"), number("1"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["division by one"]);
    });

    it("a * b -> a * 1 * b * 1", () => {
        const before = mul(ident("a"), ident("b"));
        const after = mul(ident("a"), number("1"), ident("b"), number("1"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["multiplication with identity"]);
    });

    it("a * 0 * b -> 0", () => {
        const before = mul(ident("a"), number("0"), ident("b"));
        const after = number("0");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["multiplication by zero"]);
    });

    it("a * (b + c) -> a * b + a * c", () => {
        const before = mul(ident("a"), add(ident("b"), ident("c")));
        const after = add(
            mul(ident("a"), ident("b")),
            mul(ident("a"), ident("c")),
        );

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["distribution"]);
    });

    it("a * (b + c) -> a * b + c [incorrect]", () => {
        const before = mul(ident("a"), add(ident("b"), ident("c")));
        const after = add(mul(ident("a"), ident("b")), ident("c"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(false);
        expect(result.reasons).toEqual([]);
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
        expect(result.reasons).toEqual(["distribution"]);
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
        expect(result.reasons).toEqual(["distribution"]);
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
        expect(result.reasons).toEqual(["distribution"]);
    });

    it("a * b + a * c -> a * (b + c)", () => {
        const before = add(
            mul(ident("a"), ident("b")),
            mul(ident("a"), ident("c")),
        );
        const after = mul(ident("a"), add(ident("b"), ident("c")));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons).toEqual(["factoring"]);
    });
});

describe("Equations", () => {
    describe("adding the same value to both sides", () => {
        it("x = y -> x + 5 = y + 5", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                add(ident("x"), number("5")),
                add(ident("y"), number("5")),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x = y -> 5 + x = y + 5", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                add(number("5"), ident("x")),
                add(ident("y"), number("5")),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x + 10 = y + 15 -> x + 10 + 5 = y + 15 + 5", () => {
            const before = eq(
                add(ident("x"), number("10")),
                add(ident("y"), number("15")),
            );
            const after = eq(
                add(ident("x"), number("10"), number("5")),
                add(ident("y"), number("15"), number("5")),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([
                "adding the same value to both sides",
            ]);
        });
    });

    describe("subtracting the same value from both sides", () => {
        it("x = y -> x - 5 = y - 5", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                add(ident("x"), neg(number("5"))),
                add(ident("y"), neg(number("5"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([
                "subtracting the same value from both sides",
            ]);
        });

        it("x + 10 = y + 15 -> x + 10 - 5 -> y + 15 - 5", () => {
            const before = eq(
                add(ident("x"), number("10")),
                add(ident("y"), number("15")),
            );
            const after = eq(
                add(ident("x"), number("10"), neg(number("5"))),
                add(ident("y"), number("15"), neg(number("5"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([
                "subtracting the same value from both sides",
            ]);
        });
    });

    describe("multiplying both sides by the same value", () => {
        it("should work when each side is an atom", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                mul(ident("x"), neg(number("5"))),
                mul(ident("y"), neg(number("5"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([
                "multiplying both sides by the same value",
            ]);
        });

        it("should work when each side is an mul node", () => {
            const before = eq(
                mul(ident("x"), number("10")),
                mul(ident("y"), number("15")),
            );
            const after = eq(
                mul(ident("x"), number("10"), neg(number("5"))),
                mul(ident("y"), number("15"), neg(number("5"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([
                "multiplying both sides by the same value",
            ]);
        });
    });

    describe("dividing both sides", () => {
        it("should work when each side is an atom", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                div(ident("x"), neg(number("5"))),
                div(ident("y"), neg(number("5"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons).toEqual([
                "dividing both sides by the same value",
            ]);
        });

        it("x = y -> x / 5 = y / 10 [incorrect step]", () => {
            const before = eq(ident("x"), ident("y"));
            const after = eq(
                div(ident("x"), neg(number("5"))),
                div(ident("y"), neg(number("10"))),
            );

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(false);
        });
    });
});
