import * as Solver from "@math-blocks/solver";

// NOTE: Some steps will have their own sub-steps which we may want
// to apply to help students better understand what the hint is doing.

export const getHint = (problem: Solver.Problem): Solver.Step => {
    const solution = Solver.solveProblem(problem);

    if (solution && solution.steps[0].substeps.length > 0) {
        // Grab the first step of the solution and apply it to the previous
        // math statement that the user has entered.
        return solution.steps[0].substeps[0];
    }

    throw new Error("Couldn't get a hint");
};
