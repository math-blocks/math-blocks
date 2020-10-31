import {parse} from "@math-blocks/text-parser";
import {serializer} from "@math-blocks/semantic";

import {deepEquals} from "../../util";
import {checkStep} from "../test-util";

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

describe("Equation checks", () => {
    describe("adding the same value to both sides", () => {
        it("x = y -> x + 5 = y + 5", () => {
            const result = checkStep("x = y", "x + 5 = y + 5");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x = y -> x + 5 + 10 = y + 5 + 10", () => {
            const result = checkStep("x = y", "x + 5 + 10 = y + 5 + 10");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x = y -> x + 5 + 10 = y + 15", () => {
            const result = checkStep("x = y", "x + 5 + 10 = y + 15");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "adding the same value to both sides",
                "evaluation of addition",
            ]);

            expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`(eq x y)`);
            expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`
                (eq
                  (add x 5 10)
                  (add y 15))
            `);
        });

        it("x + 5 = y + 5 -> x = y", () => {
            const result = checkStep("x + 5 = y + 5", "x = y");

            expect(result).toBeTruthy();

            expect(result.steps.map((step) => step.message)).toEqual([
                "removing adding the same value to both sides",
            ]);
            expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`
                (eq
                  (add x 5)
                  (add y 5))
            `);
            expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`(eq x y)`);
        });

        it("x + 5 = y + 5 + 5 -> x = y + 5", () => {
            const result = checkStep("x + 5 = y + 5 + 5", "x = y + 5");

            expect(result).toBeTruthy();
            expect(result.steps.map((step) => step.message)).toEqual([
                "removing adding the same value to both sides",
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("x + 5 = y + 5 + 5");
            expect(result.steps[0].nodes[1]).toParseLike("x = y + 5");
        });

        it("x + 5 - 5 = y + 5 + 5 - 5 -> x = y + 5", () => {
            const result = checkStep("x + 5 - 5 = y + 5 + 5 - 5", "x = y + 5");

            expect(result).toBeTruthy();
            expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`
                (add
                  x
                  5
                  (neg.sub 5))
            `);
            expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`x`);
            expect(result.steps[1].nodes[0]).toMatchInlineSnapshot(`
                (add
                  y
                  5
                  5
                  (neg.sub 5))
            `);
            expect(result.steps[1].nodes[1]).toMatchInlineSnapshot(`(add y 5)`);

            expect(result.steps.map((step) => step.message)).toEqual([
                "adding inverse",
                "adding inverse",
            ]);
        });

        it("x = y -> 5 + x = y + 5", () => {
            const result = checkStep("x = y", "5 + x = y + 5");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "adding the same value to both sides",
                "commutative property",
            ]);
        });

        it("x + 10 = y + 15 -> x + 10 + 5 = y + 15 + 5", () => {
            const result = checkStep(
                "x + 10 = y + 15",
                "x + 10 + 5 = y + 15 + 5",
            );

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("2x + 5 = 10 -> 2x + 5 - 5 = 10 [incorrect]", () => {
            expect(() => checkStep("2x + 5 = 10", "2x + 5 - 5 = 10")).toThrow();
        });
    });

    describe("subtracting the same value from both sides", () => {
        it("x = y -> x - 5 = y - 5", () => {
            const result = checkStep("x = y", "x - 5 = y - 5");

            expect(result).toBeTruthy();
            // TODO: customize this message for subtraction
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("x - 5 = y - 5 -> x = y", () => {
            const result = checkStep("x - 5 = y - 5", "x = y");

            expect(result).toBeTruthy();
            // TODO: customize this to add the same value to both sides
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "removing adding the same value to both sides",
            ]);

            expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`
                (eq
                  (add
                    x
                    (neg.sub 5))
                  (add
                    y
                    (neg.sub 5)))
            `);
            expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`(eq x y)`);
        });

        it("x + 10 = y + 15 -> x + 10 - 5 -> y + 15 - 5", () => {
            const result = checkStep(
                "x + 10 = y + 15",
                "x + 10 - 5 = y + 15 - 5",
            );

            expect(result).toBeTruthy();
            // TODO: customize this to add the same value to both sides
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "adding the same value to both sides",
            ]);
        });

        it("2x + 5 = 10 -> 2x + 5 - 5 = 10 - 10 [incorrect step]", () => {
            expect(() =>
                checkStep("2x + 5 = 10", "2x + 5 - 5 = 10 - 10"),
            ).toThrow();
        });

        it("2x + 5 - 5 = 10 - 5 -> 2x + 5 - 5 = 5", () => {
            const result = checkStep("2x + 5 - 5 = 10 - 5", "2x + 5 - 5 = 5");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "evaluation of addition",
            ]);
        });
    });

    describe("multiplying both sides by the same value", () => {
        it("x = y -> x * 5 = y * 5", () => {
            const result = checkStep("x = y", "x * 5 = y * 5");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiply both sides by the same value",
            ]);
        });

        // It's okay to multiply by different expressions as long as the expressions
        // are equivalent to each other
        it("x = y -> x * 5 * 2 = y * 10", () => {
            const result = checkStep("x = y", "x * 5 * 2 = y * 10");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiply both sides by the same value",
                "evaluation of multiplication",
            ]);

            expect(result.steps[0].nodes[0]).toParseLike("x = y");
            expect(result.steps[0].nodes[1]).toParseLike("x * 5 * 2 = y * 10");
            expect(result.steps[1].nodes[0]).toParseLike("5 * 2");
            expect(result.steps[1].nodes[1]).toParseLike("10");
        });

        it("x * 10 = y * 15 -> x * 10 * 5 = y * 15 * 5", () => {
            const result = checkStep(
                "x * 10 = y * 15",
                "x * 10 * 5 = y * 15 * 5",
            );

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "multiply both sides by the same value",
            ]);
        });

        test("2(x + 2.5) = (5)2 -> x + 2.5 = 5", () => {
            const result = checkStep("2(x + 2.5) = (5)2", "x + 2.5 = 5");

            expect(result).toBeTruthy();

            expect(result.steps.map((step) => step.message)).toEqual([
                "commutative property",
                "remove multiplication from both sides",
            ]);

            expect(result.steps[0].nodes[0]).toMatchInlineSnapshot(`
                (mul.imp
                  2
                  (add x 2.5))
            `);
            expect(result.steps[0].nodes[1]).toMatchInlineSnapshot(`
                (mul.exp
                  (add x 2.5)
                  2)
            `);

            expect(result.steps[1].nodes[0]).toParseLike("2(x + 2.5) = (5)2");
            expect(result.steps[1].nodes[1]).toParseLike("x + 2.5 = 5");
        });
    });

    describe("dividing both sides", () => {
        it("x = y -> x / 5 = y / 5", () => {
            const result = checkStep("x = y", "x / 5 = y / 5");

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "divide both sides by the same value",
            ]);
        });

        it("x / 5 = y / 5 -> x = y", () => {
            const result = checkStep("x / 5 = y / 5", "x = y");

            expect(result).toBeTruthy();
            expect(result.steps).toHaveLength(1);

            expect(result.steps[0].message).toEqual(
                "remove division by the same amount",
            );
            expect(result.steps[0].nodes[0]).toParseLike("x / 5 = y / 5");
            expect(result.steps[0].nodes[1]).toParseLike("x = y");
        });

        it("x = y -> x / 5 = y / 10 [incorrect step]", () => {
            expect(() => checkStep("x = y", "x / 5 = y / 10")).toThrow();
        });
    });
});
