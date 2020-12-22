import * as Semantic from "@math-blocks/semantic";
import {parse, print} from "@math-blocks/testing";

import {solve} from "../solve";

type Node = Semantic.Types.Node;

describe("solve", () => {
    describe("linear equations", () => {
        test("2x + 3x = 7 - 4", () => {
            const ast = parse("2x + 3x = 7 - 4");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = 3 / 5");
        });

        test("2x = 7 + 3x", () => {
            const ast = parse("2x = 7 + 3x");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = -7");
        });

        test("-x / -1 = -7", () => {
            const ast = parse("-x / -1 = -7");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = -7");
        });

        test("7 + 3x = 2x", () => {
            const ast = parse("7 + 3x = 2x");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = -7");
        });

        test("2x + 5 = 7 + 3x", () => {
            const ast = parse("2x + 5 = 7 + 3x");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = -2");
        });

        test("2x + 1 = 7", () => {
            const ast = parse("2x + 1 = 7");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = 3");
        });

        test("7 = 2x + 1", () => {
            const ast = parse("7 = 2x + 1");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("3 = x");
        });

        test("x + 1 = -2x + 5", () => {
            const ast = parse("x + 1 = -2x + 5");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = 4 / 3");
        });

        test("-x + 1 = -2x + 5", () => {
            const ast = parse("-x + 1 = -2x + 5");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = 4");
        });

        test("2 - x = 5", () => {
            const ast = parse("2 - x = 5");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = -3");
        });

        test("2 - 2x = 5", () => {
            const ast = parse("2 - 2x = 5");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = 3 / -2");
        });

        test("2 - x = 5 - 3x", () => {
            const ast = parse("2 - x = 5 - 3x");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = 3 / 2");
        });

        test("-x + 3x = 3", () => {
            const ast = parse("-x + 3x = 3");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = 3 / 2");
        });

        test("2x + 3 = 3", () => {
            const ast = parse("2x + 3 = 3");

            const result: Node = solve(ast, Semantic.identifier("x"));

            expect(print(result)).toEqual("x = 0");
        });
    });
});
