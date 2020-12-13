import {serializer} from "@math-blocks/semantic";

import {
    checkStep,
    toParseLike,
    toHaveMessages,
    toHaveStepsLike,
} from "../test-util";

expect.addSnapshotSerializer(serializer);
expect.extend({toParseLike, toHaveMessages, toHaveStepsLike});

describe("new fraction checks", () => {
    describe("mulFrac", () => {
        it("a * b/c -> ab / c", () => {
            const result = checkStep("a * b/c", "ab / c");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["multiplication of fractions"]);
        });

        it("a * b/c -> ba / c", () => {
            const result = checkStep("a * b/c", "ba / c");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplication of fractions",
                "commutative property",
            ]);
        });

        it("a/b * c/d -> ac / bd", () => {
            const result = checkStep("a/b * c/d", "ac / bd");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["multiplication of fractions"]);
        });

        it("ac / bd -> a/b * c/d", () => {
            const result = checkStep("ac / bd", "a/b * c/d");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["fraction decomposition"]);
        });

        it("a * b * c/d -> abc / d", () => {
            const result = checkStep("a * b * c/d", "abc / d");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["multiplication of fractions"]);
        });

        // TODO: renable once we've add associative property checks
        it("a * (b * c/d) -> abc / d", () => {
            const result = checkStep("a * (b * c/d)", "abc / d");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "associative property of multiplication",
                "multiplication of fractions",
            ]);
        });

        it("ab / c -> a * b/c", () => {
            const result = checkStep("ab / c", "a * b/c");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["fraction decomposition"]);
        });

        it("ab / c -> b * a/c", () => {
            const result = checkStep("ab / c", "b * a/c");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "commutative property",
                "fraction decomposition",
            ]);
        });

        it("a * 1/b -> a/b", () => {
            const result = checkStep("a * 1/b", "a/b");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["multiplication of fractions"]);
        });

        it("a/b -> a * 1/b", () => {
            const result = checkStep("a/b", "a * 1/b");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["fraction decomposition"]);
        });

        it("1/a * 1/b -> 1 / ab", () => {
            const result = checkStep("1/a * 1/b", "1/ab");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["multiplication of fractions"]);
        });

        it("a/b * c/d * e/f -> ace / bdf", () => {
            const result = checkStep("a/b * c/d * e/f", "ace / bdf");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["multiplication of fractions"]);
        });

        // It's most likely that if someone is multiplying fractions like this
        // they'd probably do this operation on adjacent fractions
        it.skip("a/b * c/d * e/f -> a/b * ce / df", () => {
            const result = checkStep("a/b * c/d * e/f", "a/b * ce / df");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["multiplication of fractions"]);
        });

        it("(a + b) * 1/c -> a/c + b/c", () => {
            const result = checkStep("(a + b) * 1/c", "a/c  + b/c");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "distribution",
                "multiplication of fractions",
                "multiplication of fractions",
            ]);
        });

        it("a/c + b/c -> 1/c * (a + b)", () => {
            const result = checkStep("a/c + b/c", "1/c * (a + b)");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "fraction decomposition",
                "fraction decomposition",
                "factoring",
            ]);

            expect(result).toHaveStepsLike([
                ["a/c", "1/c * a"],
                ["b/c", "1/c * b"],
                ["1/c * a + 1/c * b", "1/c * (a + b)"],
            ]);
        });

        it("(a + b) / c -> (a + b) * 1/c", () => {
            const result = checkStep("(a + b) / c", "(a + b) * 1/c");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["fraction decomposition"]);
        });

        it("(a + b) / c -> a/c + b/c", () => {
            const result = checkStep("(a + b) / c", "a/c + b/c");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "division is multiplication by a fraction",
                "distribution",
                "multiplication of fractions",
                "multiplication of fractions",
            ]);
        });
    });

    describe("cancelFrac", () => {
        it("a/a -> 1", () => {
            const result = checkStep("a/a", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["cancelling in fractions"]);
        });

        it("1 -> a/a", () => {
            const result = checkStep("1", "a/a");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["cancelling in fractions"]);
        });

        it("a/a -> b/b", () => {
            const result = checkStep("a/a", "b/b");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "cancelling in fractions",
                "cancelling in fractions",
            ]);
        });

        it("abc / bcd -> a/d", () => {
            const result = checkStep("abc / bcd", "a/d");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["cancelling in fractions"]);
        });

        it("abc / bc -> a", () => {
            const result = checkStep("abc / bc", "a");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["cancelling in fractions"]);
        });

        it("bc / bcd -> 1/d", () => {
            const result = checkStep("bc / bcd", "1/d");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["cancelling in fractions"]);
        });

        it("24ab / 6a -> 4b", () => {
            const result = checkStep("24ab / 6a", "4b");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "cancelling in fractions",
                "division is multiplication by a fraction",
                "associative property of multiplication",
                "evaluation of multiplication",
            ]);
        });

        it("(2)(2)(2)(3) / (2)(3) -> (2)(2)(2) / (2)", () => {
            const result = checkStep("(2)(2)(2)(3) / (2)(3)", "(2)(2)(2) / 2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "cancelling in fractions",
                "evaluation of multiplication",
            ]);
        });

        it("a/b * b/a -> ab/ba -> ab/ab -> 1", () => {
            const result = checkStep("a/b * b/a", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplication of fractions",
                "cancelling in fractions",
            ]);

            // TODO: use implicit multiplication where appropriate
            expect(result).toHaveStepsLike([
                ["a/b * b/a", "(a*b) / (b*a)"],
                ["(a*b) / (b*a)", "1"],
            ]);
        });

        it("2a/a -> 2", () => {
            const result = checkStep("2a/a", "2");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["cancelling in fractions"]);
        });

        it("a * b/b -> a * 1 -> a", () => {
            const result = checkStep("a * b/b", "a");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "cancelling in fractions",
                "multiplication with identity",
            ]);
        });
    });

    describe("divByOne", () => {
        it("a/1 -> a", () => {
            const result = checkStep("a/1", "a");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["division by one"]);
        });

        it("ab/1 -> ab", () => {
            const result = checkStep("ab/1", "ab");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["division by one"]);
        });

        it("a/(b/b) -> a", () => {
            const result = checkStep("a/(b/b)", "a");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "cancelling in fractions",
                "division by one",
            ]);
        });

        it("a/1 * b/1 -> ab", () => {
            const result = checkStep("a/1 * b/1", "ab");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "division by one",
                "division by one",
            ]);
        });

        it("a/1 + b/1 -> ab", () => {
            const result = checkStep("a/1 + b/1", "a + b");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "division by one",
                "division by one",
            ]);
        });
    });

    describe("divByFrac", () => {
        it("a / (b/c) -> a * c/b", () => {
            const result = checkStep("a / (b/c)", "a * c/b");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "dividing by a fraction is the same as multiplying by the reciprocal",
            ]);

            expect(result).toHaveStepsLike([["a / (b/c)", "a * c/b"]]);
        });

        it("(a/b) / (c/d) -> a/b * d/c", () => {
            const result = checkStep("(a/b) / (c/d)", "a/b * d/c");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "dividing by a fraction is the same as multiplying by the reciprocal",
            ]);

            expect(result).toHaveStepsLike([["(a/b) / (c/d)", "a/b * d/c"]]);
        });

        it("1 / (1/a) -> a", () => {
            const result = checkStep("1 / (1/a)", "a");

            expect(result).toBeTruthy();

            expect(result).toHaveMessages([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplication with identity",
                "division by one",
            ]);

            expect(result).toHaveStepsLike([
                ["1 / (1/a)", "1 * a/1"],
                ["1 * a/1", "a/1"],
                ["a/1", "a"],
            ]);
        });

        it("a -> 1 / (1/a)", () => {
            const result = checkStep("a", "1 / (1/a)");

            expect(result).toBeTruthy();

            expect(result).toHaveMessages([
                "division by one",
                "multiplication with identity",
                "dividing by a fraction is the same as multiplying by the reciprocal",
            ]);

            expect(result).toHaveStepsLike([
                ["a", "a/1"],
                ["a/1", "1 * a/1"],
                ["1 * a/1", "1 / (1/a)"],
            ]);
        });

        // We no longer need the call to `convertPowNegExpToDiv` in `divByFrac`.
        // There may be other checks like this though where some other check
        // produces a fraction that that doesn't have a path.
        it.skip("1 / a^(-2) -> a^2", () => {
            const result = checkStep("1 / a^(-2)", "a^2");

            expect(result).toBeTruthy();

            expect(result).toHaveMessages([
                "A power with a negative exponent is the same as one over the power with the positive exponent",
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "multiplication with identity",
                "division by one",
            ]);

            expect(result).toHaveStepsLike([
                ["a^(-2)", "1 / a^2"],
                ["1 / (1/a^2)", "1 * a^2/1"],
                ["1 * a^2/1", "a^2/1"],
                ["a^2/1", "a^2"],
            ]);
        });

        it("a^2 -> 1 / a^(-2)", () => {
            const result = checkStep("a^2", "1 / a^(-2)");

            expect(result).toBeTruthy();

            expect(result).toHaveMessages([
                "division by one",
                "multiplication with identity",
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "A power with a negative exponent is the same as one over the power with the positive exponent",
            ]);

            expect(result).toHaveStepsLike([
                ["a^2", "a^2/1"],
                ["a^2/1", "1 * a^2/1"],
                ["1 * a^2/1", "1 / (1/a^2)"],
                ["1 / a^2", "a^(-2)"],
            ]);
        });

        it("a / (1/b) -> a * b/1 -> ab", () => {
            const result = checkStep("a / (1/b)", "ab");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "dividing by a fraction is the same as multiplying by the reciprocal",
                "division by one",
            ]);

            expect(result).toHaveStepsLike([
                ["a / (1/b)", "a * b/1"],
                ["b/1", "b"],
            ]);
        });
    });

    describe("mulInverse", () => {
        it("a * 1/a -> 1", () => {
            const result = checkStep("a * 1/a", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["multiplying the inverse"]);

            expect(result).toHaveStepsLike([["a * 1/a", "1"]]);
        });

        it("1/a * a -> 1", () => {
            const result = checkStep("1/a * a", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["multiplying the inverse"]);

            expect(result).toHaveStepsLike([["1/a * a", "1"]]);
        });

        it("a * b * 1/b * c -> a * 1 * c", () => {
            const result = checkStep("a * b * 1/b * c", "a * 1 * c");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages(["multiplying the inverse"]);

            expect(result).toHaveStepsLike([["a * b * 1/b * c", "a * 1 * c"]]);
        });

        it("a * b * 1/b * c -> a * c", () => {
            const result = checkStep("a * b * 1/b * c", "a * c");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying the inverse",
                "multiplication with identity",
            ]);

            expect(result).toHaveStepsLike([
                ["a * b * 1/b * c", "a * 1 * c"],
                ["a * 1 * c", "a * c"],
            ]);
        });

        it("(a)(b)(1/b)(c) -> ac", () => {
            const result = checkStep("(a)(b)(1/b)(c)", "ac");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying the inverse",
                "multiplication with identity",
            ]);

            expect(result).toHaveStepsLike([
                ["(a)(b)(1/b)(c)", "(a)(1)(c)"],
                ["(a)(1)(c)", "ac"],
            ]);
        });

        it("a * 1/a * b * 1/b -> 1", () => {
            const result = checkStep("a * 1/a * b * 1/b", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying the inverse",
                "multiplying the inverse",
                "multiplication with identity",
            ]);

            expect(result).toHaveStepsLike([
                ["a * 1/a * b * 1/b", "1 * b * 1/b"],
                ["1 * b * 1/b", "1 * 1"],
                ["1 * 1", "1"],
            ]);
        });

        it("a * 1/a * a * 1/a -> 1", () => {
            const result = checkStep("a * 1/a * a * 1/a", "1");

            expect(result).toBeTruthy();
            expect(result).toHaveMessages([
                "multiplying the inverse",
                "multiplying the inverse",
                "multiplication with identity",
            ]);

            expect(result).toHaveStepsLike([
                ["a * 1/a * a * 1/a", "1 * a * 1/a"],
                ["1 * a * 1/a", "1 * 1"],
                ["1 * 1", "1"],
            ]);
        });
    });

    describe("adding fractions", () => {
        it.todo("a/b + c/d -> (ad + bc) / bd");
    });
});
