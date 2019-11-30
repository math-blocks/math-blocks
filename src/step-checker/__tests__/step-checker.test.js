// @flow
import * as Semantic from "../../semantic.js";
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
            expect(result.reasons.map(reason => reason.message)).toEqual([]);
        });

        test("a -> a", () => {
            const a = ident("a");
            const b = ident("a");

            const reasons = [];
            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([]);
        });

        test("-1 -> -1", () => {
            const a = neg(number("1"));
            const b = neg(number("1"));

            const reasons = [];
            const result = checkStep(a, b);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([]);
        });
    });

    it("1 + 2 -> 2 + 1", () => {
        const before = add(number("1"), number("2"));
        const after = add(number("2"), number("1"));

        const reasons = [];
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

        const reasons = [];
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

        const reasons = [];
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

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("2 * 3 -> 3 * 2", () => {
        const before = mul(number("3"), number("2"));
        const after = mul(number("2"), number("3"));

        const reasons = [];
        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "commutative property",
        ]);
    });

    it("a = 3 -> 3 = a", () => {
        const before = eq(ident("a"), number("3"));
        const after = eq(number("3"), ident("a"));

        const reasons = [];
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

    it("1 -> a/a", () => {
        const before = number("1");
        const after = div(ident("a"), ident("a"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "division by the same value",
        ]);
    });

    it("a/b * c/d -> ac / bd", () => {
        const before = mul(
            div(ident("a"), ident("b")),
            div(ident("c"), ident("d")),
        );
        const after = div(
            mul(ident("a"), ident("c")),
            mul(ident("b"), ident("d")),
        );

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("ac / bd -> a/b * c/d", () => {
        const before = div(
            mul(ident("a"), ident("c")),
            mul(ident("b"), ident("d")),
        );
        const after = mul(
            div(ident("a"), ident("b")),
            div(ident("c"), ident("d")),
        );

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("ab/cd * e/f -> abe / cdf", () => {
        const before = mul(
            div(mul(ident("a"), ident("b")), mul(ident("c"), ident("d"))),
            div(ident("e"), ident("f")),
        );
        const after = div(
            mul(ident("a"), ident("b"), ident("e")),
            mul(ident("c"), ident("d"), ident("f")),
        );

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("a/b * 1/d -> a*1 / bd -> a / bd", () => {
        const before = mul(
            div(ident("a"), ident("b")),
            div(number("1"), ident("d")),
        );
        const after = div(ident("a"), mul(ident("b"), ident("d")));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
            "multiplication with identity",
        ]);
    });

    it("1/a * 1/b -> 1*1 / a*b -> 1 / ab", () => {
        const before = mul(
            div(number("1"), ident("a")),
            div(number("1"), ident("b")),
        );
        const after = div(number("1"), mul(ident("a"), ident("b")));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
            "multiplication with identity",
        ]);
    });

    it("a * 1/b -> a*1 / b -> a / b", () => {
        const before = mul(ident("a"), div(number("1"), ident("b")));
        const after = div(ident("a"), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
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

    it("30 / 6 -> 2*3*5 / 2*3 -> 2*3/2*3 * 5/1 -> 1 * 5/1 -> 5/1 -> 5", () => {
        const before = div(number("30"), number("6"));
        const after = number("5");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "prime factorization",
            "canceling factors in division",
            "division by the same value",
            "multiplication with identity",
            "division by one",
            "division by one", // TODO: figure out why we have an extra reason here
        ]);
    });

    it("24 / 6 -> 2*2*2*3 / 2*3 -> 2*3/2*3 * 2*2/1 -> 1 * 2*2/1 -> 2*2/1 -> 4/1 -> 4", () => {
        const before = div(number("24"), number("6"));
        const after = number("4");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "prime factorization",
            "canceling factors in division",
            "division by the same value",
            "multiplication with identity",
            "division by one",
            "division by one", // TODO: figure out why we have an extra reason here
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

    describe("reciprocals", () => {
        it("a / b/c -> a * c/b", () => {
            const before = div(ident("a"), div(ident("b"), ident("c")));
            const after = mul(ident("a"), div(ident("c"), ident("b")));

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplying fractions",
                "multiplying fractions",
            ]);
        });

        it("1 / a/b -> b / a", () => {
            const before = div(number("1"), div(ident("a"), ident("b")));
            const after = div(ident("b"), ident("a"));

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplication with identity",
            ]);
        });

        it("1 / 1/a -> a", () => {
            const before = div(number("1"), div(number("1"), ident("a")));
            const after = ident("a");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplication with identity",
                "division by one",
            ]);
        });

        it("a / 1/b -> a * b/1 -> ab", () => {
            const before = div(ident("a"), div(number("1"), ident("b")));
            const after = mul(ident("a"), ident("b"));

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplying fractions",
                "division by one",
            ]);
        });

        it("a/b * b/a -> ab/ba -> 1", () => {
            const before = mul(
                div(ident("a"), ident("b")),
                div(ident("b"), ident("a")),
            );
            const after = number("1");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "multiplying fractions",
                "division by the same value",
            ]);
        });
    });

    // TODO: 24ab / 6a -> 4b
    it("24ab / 6a -> 4b", () => {
        const before = div(
            mul(number("24"), ident("a"), ident("b")),
            mul(number("6"), ident("a")),
        );
        const after = mul(number("4"), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "prime factorization",
            "canceling factors in division",
            "division by the same value",
            "multiplication with identity",
            "division by one",
            "division by one", // TODO: figure out why there's an extra "division by one"
        ]);
    });

    // TODO: make this 2a/a -> a/a * 2 instead
    it("2a/a -> a/a * 2/1 -> 1 * 2/1 -> 2/1 -> 2", () => {
        const before = div(mul(number("2"), ident("a")), ident("a"));
        const after = number("2");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "canceling factors in division",
            "division by the same value",
            "multiplication with identity",
            "division by one",
        ]);
    });

    it("2a/a -> 2b [incorrect]", () => {
        const before = div(mul(number("2"), ident("a")), ident("a"));
        const after = mul(number("2"), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(false);
        expect(result.reasons.map(reason => reason.message)).toEqual([]);
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

    it("2abc/ab -> ab/ab * 2c/1 -> 1 * 2c/1 -> 2c", () => {
        const before = div(
            mul(number("2"), ident("a"), ident("b"), ident("c")),
            mul(ident("a"), ident("b")),
        );
        const after = mul(number("2"), ident("c"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "canceling factors in division",
            "division by the same value",
            "multiplication with identity",
            "division by one",
        ]);
    });

    // don't cancel all common factors
    it("2abc/ab -> a/a * 2bc/b -> 1 * 2bc/b -> 2bc/c", () => {
        const before = div(
            mul(number("2"), ident("a"), ident("b"), ident("c")),
            mul(ident("a"), ident("b")),
        );
        const after = div(mul(number("2"), ident("b"), ident("c")), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "canceling factors in division",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("2abc/abd -> 2c/d", () => {
        const before = div(
            mul(number("2"), ident("a"), ident("b"), ident("c")),
            mul(ident("a"), ident("b"), ident("d")),
        );
        const after = div(mul(number("2"), ident("c")), ident("d"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "canceling factors in division",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("ab/abde -> ab/ab * 1/de -> 1 * 1/de -> 1/de", () => {
        const before = div(
            mul(ident("a"), ident("b")),
            mul(ident("a"), ident("b"), ident("d"), ident("e")),
        );
        const after = div(number("1"), mul(ident("d"), ident("e")));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "canceling factors in division",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a * b/b -> a * 1 -> a", () => {
        const before = mul(ident("a"), div(ident("b"), ident("b")));
        const after = ident("a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a -> a * 1 -> a * b/b", () => {
        const before = ident("a");
        const after = mul(ident("a"), div(ident("b"), ident("b")));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        // TODO: order the substeps based on the order of the steps
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a -> a / 1", () => {
        const before = ident("a");
        const after = div(ident("a"), number("1"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "division by one",
        ]);
    });

    it("ab -> ab / 1", () => {
        const before = mul(ident("a"), ident("b"));
        const after = div(mul(ident("a"), ident("b")), number("1"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "division by one",
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
            expect(result.reasons.map(reason => reason.message)).toEqual([
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
            expect(result.reasons.map(reason => reason.message)).toEqual([
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
            expect(result.reasons.map(reason => reason.message)).toEqual([
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
            expect(result.reasons.map(reason => reason.message)).toEqual([
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
            expect(result.reasons.map(reason => reason.message)).toEqual([
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
            expect(result.reasons.map(reason => reason.message)).toEqual([
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
            expect(result.reasons.map(reason => reason.message)).toEqual([
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
            expect(result.reasons.map(reason => reason.message)).toEqual([
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
