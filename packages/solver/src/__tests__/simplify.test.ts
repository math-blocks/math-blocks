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

        test.skip("3(x + 2(x - 1)) -> 3(3x - 2) -> 9x - 6", () => {
            const ast = parse("3(x + 2(x - 1))");

            const result = simplify(ast);

            // TODO: handle nesting
            // right now this transforms to 3x + (3)(2)(x - 1)
            // we could add a transform to handle this but we probably want to
            // traverse the tree structure and apply rules from the innermost
            // expression outwards
            expect(print(result)).toEqual("3x + 7");
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

            // We consider subtraction simpler than adding the inverse
            // TODO: add a transform from a + -b -> a - b
            expect(print(result)).toEqual("x - 2");
        });
    });
});
