import * as Semantic from "@math-blocks/semantic";
import * as Testing from "@math-blocks/testing";
import type {Step} from "../../types";

import {solve as _solve} from "../solve";
import {toHaveSubstepsLike, toHaveFullStepsLike} from "../../test-util";

expect.extend({toHaveSubstepsLike, toHaveFullStepsLike});

const solve = (
    node: Semantic.types.Eq,
    ident: Semantic.types.Identifier,
): Step => {
    const result = _solve(node, ident);
    if (!result) {
        throw new Error("no step returned");
    }
    return result;
};

const parseEq = (input: string): Semantic.types.Eq => {
    return Testing.parse(input) as Semantic.types.Eq;
};

describe("solve", () => {
    describe("linear equations", () => {
        test("2x + 5 = 10", () => {
            const ast = parseEq("2x + 5 = 10");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 5 / 2");

            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify the left hand side",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: result.substeps,
                expressions: [
                    "2x + 5 = 10",
                    "2x = 5",
                    "2x / 2 = 5 / 2",
                    "x = 5 / 2",
                ],
            });
        });

        // TODO: update 'simplify' to deal with '+ 0'
        test("2x + 0 = 5", () => {
            const ast = parseEq("2x + 0 = 5");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 5 / 2");

            expect(result.substeps.map((step) => step.message)).toEqual([
                "simplify the left hand side",
                "divide both sides",
                "simplify the left hand side",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: result.substeps,
                expressions: [
                    "2x + 0 = 5",
                    "2x = 5",
                    "2x / 2 = 5 / 2",
                    "x = 5 / 2",
                ],
            });
        });

        test("2x + 3x = 7 - 4", () => {
            const ast = parseEq("2x + 3x = 7 - 4");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 3 / 5");
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

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = -7");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("-x / -1 = -7", () => {
            const ast = parseEq("-x / -1 = -7");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = -7");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "simplify the left hand side",
            ]);
        });

        test("7 + 3x = 2x", () => {
            const ast = parseEq("7 + 3x = 2x");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = -7");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
            ]);
        });

        test("2x + 5 = 7 + 3x", () => {
            const ast = parseEq("2x + 5 = 7 + 3x");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = -2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("2x + 1 = 7", () => {
            const ast = parseEq("2x + 1 = 7");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 3");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: result.substeps,
                expressions: [
                    "2x + 1 = 7",
                    "2x = 6",
                    "2x / 2 = 6 / 2",
                    "x = 3",
                ],
            });
        });

        test("7 = 2x + 1", () => {
            const ast = parseEq("7 = 2x + 1");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 3");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: result.substeps,
                expressions: [
                    "7 = 2x + 1",
                    "-2x = -6",
                    "-2x / -2 = -6 / -2",
                    "x = 3",
                ],
            });
        });

        test("x + 1 = -2x + 5", () => {
            const ast = parseEq("x + 1 = -2x + 5");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 4 / 3");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify the left hand side",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: result.substeps,
                expressions: [
                    "x + 1 = -2x + 5",
                    "3x = 4",
                    "3x / 3 = 4 / 3",
                    "x = 4 / 3",
                ],
            });
        });

        test("-x + 1 = -2x + 5", () => {
            const ast = parseEq("-x + 1 = -2x + 5");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 4");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
            ]);
        });

        test("2 - x = 5", () => {
            const ast = parseEq("2 - x = 5");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = -3");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);
        });

        test("2 - 2x = 5", () => {
            const ast = parseEq("2 - 2x = 5");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = -(3 / 2)");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: result.substeps,
                expressions: [
                    "2 - 2x = 5",
                    "-2x = 3",
                    "-2x / -2 = 3 / -2",
                    "x = -(3 / 2)",
                ],
            });
        });

        test("2 - x = 5 - 3x", () => {
            const ast = parseEq("2 - x = 5 - 3x");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 3 / 2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify the left hand side",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: result.substeps,
                expressions: [
                    "2 - x = 5 - 3x",
                    "2x = 3",
                    "2x / 2 = 3 / 2",
                    "x = 3 / 2",
                ],
            });
        });

        test("-x + 3x = 3", () => {
            const ast = parseEq("-x + 3x = 3");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 3 / 2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "simplify the left hand side",
                "divide both sides",
                "simplify the left hand side",
            ]);
        });

        test("2x + 3 = 3", () => {
            const ast = parseEq("2x + 3 = 3");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 0");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "divide both sides",
                "simplify both sides",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: result.substeps,
                expressions: [
                    "2x + 3 = 3",
                    "2x = 0",
                    "2x / 2 = 0 / 2",
                    "x = 0",
                ],
            });
        });

        test("3 = 2x", () => {
            const ast = parseEq("3 = 2x");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("3 / 2 = x");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "divide both sides",
                "simplify the right hand side",
            ]);
        });

        test("x / 4 = 1", () => {
            const ast = parseEq("x / 4 = 1");

            const result = solve(ast, Semantic.builders.identifier("x"));

            // expect(Testing.print(result.after)).toEqual("x = 4");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "multiply both sides",
                "simplify both sides",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: result.substeps,
                expressions: ["x / 4 = 1", "x / 4 * 4 = 1 * 4", "x = 4"],
            });
        });

        test("1 = x / 4", () => {
            const ast = parseEq("1 = x / 4");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("4 = x");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "multiply both sides",
                "simplify both sides",
            ]);
        });

        test("2x / 3 = 1", () => {
            const ast = parseEq("2x / 3 = 1");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = 3 / 2");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "multiply both sides",
                "simplify both sides",
                "divide both sides",
                "simplify the left hand side",
            ]);
            expect(Testing.print(result.substeps[0].after)).toEqual(
                "2x / 3 * 3 = 1 * 3",
            );
            expect(Testing.print(result.substeps[1].after)).toEqual("2x = 3");
            expect(Testing.print(result.substeps[2].after)).toEqual(
                "2x / 2 = 3 / 2",
            );
            expect(Testing.print(result.substeps[3].after)).toEqual(
                "x = 3 / 2",
            );
        });

        test("x / 2 + 1 = x / 3", () => {
            const ast = parseEq("x / 2 + 1 = x / 3");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = -6");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "multiply both sides",
                "simplify both sides",
            ]);
        });

        test("x/2 + 1/2 = x/3 + 1/3", () => {
            const ast = parseEq("x/2 + 1/2 = x/3 + 1/3");

            const result = solve(ast, Semantic.builders.identifier("x"));

            expect(Testing.print(result.after)).toEqual("x = -1");
            expect(result.substeps.map((step) => step.message)).toEqual([
                "move terms to one side",
                "multiply both sides",
                "simplify both sides",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: result.substeps,
                expressions: [
                    "x / 2 + 1 / 2 = x / 3 + 1 / 3",
                    "x / 6 = -(1 / 6)",
                    "x / 6 * 6 = -(1 / 6) * 6",
                    "x = -1",
                ],
            });
        });

        test("x = 5/2", () => {
            // Arrange
            const ast = parseEq("x = 5 / 2");

            // Act
            const result = solve(ast, Semantic.builders.identifier("x"));

            // Assert
            expect(Testing.print(result.after)).toEqual("x = 5 / 2");
            expect(result.substeps).toHaveLength(0);
        });
    });
});
