import * as Semantic from "@math-blocks/semantic";
import * as Testing from "@math-blocks/testing";

import {solveProblem} from "../solve-problem";

import type {Problem} from "../types";

const parseEq = (input: string): Semantic.types.Eq => {
    return Testing.parse(input) as Semantic.types.Eq;
};

describe("solveProblem", () => {
    it("should solve linear equations", () => {
        const ast = parseEq("2x + 5 = 10");

        const problem: Problem = {
            type: "SolveEquation",
            equation: ast,
            variable: Semantic.builders.identifier("x"),
        };
        const result = solveProblem(problem);

        if (!result) {
            throw new Error("the equation couldn't be solved");
        }
        expect(Testing.print(result.answer)).toEqual("x = 5 / 2");
    });

    it("should simplify numeric expressions", () => {
        const problem: Problem = {
            type: "SimplifyExpression",
            expression: Testing.parse("3x - 2x") as Semantic.types.NumericNode,
        };
        const result = solveProblem(problem);

        if (!result) {
            throw new Error("the expression couldn't be simplified");
        }
        expect(Testing.print(result.answer)).toEqual("x");
    });
});
