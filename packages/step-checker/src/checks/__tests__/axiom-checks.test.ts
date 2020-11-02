import {serializer} from "@math-blocks/semantic";
import {parse} from "@math-blocks/text-parser";

import {Status} from "../../types";

import {checkStep} from "../test-util";
import {deepEquals} from "../util";

expect.addSnapshotSerializer(serializer);

expect.extend({
    toParseLike(received, expected) {
        if (deepEquals(received, parse(expected))) {
            return {
                message: () => `expected steps not to match`,
                pass: true,
            };
        }
        return {
            message: () => `expected steps not to match`,
            pass: false,
        };
    },
});

describe("Axiom checks", () => {
    describe("symmetricProperty", () => {
        it("a = 3 -> 3 = a", () => {
            const result = checkStep("a = 3", "3 = a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "symmetric property",
            ]);
        });

        it("a = b = c -> b = c = a", () => {
            const result = checkStep("a = b = c", "b = c = a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "symmetric property",
            ]);
        });

        it("a = b + 0 = c + 0 -> b = c = a", () => {
            const result = checkStep("a = b + 0 = c + 0", "b = c = a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "addition with identity",
                "addition with identity",
                "symmetric property",
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("b + 0");
            expect(result.steps[0].nodes[1]).toParseLike("b");

            expect(result.steps[1].nodes[0]).toParseLike("c + 0");
            expect(result.steps[1].nodes[1]).toParseLike("c");

            expect(result.steps[2].nodes[0]).toParseLike("a = b = c");
            expect(result.steps[2].nodes[1]).toParseLike("b = c = a");
        });

        it("a = 1 + 2 -> 3 = a", () => {
            const result = checkStep("a = 1 + 2", "3 = a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "evaluation of addition",
                "symmetric property",
            ]);
        });

        it("x = x + 0 -> x + 0 = x", () => {
            const result = checkStep("x = x + 0", "x + 0 = x");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "symmetric property",
            ]);
        });

        it("x = y + 0 -> y = x * 1", () => {
            const result = checkStep("x = y + 0", "y = x * 1");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "addition with identity",
                "multiplication with identity",
                "symmetric property",
            ]);
        });
    });

    describe("commuteAddition", () => {
        it("1 + 2 -> 2 + 1", () => {
            const result = checkStep("1 + 2", "2 + 1");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("(2 - 1) + (1 + 1) -> 2 + 1", () => {
            const result = checkStep("(2 - 1) + (1 + 1)", "2 + 1");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                // TODO: change the message to "evaluation of subtraction"
                "evaluation of addition",
                "evaluation of addition",
                "commutative property",
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("2 - 1");
            expect(result.steps[0].nodes[1]).toParseLike("1");

            expect(result.steps[1].nodes[0]).toParseLike("1 + 1");
            expect(result.steps[1].nodes[1]).toParseLike("2");

            expect(result.steps[2].nodes[0]).toParseLike("1 + 2");
            expect(result.steps[2].nodes[1]).toParseLike("2 + 1");
        });

        // nested commutative property
        it("(1 + 2) + (a + b) -> (2 + 1) + (b + a)", () => {
            const result = checkStep("(1 + 2) + (a + b)", "(b + a) + (2 + 1)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "commutative property",
                "commutative property",
                "commutative property",
            ]);
        });

        it("1 + 2 + 3 + 4 -> 6 [incorrect]", () => {
            expect(() => checkStep("1 + 2 + 3 + 4", "6")).toThrow();
        });

        // commutative property with additive identity
        it("2 + 0 -> 0 + 2", () => {
            const result = checkStep("2 + 0", "0 + 2");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("x + (a + 2) -> x + (2 + a)", () => {
            const before = "x + (a + 2)";
            const after = "x + (2 + a)";

            const result = checkStep(before, after);

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("x + a + 2 -> x + 2 + a", () => {
            const result = checkStep("x + a + 2", "x + 2 + a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("x + a + 2 -> a + x + 2", () => {
            const result = checkStep("x + a + 2", "a + x + 2");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("x + a + 2 -> x + 2 + b [incorrect step]", () => {
            expect(() => checkStep("x + a + 2", "x + 2 + b")).toThrow();
        });
    });

    describe("commuteMultiplication", () => {
        // commutative property with multiplicative identity
        it("1 * 2 -> 2 * 1", () => {
            const result = checkStep("1 * 2", "2 * 1");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("2 * 3 -> 3 * 2", () => {
            const result = checkStep("2 * 3", "3 * 2");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "commutative property",
            ]);
        });

        it("(1 + 1) * (1 + 2) -> 3 * 2", () => {
            const result = checkStep("(1 + 1) * (1 + 2)", "3 * 2");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "evaluation of addition",
                "evaluation of addition",
                "commutative property",
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("1 + 1");
            expect(result.steps[0].nodes[1]).toParseLike("2");

            expect(result.steps[1].nodes[0]).toParseLike("1 + 2");
            expect(result.steps[1].nodes[1]).toParseLike("3");

            expect(result.steps[2].nodes[0]).toParseLike("2 * 3");
            expect(result.steps[2].nodes[1]).toParseLike("3 * 2");
        });

        it("3 * 2 -> (1 + 1) * (1 + 2)", () => {
            const result = checkStep("3 * 2", "(1 + 1) * (1 + 2)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "decompose sum",
                "decompose sum",
                "commutative property",
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("3");
            expect(result.steps[0].nodes[1]).toParseLike("1 + 2");

            expect(result.steps[1].nodes[0]).toParseLike("2");
            expect(result.steps[1].nodes[1]).toParseLike("1 + 1");

            expect(result.steps[2].nodes[0]).toParseLike("(1 + 2) * (1 + 1)");
            expect(result.steps[2].nodes[1]).toParseLike("(1 + 1) * (1 + 2)");
        });
    });

    describe("addZero", () => {
        it("a + 0 -> a", () => {
            const result = checkStep("a + 0", "a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("2(a + 0) -> 2a", () => {
            const result = checkStep("2(a + 0)", "2a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("a -> a + 0", () => {
            const result = checkStep("a", "a + 0");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("2a -> 2(a + 0)", () => {
            const result = checkStep("2a", "2(a + 0)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        // TODO: make this test pass
        it.skip("2a -> 2(a + 7)", () => {
            const result = checkStep("2a", "2(a + 7)");

            expect(result).toBeTruthy();
            expect(result.status).toEqual(Status.Incorrect);
        });

        it("a + b -> a + b + 0", () => {
            const result = checkStep("a + b", "a + b + 0");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("a + b -> a + 0 + b", () => {
            const result = checkStep("a + b", "a + 0 + b");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("a + b -> b + a + 0 -> b + 0 + a", () => {
            const result = checkStep("a + b", "b + 0 + a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "commutative property",
                "addition with identity",
                // TODO: we're missing another "commutative property" step here
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("a + b");
            expect(result.steps[0].nodes[1]).toParseLike("b + a");

            expect(result.steps[1].nodes[0]).toParseLike("b + a");
            expect(result.steps[1].nodes[1]).toParseLike("b + 0 + a");
        });

        it("a + b -> a + 0 + b + 0", () => {
            const result = checkStep("a + b", "a + 0 + b + 0");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "addition with identity",
            ]);
        });

        it("0 + (a + b) -> a + b", () => {
            const result = checkStep("0 + (a + b)", "a + b");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "addition with identity",
            ]);
        });
    });

    describe("mulOne", () => {
        it("1 * a -> a", () => {
            const result = checkStep("1 * a", "a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplication with identity",
            ]);
        });

        it("a -> a * 1", () => {
            const result = checkStep("a", "a * 1");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplication with identity",
            ]);
        });

        it("1 * (a * b) -> a * b", () => {
            const result = checkStep("1 * (a * b)", "a * b");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplication with identity",
            ]);
        });

        it("a * b -> b * a * 1 -> b * 1 * a", () => {
            const result = checkStep("a * b", "b * 1 * a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "commutative property",
                "multiplication with identity",
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("a * b");
            expect(result.steps[0].nodes[1]).toParseLike("b * a");

            expect(result.steps[1].nodes[0]).toParseLike("b * a");
            expect(result.steps[1].nodes[1]).toParseLike("b * 1 * a");
        });

        it("a * b -> a * 1 * b * 1", () => {
            const result = checkStep("a * b", "a * 1 * b * 1");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplication with identity",
            ]);
        });
    });

    describe("checkDistribution", () => {
        it("a * (b + c) -> a * b + a * c", () => {
            const result = checkStep("a * (b + c)", "a * b + a * c");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("(b + c) * a -> b * a + c * a", () => {
            const result = checkStep("(b + c) * a", "b * a + c * a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("a * (b + c) -> a * b + c [incorrect]", () => {
            expect(() => checkStep("a * (b + c)", "a * b + c")).toThrow();
        });

        it("2(x + y) -> 2x + 2y", () => {
            const result = checkStep("2(x + y)", "2x + 2y");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("-2(x + y) -> -2x - 2y", () => {
            const result = checkStep("-2(x + y)", "-2x - 2y");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
                "subtracting is the same as adding the inverse",
            ]);
        });

        it("1 + 2(x + y) -> 1 + 2x + 2y", () => {
            const result = checkStep("1 + 2(x + y)", "1 + 2x + 2y");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("1 - 2(x + y) -> 1 - 2x - 2y", () => {
            const result = checkStep("1 - 2(x + y)", "1 - 2x - 2y");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtracting is the same as adding the inverse",
                "distribution",
                "subtracting is the same as adding the inverse",
                "subtracting is the same as adding the inverse",
            ]);
        });

        it("1 - 2(x + y) -> 1 + -2(x + y)", () => {
            const result = checkStep("1 - 2(x + y)", "1 + -2(x + y)");

            expect(result).toBeTruthy();
            // TODO: figure out why we don't stop after the first step
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtracting is the same as adding the inverse",
                "distribution",
                "factoring",
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("1 - 2(x + y)");
            expect(result.steps[0].nodes[1]).toParseLike("1 + -2(x + y)");
        });

        it("1 - (x + y) -> 1 - x - y", () => {
            const result = checkStep("1 - (x + y)", "1 - x - y");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtraction is the same as multiplying by negative one",
                "distribution",
                "negation is the same as multipling by negative one",
                "negation is the same as multipling by negative one",
                "subtracting is the same as adding the inverse",
                "subtracting is the same as adding the inverse",
            ]);
        });

        it("2(x - y) -> 2(x + -y)", () => {
            const result = checkStep("2(x - y)", "2(x + -y)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtracting is the same as adding the inverse",
            ]);
        });

        it("2(x - y) -> 2x - 2y", () => {
            const result = checkStep("2(x - y)", "2x - 2y");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
                "move negative to first factor",
                "subtracting is the same as adding the inverse",
            ]);
        });

        it("2x + 2(-y) -> 2x - 2y", () => {
            const result = checkStep("2x + 2(-y)", "2x - 2y");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "move negative to first factor",
                "subtracting is the same as adding the inverse",
            ]);
        });

        it("-2(x - y) -> -2x + 2y", () => {
            const result = checkStep("-2(x - y)", "-2x + 2y");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
                "multiplying two negatives is a positive",
            ]);
        });

        it("1 - 2(x - y) -> 1 - 2x + 2y", () => {
            const result = checkStep("1 - 2(x - y)", "1 - 2x + 2y");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtracting is the same as adding the inverse",
                "distribution",
                "multiplying two negatives is a positive",
                "subtracting is the same as adding the inverse",
            ]);
        });

        it("1 - (x - y) -> 1 - x + y", () => {
            const result = checkStep("1 - 2(x - y)", "1 - 2x + 2y");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtracting is the same as adding the inverse",
                "distribution",
                "multiplying two negatives is a positive",
                "subtracting is the same as adding the inverse",
            ]);
        });

        // TODO: improve the performance of this test
        it("1 - (x + y) - (a + b) -> 1 - x - y - a - b", () => {
            const result = checkStep(
                "1 - (x + y) - (a + b)",
                "1 - x - y - a - b",
            );

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtraction is the same as multiplying by negative one",
                "subtraction is the same as multiplying by negative one",
                "distribution",
                "distribution",
                "negation is the same as multipling by negative one",
                "negation is the same as multipling by negative one",
                "negation is the same as multipling by negative one",
                "negation is the same as multipling by negative one",
                "subtracting is the same as adding the inverse",
                "subtracting is the same as adding the inverse",
                "subtracting is the same as adding the inverse",
                "subtracting is the same as adding the inverse",
            ]);

            // TODO: use implicit multiplication in more places
            expect(result.steps[0].nodes[0]).toParseLike(
                "1 - (x + y) - (a + b)",
            );
            expect(result.steps[0].nodes[1]).toParseLike(
                "1 + -1*(x + y) - (a + b)",
            );

            expect(result.steps[1].nodes[0]).toParseLike(
                "1 + -1*(x + y) - (a + b)",
            );
            expect(result.steps[1].nodes[1]).toParseLike(
                "1 + -1*(x + y) + -1*(a + b)",
            );

            expect(result.steps[2].nodes[0]).toParseLike(
                "1 + -1*(x + y) + -1*(a + b)",
            );
            expect(result.steps[2].nodes[1]).toParseLike(
                "1 + -1*x + -1*y + -1*(a + b)",
            );

            expect(result.steps[3].nodes[0]).toParseLike(
                "1 + -1*x + -1*y + -1*(a + b)",
            );
            expect(result.steps[3].nodes[1]).toParseLike(
                "1 + -1*x + -1*y + -1*a + -1*b",
            );
        });

        // TODO: make this test pass
        it.skip("2 * a * (b + c) -> 2 * a * b + 2 * a * c", () => {
            const result = checkStep(
                "2 * a * (b + c)",
                "2 * a * b + 2 * a * c",
            );

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("(a + b) * (x + y) -> (a + b) * x + (a + b) * y", () => {
            const result = checkStep(
                "(a + b) * (x + y)",
                "(a + b) * x + (a + b) * y",
            );

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("(a + b) * (x + y) -> a * (x + y) + b * (x + y)", () => {
            const result = checkStep(
                "(a + b) * (x + y)",
                "a * (x + y) + b * (x + y)",
            );

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
            ]);
        });

        it("a * (x + y) + b * (x + y) -> ax + ay + b * (x + y)", () => {
            const result = checkStep(
                "a * (x + y) + b * (x + y)",
                "ax + ay + b * (x + y)",
            );

            expect(result).toBeTruthy();
            // TODO: make distribution parallel and pick the shortest path
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
                "distribution",
                "factoring",
            ]);
        });

        it("(a + b) * (x + y) -> ax + ay + bx + by", () => {
            const result = checkStep("(a + b) * (x + y)", "ax + ay + bx + by");

            expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`
                (mul.exp
                  (add a b)
                  (add x y))
            `);

            expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`
                (add
                  (mul.exp
                    a
                    (add x y))
                  (mul.exp
                    b
                    (add x y)))
            `);

            expect(result.steps[1].nodes[0]).toMatchInlineSnapshot(`
                (add
                  (mul.exp
                    a
                    (add x y))
                  (mul.exp
                    b
                    (add x y)))
            `);

            expect(result.steps[1].nodes[1]).toMatchInlineSnapshot(`
                (add
                  (mul.exp a x)
                  (mul.exp a y)
                  (mul.exp
                    b
                    (add x y)))
            `);

            expect(result.steps[2].nodes[0]).toMatchInlineSnapshot(`
                (add
                  (mul.exp a x)
                  (mul.exp a y)
                  (mul.exp
                    b
                    (add x y)))
            `);

            expect(result.steps[2].nodes[1]).toMatchInlineSnapshot(`
                (add
                  (mul.exp a x)
                  (mul.exp a y)
                  (mul.exp b x)
                  (mul.exp b y))
            `);

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "distribution",
                "distribution",
                "distribution",
            ]);
        });
    });

    describe("checkFactoring", () => {
        it("a * b + a * c -> a * (b + c)", () => {
            const result = checkStep("a * b + a * c", "a * (b + c)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "factoring",
            ]);
        });

        it("ab + a -> a(b + 1)", () => {
            const result = checkStep("ab + a", "a(b + 1)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplication with identity", // a -> (a)(1)
                "factoring",
            ]);
        });

        it("a - ab -> (a)(1) + (-a)(b)", () => {
            const result = checkStep("a - ab", "(a)(1) + (-a)(b)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtracting is the same as adding the inverse",
                "multiplication with identity",
            ]);
        });

        it("a - ab -> a(1 - b)", () => {
            const result = checkStep("a - ab", "a(1 - b)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtracting is the same as adding the inverse",
                "multiplication with identity",
                "move negative to first factor",
                "factoring",
            ]);
        });

        it("-a - ab -> -a(1 + b)", () => {
            const result = checkStep("-a - ab", "-a(1 + b)");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtracting is the same as adding the inverse",
                "multiplication with identity", // -a -> (-a)(1)
                "factoring",
            ]);
        });

        it("2x + 3x -> (2 + 3)x", () => {
            const result = checkStep("2x + 3x", "(2 + 3)x");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "factoring",
            ]);
        });

        it("(2 + 3)x -> 5x", () => {
            const result = checkStep("(2 + 3)x", "5x");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "evaluation of addition",
            ]);
        });
    });

    describe("mulByZero", () => {
        it("0 -> 0 * a", () => {
            const result = checkStep("0", "0 * a");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplication by zero",
            ]);
        });

        it("a * 0 * b -> 0", () => {
            const result = checkStep("a * 0 * b", "0");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiplication by zero",
            ]);
        });
    });
});
