// @flow
import * as Semantic from "../../semantic.js";

import StepChecker from "../step-checker.js";

const checker = new StepChecker();

const checkStep = (prev: Semantic.Expression, next: Semantic.Expression) =>
    checker.checkStep(prev, next);

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

describe("FractionChecker", () => {
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

    it("30 / 6 -> 2*3*5 / 2*3 -> 2*3/2*3 * 5/1 -> 1 * 5/1 -> 5/1 -> 5", () => {
        const before = div(number("30"), number("6"));
        const after = number("5");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "prime factorization",
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "division by one",
        ]);
    });

    it("24 / 6 -> 2*2*2*3 / 2*3 -> 2*3/2*3 * 2*2/1 -> 1 * 2*2/1 -> 2*2/1 -> 4/1 -> 4", () => {
        const before = div(number("24"), number("6"));
        const after = number("4");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "prime factorization",
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "evaluation of multiplication",
            "division by one",
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

        it("a/b * b/a -> ab/ba -> ab/ab -> 1", () => {
            const before = mul(
                div(ident("a"), ident("b")),
                div(ident("b"), ident("a")),
            );
            const after = number("1");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "multiplying fractions",
                "commutative property",
                "division by the same value",
            ]);
        });
    });

    it("24ab / 6a -> 2*2*2*3*a*b / 2*3*a -> 2*3*a/2*3*a * 2*2/1 -> 1 * 2*2/1 -> 2*2/1 -> 4/1 -> 4b", () => {
        const before = div(
            mul(number("24"), ident("a"), ident("b")),
            mul(number("6"), ident("a")),
        );
        const after = mul(number("4"), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "prime factorization",
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "evaluation of multiplication",
            "division by one",
        ]);
    });

    // TODO: make this 2a/a -> a/a * 2 instead
    it("2a/a -> a/a * 2/1 -> 1 * 2/1 -> 2/1 -> 2", () => {
        const before = div(mul(number("2"), ident("a")), ident("a"));
        const after = number("2");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
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

    it("2abc/ab -> ab/ab * 2c/1 -> 1 * 2c/1 -> 2c", () => {
        const before = div(
            mul(number("2"), ident("a"), ident("b"), ident("c")),
            mul(ident("a"), ident("b")),
        );
        const after = mul(number("2"), ident("c"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "division by one",
        ]);
    });

    // test that we don't cancel all common factors
    it("2abc/ab -> a/a * 2bc/b -> 1 * 2bc/b -> 2bc/c", () => {
        const before = div(
            mul(number("2"), ident("a"), ident("b"), ident("c")),
            mul(ident("a"), ident("b")),
        );
        const after = div(mul(number("2"), ident("b"), ident("c")), ident("b"));

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
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
            "extract common factors from numerator and denominator",
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
            "extract common factors from numerator and denominator",
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
});
