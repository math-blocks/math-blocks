import {parse, print} from "@math-blocks/testing";

import {simplify} from "../simplify";

describe("simplify", () => {
    describe("collect like terms", () => {
        test("3x + 4x -> 7x", () => {
            const ast = parse("3x + 4x");

            const result = simplify(ast);

            expect(print(result)).toEqual("7x");
        });

        test("4x + -3x - 1 -> 7x - 1", () => {
            const ast = parse("4x + -3x - 1");

            const result = simplify(ast);

            expect(print(result)).toEqual("x - 1");
        });

        test("4x - 3x - 1 -> 7x - 1", () => {
            const ast = parse("4x - 3x - 1");

            const result = simplify(ast);

            expect(print(result)).toEqual("x - 1");
        });

        test("x + 1 + 4 -> x + 5", () => {
            const ast = parse("x + 1 + 4");

            const result = simplify(ast);

            expect(print(result)).toEqual("x + 5");
        });

        // drop parens
        test("(x + 1) + 4 -> x + 5", () => {
            const ast = parse("(x + 1) + 4");

            const result = simplify(ast);

            expect(print(result)).toEqual("x + 5");
        });

        // TODO: add test case where terms can be collected with parens
        // e.g. 1 - (2x + 3x) -> 1 - 5x

        test("3(x + 1) + 4 -> 3x + 7", () => {
            const ast = parse("3(x + 1) + 4");

            const result = simplify(ast);

            expect(print(result)).toEqual("3x + 7");
        });

        test("3(x + 1) -> 3x + 3", () => {
            const ast = parse("3(x + 1)");

            const result = simplify(ast);

            expect(print(result)).toEqual("3x + 3");
        });

        test("3 - (x + 1) -> x + 2", () => {
            const ast = parse("3 - (x + 1)");

            const result = simplify(ast);

            // TODO: add a transform that does -1x -> x and 1x -> x
            expect(print(result)).toEqual("-1x + 2");
        });

        test("3(x + 2(x - 1)) -> 3(3x - 2) -> 9x - 6", () => {
            const ast = parse("3(x + 2(x - 1))");

            const result = simplify(ast);

            expect(print(result)).toEqual("9x - 6");
        });

        test("(3)(3)(x) - 6 -> 9x - 6", () => {
            const ast = parse("(3)(3)(x) - 6");

            const result = simplify(ast);

            expect(print(result)).toEqual("9x - 6");
        });

        test("3(x + 1) + 4(x - 1) -> 7x - 1", () => {
            const ast = parse("3(x + 1) + 4(x - 1)");

            const result = simplify(ast);

            expect(print(result)).toEqual("7x - 1");
        });

        test("3x + (3)(1) + 4x + (4)(-1)", () => {
            const ast = parse("3x + (3)(1) + 4x + (4)(-1)");

            const result = simplify(ast);

            expect(print(result)).toEqual("7x - 1");
        });

        test("3(x + 1) - (2x + 5) -> x - 2", () => {
            const ast = parse("3(x + 1) - (2x + 5)");

            const result = simplify(ast);

            expect(print(result)).toEqual("x - 2");
        });

        test("(x + 1)(x + 3) -> x^2 + 4x + 3", () => {
            const ast = parse("(x + 1)(x + 3)");

            // Ideally I'd like to show the steps as:
            // - (x + 1)(x + 3)
            // - (x + 1)(x) + (x + 1)(3)
            // - (x)(x) + (1)(x) + (x)(3) + (1)(3) ... this currently missing
            // - x^2 + x + 3x + 3
            // - x^2 + 4x + 3

            const result = simplify(ast);

            expect(print(result)).toEqual("x^2 + 4x + 3");
        });

        test.skip("(x + 1)^2 -> x^2 + 2x + 1", () => {
            const ast = parse("(x + 1)^2");

            const result = simplify(ast);

            expect(print(result)).toEqual("x^2 + 2x + 1");
        });

        test("(x)(x) -> x^2", () => {
            const ast = parse("(x)(x)");

            const result = simplify(ast);

            expect(print(result)).toEqual("x^2");
        });

        test("(3)(3) -> 9", () => {
            const ast = parse("(3)(3)");

            const result = simplify(ast);

            expect(print(result)).toEqual("9");
        });

        test("banana -> ba^3n^2", () => {
            const ast = parse("banana");

            const result = simplify(ast);

            expect(print(result)).toEqual("ba^3n^2");
        });

        test.skip("(a^2)(a^3) -> a^5", () => {
            const ast = parse("(a^2)(a^3)");

            const result = simplify(ast);

            expect(print(result)).toEqual("a^5");
        });
    });
});
