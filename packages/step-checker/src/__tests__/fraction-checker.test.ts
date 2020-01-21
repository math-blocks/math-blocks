import {serializer} from "@math-blocks/semantic";
import {parse} from "@math-blocks/text-parser";

import StepChecker from "../step-checker";
import {Result} from "../types";

expect.addSnapshotSerializer(serializer);

const checker = new StepChecker();

const checkStep = (prev: string, next: string): Result => {
    return checker.checkStep(parse(prev), parse(next), []);
};

describe("FractionChecker", () => {
    it("a * 1/b -> a / b", () => {
        const result = checkStep("a * 1/b", "a / b");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying by one over something results in a fraction",
        ]);
    });

    it("1/b * a -> a / b", () => {
        const result = checkStep("1/b * a", "a / b");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "commutative property",
            "multiplying by one over something results in a fraction",
        ]);
    });

    it("a / b -> a * 1/b", () => {
        const result = checkStep("a / b", "a * 1/b");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
        ]);
    });

    // TODO: simplify this case
    it("1/a * 1/b -> 1*1 / a*b -> 1 / ab", () => {
        const result = checkStep("1/a * 1/b", "1 / ab");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying fractions",
            "fraction is the same as multiplying by one over",
            "multiplication with identity",
            "multiplication with identity",
        ]);
    });

    it("1 -> a/a", () => {
        const result = checkStep("1", "a/a");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "division by the same value",
        ]);
    });

    it("a/b * c/d -> ac / bd", () => {
        const result = checkStep("a/b * c/d", "ac / bd");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("ac / bd -> a/b * c/d", () => {
        const result = checkStep("ac / bd", "a/b * c/d");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("ab/cd * e/f -> abe / cdf", () => {
        const result = checkStep("ab/cd * e/f", "abe / cdf");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying fractions",
        ]);
    });

    it("a/b * 1/d -> a*1 / bd -> a / bd", () => {
        const result = checkStep("a/b * 1/d", "a / bd");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "multiplying fractions",
            "multiplication with identity",
        ]);
    });

    // TODO: write test suite where the EvalChecker is configured to ignore fractions
    it.skip("30 / 6 -> 2*3*5 / 2*3 -> 2*3/2*3 * 5/1 -> 1 * 5/1 -> 5/1 -> 5", () => {
        const result = checkStep("30 / 6", "5");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "prime factorization",
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "division by one",
        ]);
    });

    // TODO: write test suite where the EvalChecker is configured to ignore fractions
    it.skip("24 / 6 -> 2*2*2*3 / 2*3 -> 2*3/2*3 * 2*2/1 -> 1 * 2*2/1 -> 2*2/1 -> 4/1 -> 4", () => {
        const result = checkStep("24 / 6", "4");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
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
            const result = checkStep("a / (b/c)", "a * c/b");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
            ]);
        });

        it("1 / (a/b) -> b / a", () => {
            const result = checkStep("1 / (a/b)", "b / a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplication with identity",
            ]);
        });

        it("1 / (1/a) -> a", () => {
            const result = checkStep("1 / (1/a)", "a");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplication with identity",
                "division by one",
            ]);
        });

        it("a / (1/b) -> a * b/1 -> ab", () => {
            const result = checkStep("a / (1/b)", "ab");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "division by one",
            ]);
        });

        it("a/b * b/a -> ab/ba -> ab/ab -> 1", () => {
            const result = checkStep("a/b * b/a", "1");

            expect(result.equivalent).toBe(true);
            expect(result.steps.map(reason => reason.message)).toEqual([
                "multiplying fractions",
                "commutative property",
                "division by the same value",
            ]);
        });
    });

    it("24ab / 6a -> 2*2*2*3*a*b / 2*3*a -> 2*3*a/2*3*a * 2*2/1 -> 1 * 2*2/1 -> 2*2/1 -> 4/1 -> 4b", () => {
        const result = checkStep("24ab / 6a", "4b");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
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
        const result = checkStep("2a/a", "2");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "division by one",
        ]);
    });

    it("2a/a -> 2b [incorrect]", () => {
        const result = checkStep("2a/a", "2b");

        expect(result.equivalent).toBe(false);
        expect(result.steps).toEqual([]);
    });

    it("2abc/ab -> ab/ab * 2c/1 -> 1 * 2c/1 -> 2c", () => {
        const result = checkStep("2abc/ab", "2c");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
            "division by one",
        ]);
    });

    // test that we don't cancel all common factors
    it("2abc/ab -> a/a * 2bc/b -> 1 * 2bc/b -> 2bc/b", () => {
        const result = checkStep("2abc/ab", "2bc/b");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("2abc/abd -> 2c/d", () => {
        const result = checkStep("2abc/abd", "2c/d");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("ab/abde -> ab/ab * 1/de -> 1 * 1/de -> 1/de", () => {
        const result = checkStep("ab/abde", "1/de");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "extract common factors from numerator and denominator",
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a * b/b -> a * 1 -> a", () => {
        const result = checkStep("a * b/b", "a");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a -> a * 1 -> a * b/b", () => {
        const result = checkStep("a", "a * b/b");

        expect(result.equivalent).toBe(true);
        // TODO: order the substeps based on the order of the steps
        expect(result.steps.map(reason => reason.message)).toEqual([
            "division by the same value",
            "multiplication with identity",
        ]);
    });

    it("a -> a / 1", () => {
        const result = checkStep("a", "a / 1");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "division by one",
        ]);
    });

    it("ab -> ab / 1", () => {
        const result = checkStep("ab", "ab / 1");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "division by one",
        ]);
    });

    // TODO: make sure distribution is including substeps
    // e.g. 1/c * a + 1/c * b
    it("(a + b) * 1/c -> a/c + b/c", () => {
        const result = checkStep("(a + b) * 1/c", "a/c  + b/c");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "distribution",
            "fraction is the same as multiplying by one over",
            "fraction is the same as multiplying by one over",
        ]);
    });

    // e.g. 1/c * a + 1/c * b
    it("a/c + b/c -> 1/c * (a + b)", () => {
        const result = checkStep("a/c + b/c", "1/c * (a + b)");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
            "commutative property",
            "fraction is the same as multiplying by one over",
            "commutative property",
            "factoring",
        ]);
    });

    it("(a + b) / c -> a/c + b/c", () => {
        const result = checkStep("(a + b) / c", "a/c  + b/c");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
            "distribution",
            "fraction is the same as multiplying by one over",
            "fraction is the same as multiplying by one over",
        ]);
    });

    it("(a + b) / c -> (a + b) * 1/c", () => {
        const result = checkStep("(a + b) / c", "(a + b) * 1/c");

        expect(result.equivalent).toBe(true);
        expect(result.steps.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
        ]);
    });

    it("a/c + b/c -> (a + b) / c", () => {
        const result = checkStep("a/c  + b/c", "(a + b) / c");

        expect(result.equivalent).toBe(true);
        expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`(div a c)`);
        expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`
            (mul.exp
              a
              (div 1 c))
        `);

        expect(result.steps[1].nodes[0]).toMatchInlineSnapshot(`(div b c)`);
        expect(result.steps[1].nodes[1]).toMatchInlineSnapshot(`
            (mul.exp
              b
              (div 1 c))
        `);

        expect(result.steps[2].nodes[0]).toMatchInlineSnapshot(`
            (add
              (mul.exp
                a
                (div 1 c))
              (mul.exp
                b
                (div 1 c)))
        `);
        expect(result.steps[2].nodes[1]).toMatchInlineSnapshot(`
            (mul.exp
              (add a b)
              (div 1 c))
        `);

        expect(result.steps.map(reason => reason.message)).toEqual([
            "fraction is the same as multiplying by one over",
            "fraction is the same as multiplying by one over",
            "factoring",
            "multiplying by one over something results in a fraction",
        ]);
    });
});
