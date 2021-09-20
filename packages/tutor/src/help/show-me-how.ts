import {UnreachableCaseError} from "@math-blocks/core";
import * as Semantic from "@math-blocks/semantic";
import * as Solver from "@math-blocks/solver";

import {getHint} from "./get-hint";

export const showMeHow = (problem: Solver.Problem): Semantic.types.Node => {
    const hint = getHint(problem);

    // TODO: update applyStep to apply a Step to a Problem instead of just
    // some random Semantic.types.Node.

    switch (problem.type) {
        case "SimplifyExpression":
            return Solver.applyStep(problem.expression, hint);
        case "SolveEquation":
            return Solver.applyStep(problem.equation, hint);
        default:
            throw new UnreachableCaseError(problem);
    }
};
