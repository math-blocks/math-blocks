import * as Semantic from "../../semantic";
import {parse} from "../../text/text-parser";

import StepChecker from "../step-checker";

const checker = new StepChecker();

const checkStep = (prev: Semantic.Expression, next: Semantic.Expression) =>
    checker.checkStep(prev, next, []);

describe("FractionChecker", () => {
    it("1 -> a/a", () => {
        const before = parse("1");
        const after = parse("a/a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "division by the same value",
        ]);
    });

    it("a/b * c/d -> ac / bd", () => {
        const before = parse("a/b * c/d");
        const after = parse("ac / bd");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("ac / bd -> a/b * c/d", () => {
        const before = parse("ac / bd");
        const after = parse("a/b * c/d");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("ab/cd * e/f -> abe / cdf", () => {
        const before = parse("ab/cd * e/f");
        const after = parse("abe / cdf");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("a/b * 1/d -> a*1 / bd -> a / bd", () => {
        const before = parse("a/b * 1/d");
        const after = parse("a / bd");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
            "multiplication with identity",
        ]);
    });

    // TODO: simplify this case
    it("1/a * 1/b -> 1*1 / a*b -> 1 / ab", () => {
        const before = parse("1/a * 1/b");
        const after = parse("1 / ab");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying fractions",
            "fraction is the same as multiplying by one over",
            "multiplication with identity",
            "multiplication with identity",
        ]);
    });

    it("a * 1/b -> a / b", () => {
        const before = parse("a * 1/b");
        const after = parse("a / b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying by one over something results in a fraction",
        ]);
    });

    it("30 / 6 -> 2*3*5 / 2*3 -> 2*3/2*3 * 5/1 -> 1 * 5/1 -> 5/1 -> 5", () => {
        const before = parse("30 / 6");
        const after = parse("5");

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
        const before = parse("24 / 6");
        const after = parse("4");

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
        it("a / (b/c) -> a * c/b", () => {
            const before = parse("a / (b/c)");
            const after = parse("a * c/b");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
            ]);
        });

        it("1 / (a/b) -> b / a", () => {
            const before = parse("1 / (a/b)");
            const after = parse("b / a");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplication with identity",
            ]);
        });

        it("1 / (1/a) -> a", () => {
            const before = parse("1 / (1/a)");
            const after = parse("a");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplication with identity",
                "division by one",
            ]);
        });

        it("a / (1/b) -> a * b/1 -> ab", () => {
            const before = parse("a / (1/b)");
            const after = parse("ab");

            const result = checkStep(before, after);

            expect(result.equivalent).toBe(true);
            expect(result.reasons.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "division by one",
            ]);
        });

        it("a/b * b/a -> ab/ba -> ab/ab -> 1", () => {
            const before = parse("a/b * b/a");
            const after = parse("1");

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
        const before = parse("24ab / 6a");
        const after = parse("4b");

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
        const before = parse("2a/a");
        const after = parse("2");

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
        const before = parse("2a/a");
        const after = parse("2b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(false);
        expect(result.reasons.map(reason => reason.message)).toEqual([]);
    });

    it("2abc/ab -> ab/ab * 2c/1 -> 1 * 2c/1 -> 2c", () => {
        const before = parse("2abc/ab");
        const after = parse("2c");

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
    it("2abc/ab -> a/a * 2bc/b -> 1 * 2bc/b -> 2bc/b", () => {
        const before = parse("2abc/ab");
        const after = parse("2bc/b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("2abc/abd -> 2c/d", () => {
        const before = parse("2abc/abd");
        const after = parse("2c/d");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("ab/abde -> ab/ab * 1/de -> 1 * 1/de -> 1/de", () => {
        const before = parse("ab/abde");
        const after = parse("1/de");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a * b/b -> a * 1 -> a", () => {
        const before = parse("a * b/b");
        const after = parse("a");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a -> a * 1 -> a * b/b", () => {
        const before = parse("a");
        const after = parse("a * b/b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        // TODO: order the substeps based on the order of the steps
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a -> a / 1", () => {
        const before = parse("a");
        const after = parse("a / 1");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "division by one",
        ]);
    });

    it("ab -> ab / 1", () => {
        const before = parse("ab");
        const after = parse("ab / 1");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "division by one",
        ]);
    });

    // TODO: make sure distribution is including substeps
    // e.g. 1/c * a + 1/c * b
    it("(a + b) * 1/c -> a/c + b/c", () => {
        const before = parse("(a + b) * 1/c");
        const after = parse("a/c  + b/c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "distribution",
        ]);
    });

    // TODO: make sure factoring is including substeps
    // e.g. 1/c * a + 1/c * b
    it("a/c + b/c -> 1/c * (a + b)", () => {
        const before = parse("a/c  + b/c");
        const after = parse("1/c * (a + b)");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "factoring",
        ]);
    });

    it("(a + b) / c -> a/c + b/c", () => {
        const before = parse("(a + b) / c");
        const after = parse("a/c  + b/c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
            "distribution",
        ]);
    });

    it("(a + b) / c -> (a + b) * 1/c", () => {
        const before = parse("(a + b) / c");
        const after = parse("(a + b) * 1/c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
        ]);
    });

    it("a/c + b/c -> (a + b) / c", () => {
        const before = parse("a/c  + b/c");
        const after = parse("(a + b) / c");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "factoring",
            "multiplying by one over something results in a fraction",
        ]);
    });

    it("a * 1/b -> a/b", () => {
        const before = parse("a * 1/b");
        const after = parse("a/b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "multiplying by one over something results in a fraction",
        ]);
    });

    it("a/b -> a * 1/b", () => {
        const after = parse("a * 1/b");
        const before = parse("a/b");

        const result = checkStep(before, after);

        expect(result.equivalent).toBe(true);
        expect(result.reasons.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
        ]);
    });
});
