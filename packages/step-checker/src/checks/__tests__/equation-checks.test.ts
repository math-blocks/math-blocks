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

        it("x + 5 = y + 5 -> x = y", () => {
            const result = checkStep("x + 5 = y + 5", "x = y");

            expect(result).toBeTruthy();
            expect(result.steps).toHaveLength(3);

            expect(result.steps[0].message).toEqual(
                "subtract the same value from both sides",
            );
            expect(result.steps[0].nodes[0]).toParseLike("x + 5 = y + 5");
            expect(result.steps[0].nodes[1]).toParseLike(
                "x + 5 - 5 = y + 5 - 5",
            );

            expect(result.steps[1].message).toEqual("adding inverse");
            expect(result.steps[1].nodes[0]).toParseLike("x + 5 - 5");
            expect(result.steps[1].nodes[1]).toParseLike("x");

            expect(result.steps[2].message).toEqual("adding inverse");
            expect(result.steps[2].nodes[0]).toParseLike("y + 5 - 5");
            expect(result.steps[2].nodes[1]).toParseLike("y");
        });

        it("x + 5 = y + 5 + 5 -> x = y + 5", () => {
            const result = checkStep("x + 5 = y + 5 + 5", "x = y + 5");

            expect(result).toBeTruthy();
            expect(result.steps).toHaveLength(3);

            expect(result.steps[0].message).toEqual(
                "subtract the same value from both sides",
            );
            expect(result.steps[0].nodes[0]).toParseLike("x + 5 = y + 5 + 5");
            expect(result.steps[0].nodes[1]).toParseLike(
                "x + 5 - 5 = y + 5 + 5 - 5",
            );

            expect(result.steps[1].message).toEqual("adding inverse");
            expect(result.steps[1].nodes[0]).toParseLike("x + 5 - 5");
            expect(result.steps[1].nodes[1]).toParseLike("x");

            expect(result.steps[2].message).toEqual("adding inverse");
            expect(result.steps[2].nodes[0]).toParseLike("y + 5 + 5 - 5");
            expect(result.steps[2].nodes[1]).toParseLike("y + 5");
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
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtracting the same value from both sides",
            ]);
        });

        it("x - 5 = y - 5 -> x = y", () => {
            const result = checkStep("x - 5 = y - 5", "x = y");

            expect(result).toBeTruthy();
            expect(result.steps).toHaveLength(3);

            expect(result.steps[0].message).toEqual(
                "subtract the same value from both sides",
            );
            expect(result.steps[0].nodes[0]).toParseLike("x - 5 = y - 5");
            expect(result.steps[0].nodes[1]).toParseLike(
                "x - 5 + 5 = y - 5 + 5",
            );

            expect(result.steps[1].message).toEqual("adding inverse");
            expect(result.steps[1].nodes[0]).toParseLike("x - 5 + 5");
            expect(result.steps[1].nodes[1]).toParseLike("x");

            expect(result.steps[2].message).toEqual("adding inverse");
            expect(result.steps[2].nodes[0]).toParseLike("y - 5 + 5");
            expect(result.steps[2].nodes[1]).toParseLike("y");
        });

        it("x + 10 = y + 15 -> x + 10 - 5 -> y + 15 - 5", () => {
            const result = checkStep(
                "x + 10 = y + 15",
                "x + 10 - 5 = y + 15 - 5",
            );

            expect(result).toBeTruthy();
            expect(result.steps.map((reason) => reason.message)).toEqual([
                "subtracting the same value from both sides",
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

            // The reason why there are so many substeps, is that cancelling
            // values in the numerator and denominator result it lots of sub steps.
            expect(result.steps).toHaveLength(9);

            expect(result.steps[0].message).toEqual(
                "divide both sides by the same value",
            );
            expect(result.steps[0].nodes[0]).toParseLike("2(x + 2.5) = (5)2");
            expect(result.steps[0].nodes[1]).toParseLike(
                "2(x + 2.5) / 2 = (5)(2) / 2",
            );
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
            expect(result.steps).toHaveLength(11);

            expect(result.steps[0].message).toEqual(
                "multiply both sides by the same value",
            );
            expect(result.steps[0].nodes[0]).toParseLike("x / 5 = y / 5");
            // TODO: decide when we want implicit vs. explicit multiplication in the substeps
            expect(result.steps[0].nodes[1]).toParseLike(
                "5 * (x / 5) = 5 * (y / 5)",
            );
        });

        it("x = y -> x / 5 = y / 10 [incorrect step]", () => {
            expect(() => checkStep("x = y", "x / 5 = y / 10")).toThrow();
        });
    });
});
