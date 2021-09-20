import * as Semantic from "@math-blocks/semantic";
import * as Solver from "@math-blocks/solver";
import * as Testing from "@math-blocks/testing";

import {getHint} from "../get-hint";

const parseEq = (input: string): Semantic.types.Eq => {
    return Testing.parse(input) as Semantic.types.Eq;
};

describe("#getHint", () => {
    it("should work with equations", () => {
        const problem: Solver.Problem = {
            type: "SolveEquation",
            equation: parseEq("2x + 5 = 10"),
            variable: Semantic.builders.identifier("x"),
        };

        const hint = getHint(problem);

        expect(hint.message).toMatchInlineSnapshot(`"move terms to one side"`);
    });

    it("should work with expressions", () => {
        const problem: Solver.Problem = {
            type: "SimplifyExpression",
            expression: Testing.parse("2x + 3x") as Semantic.types.NumericNode,
        };

        const hint = getHint(problem);

        expect(hint.message).toMatchInlineSnapshot(`"collect like terms"`);
    });
});
