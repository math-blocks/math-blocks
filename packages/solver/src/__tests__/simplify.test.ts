import {parse, print} from "@math-blocks/testing";

import {simplify} from "../simplify";

describe("simplify", () => {
    describe("collect like terms", () => {
        test("3x + 4x -> 7x", () => {
            const ast = parse("3x + 4x");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("7x");
        });

        test("x + 3x -> 4x", () => {
            const ast = parse("x + 3x");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("4x");
        });

        test("-x + 3x -> 2x", () => {
            const ast = parse("-x + 3x");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("2x");
        });

        // Shows that we drop the `1` in `-1x`
        test("x - 2x -> -x", () => {
            const ast = parse("x - 2x");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("-x");
        });

        // Shows that we convert additive inverse to subtraction where possible
        test("a + x - 2x -> a - x", () => {
            const ast = parse("a + x - 2x");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("a - x");
        });

        // Shows that we convert additive inverse to subtraction where possible
        test("a + 2x - 5x -> a - 3x", () => {
            const ast = parse("a + 2x - 5x");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("a - 3x");
        });

        // TODO: add transform that converts (neg (mul 2 x)) to (mul (neg 2 x))
        // or update how deal directly with the first and then add a transform that
        // converts (mul (neg 2) x) to (neg (mul 2 x)).  The second option seems easier.
        test("2x - (-3)(x) -> 5x", () => {
            const ast = parse("2x - (-3)(x)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("5x");
        });

        test("2x - -3x -> 5x", () => {
            const ast = parse("2x - -3x");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("5x");
        });

        test("5x + -3x -> 2x", () => {
            const ast = parse("5x + -3x");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("2x");
        });

        test("4x + -3x - 1 -> 7x - 1", () => {
            const ast = parse("4x + -3x - 1");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x - 1");
        });

        test("4x - 3x - 1 -> 7x - 1", () => {
            const ast = parse("4x - 3x - 1");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x - 1");
        });

        test("x + 1 + 4 -> x + 5", () => {
            const ast = parse("x + 1 + 4");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x + 5");
        });

        // drop parens
        test("(x + 1) + 4 -> x + 5", () => {
            const ast = parse("(x + 1) + 4");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "drop parentheses",
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x + 5");
        });

        // TODO: add test case where terms can be collected with parens
        // e.g. 1 - (2x + 3x) -> 1 - 5x

        test("3(x + 1) + 4 -> 3x + 7", () => {
            const ast = parse("3(x + 1) + 4");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("3x + 7");
        });

        test("3(x + 1) -> 3x + 3", () => {
            const ast = parse("3(x + 1)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
            ]);
            expect(print(step.after)).toEqual("3x + 3");
        });

        test("(1 + 2)(x + 1) -> 3x + 3", () => {
            const ast = parse("(1 + 2)(x + 1)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate addition",
                "distribute",
            ]);
            expect(print(step.after)).toEqual("3x + 3");
        });

        test("(6 * 1/2)(x + 1) -> 3x + 3", () => {
            const ast = parse("(6 * 1/2)(x + 1)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate multiplication",
                "distribute",
            ]);
            expect(print(step.after)).toEqual("3x + 3");
        });

        test("3 - (x + 1) -> -x + 2", () => {
            const ast = parse("3 - (x + 1)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "collect like terms",
            ]);

            // TODO: add a transform that does -1x -> x and 1x -> x
            expect(print(step.after)).toEqual("-1x + 2");
        });

        test("3 - 1x - 1 -> -x + 2", () => {
            const ast = parse("3 - 1x - 1");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "collect like terms",
            ]);

            expect(print(step.after)).toEqual("-1x + 2");
        });

        test("3(x + 2(x - 1)) -> 3(3x - 2) -> 9x - 6", () => {
            const ast = parse("3(x + 2(x - 1))");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "collect like terms",
                "distribute",
                "evaluate multiplication",
            ]);
            expect(print(step.after)).toEqual("9x - 6");
        });

        test("(3)(3)(x) - 6 -> 9x - 6", () => {
            const ast = parse("(3)(3)(x) - 6");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate multiplication",
            ]);
            expect(print(step.after)).toEqual("9x - 6");
        });

        test("3(x + 1) + 4(x - 1) -> 7x - 1", () => {
            const ast = parse("3(x + 1) + 4(x - 1)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("7x - 1");
        });

        test("3x + (3)(1) + 4x + (4)(-1)", () => {
            const ast = parse("3x + (3)(1) + 4x + (4)(-1)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate multiplication",
                "evaluate multiplication",
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("7x - 1");
        });

        test("3(x + 1) - (2x + 5) -> x - 2", () => {
            const ast = parse("3(x + 1) - (2x + 5)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute", // This covers both 3(x + 1) and - (2x + 5)
                "collect like terms",
            ]);
            expect(print(step.after)).toEqual("x - 2");
        });

        test("(x + 1)(x + 3) -> x^2 + 4x + 3", () => {
            const ast = parse("(x + 1)(x + 3)");

            // Ideally I'd like to show the steps as:
            // - (x + 1)(x + 3)
            // - (x + 1)(x) + (x + 1)(3)
            // - (x)(x) + (1)(x) + (x)(3) + (1)(3) ... this currently missing
            // - x^2 + x + 3x + 3
            // - x^2 + 4x + 3

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "distribute",
                "distribute",
                "collect like terms",
                "repeated multiplication can be written as a power",
            ]);
            expect(print(step.after)).toEqual("x^2 + 4x + 3");
        });

        test.skip("(x + 1)^2 -> x^2 + 2x + 1", () => {
            const ast = parse("(x + 1)^2");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate addition",
                "distribute",
            ]);
            expect(print(step.after)).toEqual("x^2 + 2x + 1");
        });

        test("(x)(x) -> x^2", () => {
            const ast = parse("(x)(x)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "repeated multiplication can be written as a power",
            ]);
            expect(print(step.after)).toEqual("x^2");
        });

        test("(3)(3) -> 9", () => {
            const ast = parse("(3)(3)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate multiplication",
            ]);
            expect(print(step.after)).toEqual("9");
        });

        test("banana -> ba^3n^2", () => {
            const ast = parse("banana");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "repeated multiplication can be written as a power",
            ]);
            expect(print(step.after)).toEqual("ba^3n^2");
        });

        test.skip("(a^2)(a^3) -> a^5", () => {
            const ast = parse("(a^2)(a^3)");

            const step = simplify(ast, []);

            if (!step) {
                throw new Error("no step return");
            }

            expect(step.message).toEqual("simplify expression");
            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "evaluate addition",
                "distribute",
            ]);
            expect(print(step.after)).toEqual("a^5");
        });
    });
});
