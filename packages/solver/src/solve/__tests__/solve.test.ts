import * as Semantic from "@math-blocks/semantic";
import {parse, print} from "@math-blocks/testing";

import {solve as _solve} from "../solve";
import {Step} from "../types";

const solve = (
    node: Semantic.Types.Node,
    ident: Semantic.Types.Ident,
): Step => {
    const result = _solve(node, ident);
    if (!result) {
        throw new Error("no step returned");
    }
    return result;
};

describe("solve", () => {
    describe("linear equations", () => {
        test("2x + 3x = 7 - 4", () => {
            const ast = parse("2x + 3x = 7 - 4");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = 3 / 5");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "simplify both sides",
                "divide both sides",
                "simplify the left hand side",
            ]);
        });

        test("2x = 7 + 3x", () => {
            const ast = parse("2x = 7 + 3x");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = -7");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify the left hand side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("-x / -1 = -7", () => {
            const ast = parse("-x / -1 = -7");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = -7");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "simplify the left hand side",
            ]);
        });

        test("7 + 3x = 2x", () => {
            const ast = parse("7 + 3x = 2x");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = -7");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify the left hand side",
            ]);
        });

        test("2x + 5 = 7 + 3x", () => {
            const ast = parse("2x + 5 = 7 + 3x");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = -2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify both sides",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("2x + 1 = 7", () => {
            const ast = parse("2x + 1 = 7");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = 3");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("7 = 2x + 1", () => {
            const ast = parse("7 = 2x + 1");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("3 = x");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("x + 1 = -2x + 5", () => {
            const ast = parse("x + 1 = -2x + 5");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = 4 / 3");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify both sides",
                "divide both sides",
                "simplify the left hand side",
            ]);
        });

        test("-x + 1 = -2x + 5", () => {
            const ast = parse("-x + 1 = -2x + 5");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = 4");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify both sides",
            ]);
        });

        test("2 - x = 5", () => {
            const ast = parse("2 - x = 5");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = -3");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("2 - 2x = 5", () => {
            const ast = parse("2 - 2x = 5");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = -(3 / 2)");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("2 - x = 5 - 3x", () => {
            const ast = parse("2 - x = 5 - 3x");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = 3 / 2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify both sides",
                "divide both sides",
                "simplify the left hand side",
            ]);
        });

        test("-x + 3x = 3", () => {
            const ast = parse("-x + 3x = 3");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = 3 / 2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "simplify the left hand side",
                "divide both sides",
                "simplify the left hand side",
            ]);
        });

        test("2x + 3 = 3", () => {
            const ast = parse("2x + 3 = 3");

            const result = solve(ast, Semantic.identifier("x"));

            expect(print(result.after)).toEqual("x = 0");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });
    });
});
