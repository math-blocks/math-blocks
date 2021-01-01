import {builders, types} from "@math-blocks/semantic";
import {parse, print} from "@math-blocks/testing";

import {solve as _solve} from "../solve";
import {Step} from "../types";

const solve = (node: types.Eq, ident: types.Ident): Step => {
    const result = _solve(node, ident);
    if (!result) {
        throw new Error("no step returned");
    }
    return result;
};

const parseEq = (input: string): types.Eq => {
    return parse(input) as types.Eq;
};

describe("solve", () => {
    describe("linear equations", () => {
        test("2x + 3x = 7 - 4", () => {
            const ast = parseEq("2x + 3x = 7 - 4");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = 3 / 5");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "simplify both sides",
                "divide both sides",
                "simplify the left hand side",
            ]);
            expect(
                result.substeps[0].substeps.map((step) => step.message),
            ).toEqual([
                "simplify the left hand side",
                "simplify the right hand side",
            ]);
            expect(
                result.substeps[0].substeps[0].substeps.map(
                    (step) => step.message,
                ),
            ).toEqual(["collect like terms"]);
            expect(
                result.substeps[0].substeps[1].substeps.map(
                    (step) => step.message,
                ),
            ).toEqual(["evaluate addition"]);
            expect(
                result.substeps[2].substeps.map((step) => step.message),
            ).toEqual(["reduce fraction"]);
        });

        test("2x = 7 + 3x", () => {
            const ast = parseEq("2x = 7 + 3x");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = -7");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify the left hand side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("-x / -1 = -7", () => {
            const ast = parseEq("-x / -1 = -7");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = -7");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "simplify the left hand side",
            ]);
        });

        test("7 + 3x = 2x", () => {
            const ast = parseEq("7 + 3x = 2x");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = -7");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify the left hand side",
            ]);
        });

        test("2x + 5 = 7 + 3x", () => {
            const ast = parseEq("2x + 5 = 7 + 3x");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = -2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify both sides",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("2x + 1 = 7", () => {
            const ast = parseEq("2x + 1 = 7");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = 3");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("7 = 2x + 1", () => {
            const ast = parseEq("7 = 2x + 1");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("3 = x");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("x + 1 = -2x + 5", () => {
            const ast = parseEq("x + 1 = -2x + 5");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = 4 / 3");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify both sides",
                "divide both sides",
                "simplify the left hand side",
            ]);
        });

        test("-x + 1 = -2x + 5", () => {
            const ast = parseEq("-x + 1 = -2x + 5");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = 4");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify both sides",
            ]);
        });

        test("2 - x = 5", () => {
            const ast = parseEq("2 - x = 5");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = -3");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("2 - 2x = 5", () => {
            const ast = parseEq("2 - 2x = 5");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = -(3 / 2)");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("2 - x = 5 - 3x", () => {
            const ast = parseEq("2 - x = 5 - 3x");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = 3 / 2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify both sides",
                "divide both sides",
                "simplify the left hand side",
            ]);
        });

        test("-x + 3x = 3", () => {
            const ast = parseEq("-x + 3x = 3");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = 3 / 2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "simplify the left hand side",
                "divide both sides",
                "simplify the left hand side",
            ]);
        });

        test("2x + 3 = 3", () => {
            const ast = parseEq("2x + 3 = 3");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = 0");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("3 = 2x", () => {
            const ast = parseEq("3 = 2x");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("3 / 2 = x");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "divide both sides",
                "simplify the right hand side",
            ]);
        });

        test("x / 4 = 1", () => {
            const ast = parseEq("x / 4 = 1");

            const result = solve(ast, builders.identifier("x"));

            // expect(print(result.after)).toEqual("x = 4");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "multiply both sides",
                "simplify both sides",
            ]);
        });

        test("1 = x / 4", () => {
            const ast = parseEq("1 = x / 4");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("4 = x");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "multiply both sides",
                "simplify both sides",
            ]);
        });

        test("2x / 3 = 1", () => {
            const ast = parseEq("2x / 3 = 1");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = 3 / 2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "multiply both sides",
                "simplify both sides",
                "divide both sides",
                "simplify the left hand side",
            ]);
            expect(print(result.substeps[0].after)).toEqual(
                "2x / 3 * 3 = 1 * 3",
            );
            expect(print(result.substeps[1].after)).toEqual("2x = 3");
            expect(print(result.substeps[2].after)).toEqual("2x / 2 = 3 / 2");
            expect(print(result.substeps[3].after)).toEqual("x = 3 / 2");
        });

        test("x / 2 + 1 = x / 3", () => {
            const ast = parseEq("x / 2 + 1 = x / 3");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = -6");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify the left hand side",
                "multiply both sides",
                "simplify both sides",
            ]);
        });

        test("x/2 + 1/2 = x/3 + 1/3", () => {
            const ast = parseEq("x/2 + 1/2 = x/3 + 1/3");

            const result = solve(ast, builders.identifier("x"));

            expect(print(result.after)).toEqual("x = -1");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "simplify both sides",
                "multiply both sides",
                "simplify both sides",
            ]);
        });
    });
});
