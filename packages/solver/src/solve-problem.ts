import {solve} from "./solve/solve";
import {simplify} from "./simplify/simplify";

import type {Problem, Solution} from "./types";

export function solveProblem(problem: Problem): Solution | void {
    if (problem.type === "SimplifyExpression") {
        const step = simplify(problem.expression);
        if (step) {
            return {
                steps: [step],
                answer: step.after,
            };
        }
    } else if (problem.type === "SolveEquation") {
        const step = solve(problem.equation, problem.variable);
        if (step) {
            return {
                steps: [step],
                answer: step.after,
            };
        }
    }
}
