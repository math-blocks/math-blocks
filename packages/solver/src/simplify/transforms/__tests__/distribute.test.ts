import {types} from "@math-blocks/semantic";
import {parse, print} from "@math-blocks/testing";

import {applyStep} from "../../../apply-step";

import {distribute as _distribute} from "../distribute";
import {Step} from "../../types";

import {toHaveSubstepsLike, toHaveFullStepsLike} from "../../../test-util";

expect.extend({toHaveSubstepsLike, toHaveFullStepsLike});

// TODO: recursively handle steps with sub-steps
const applySteps = (node: types.Node, steps: Step[]): types.Node => {
    let result = node;
    for (const step of steps) {
        result = applyStep(result, step);
    }
    return result;
};

const distribute = (node: types.Node): Step => {
    const result = _distribute(node, []);
    if (!result) {
        throw new Error("no step returned");
    }
    return result;
};

describe("distribution", () => {
    test("a(b + c) -> ab + ac", () => {
        const ast = parse("a(b + c)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("ab + ac");
        expect(print(applySteps(ast, step.substeps))).toEqual("ab + ac");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "multiply each term",
        ]);
    });

    test("x + a(b + c) -> x + ab + ac", () => {
        const ast = parse("x + a(b + c)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("x + ab + ac");
        expect(print(applySteps(ast, step.substeps))).toEqual("x + ab + ac");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "multiply each term",
        ]);
    });

    test("3(x + 1) -> 3x + 3", () => {
        const ast = parse("3(x + 1)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("3x + 3");
        expect(print(applySteps(ast, step.substeps))).toEqual("3x + 3");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "multiply each term",
            "multiply monomials",
        ]);
        expect(step).toHaveSubstepsLike([
            ["3(x + 1)", "3x + (3)(1)"],
            ["(3)(1)", "3"],
        ]);
    });

    test("(x + 1)(3) -> 3x + 3", () => {
        const ast = parse("(x + 1)(3)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("3x + 3");
        expect(print(applySteps(ast, step.substeps))).toEqual("3x + 3");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "multiply each term",
            "multiply monomials",
            "multiply monomials",
        ]);
        expect(step).toHaveSubstepsLike([
            ["(x + 1)(3)", "(x)(3) + (1)(3)"],
            ["(x)(3)", "3x"],
            ["(1)(3)", "3"],
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "(x + 1)(3)",
                "(x)(3) + (1)(3)",
                "3x + (1)(3)",
                "3x + 3",
            ],
        });
    });

    test("(x - 1)(3) -> 3x - 3", () => {
        const ast = parse("(x - 1)(3)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("3x - 3");
        expect(print(applySteps(ast, step.substeps))).toEqual("3x - 3");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the negative",
            "multiply each term",
            "multiply monomials",
            "multiplying a negative by a positive is negative",
            "adding the negative is the same as subtraction",
        ]);
        expect(step).toHaveSubstepsLike([
            ["-1", "-1"], // subtraction -> add inverse
            ["(x + -1)(3)", "(x)(3) + (-1)(3)"],
            ["(x)(3)", "3x"],
            ["(-1)(3)", "-3"],
            ["-3", "-3"], // add inverse -> subtraction
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "(x - 1)(3)",
                "(x + -1)(3)",
                "(x)(3) + (-1)(3)",
                "3x + (-1)(3)",
                "3x + -3",
                "3x - 3",
            ],
        });
    });

    test("3(x + 1) + 4 -> 3x + 3 + 4", () => {
        const ast = parse("3(x + 1) + 4");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("3x + 3 + 4");
        expect(print(applySteps(ast, step.substeps))).toEqual("3x + 3 + 4");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "multiply each term",
            "multiply monomials",
        ]);

        expect(step).toHaveSubstepsLike([
            ["3(x + 1)", "3x + (3)(1)"],
            ["(3)(1)", "3"],
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: ["3(x + 1) + 4", "3x + (3)(1) + 4", "3x + 3 + 4"],
        });
    });

    test("3(x + y + z) -> 3x + 3y + 3z", () => {
        const ast = parse("3(x + y + z)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("3x + 3y + 3z");
        expect(print(applySteps(ast, step.substeps))).toEqual("3x + 3y + 3z");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "multiply each term",
        ]);
    });

    test("(-2)(x - 3) -> -2x + 6", () => {
        const ast = parse("(-2)(x - 3)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("-2x + 6");
        expect(print(applySteps(ast, step.substeps))).toEqual("-2x + 6");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the negative",
            "multiply each term",
            "multiplying a negative by a positive is negative",
            "multiplying two negatives is a positive",
        ]);
        expect(step).toHaveSubstepsLike([
            ["-3", "-3"], // subtraction to addition -> inverse
            ["-2(x + -3)", "-2x + (-2)(-3)"], // TODO: figure out why this step wasn't applied
            ["-2x", "-2x"], // we're printing both (-2)(x) and -(2x) as the same thing here
            // If the printed values are the same we should elide the step
            // This means we set `after` to be (-2)(x) with -(2x) without reporting a substep
            // It's bit a more complicatated than that becuase we want the `-2x` that appears
            // in the previous step's `after` to be replaced.  We really need to find a way
            // to do this automatically if possible.
            ["(-2)(-3)", "6"],
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "-2(x - 3)",
                "-2(x + -3)",
                "-2x + (-2)(-3)",
                "-2x + (-2)(-3)", // we're printing both (-2)(x) and -(2x) as the same thing here
                // If the printed values are the same we should elide the step
                // This means we set `after` to be (-2)(x) with -(2x) without reporting a substep
                // It's bit a more complicatated than that becuase we want the `-2x` that appears
                // in the previous step's `after` to be replaced.  We really need to find a way
                // to do this automatically if possible.
                "-2x + 6",
            ],
        });
    });

    test("3 - (x + 1) -> -x + 2", () => {
        const ast = parse("3 - (x + 1)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("3 - x - 1");
        expect(print(applySteps(ast, step.substeps))).toEqual("3 - x - 1");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "negation is the same as multipyling by one",
            "multiply each term",
            "multiplying a negative by a positive is negative",
            "multiplying a negative by a positive is negative",
            "adding the negative is the same as subtraction",
            "adding the negative is the same as subtraction",
        ]);

        expect(step).toHaveSubstepsLike([
            ["-(x + 1)", "-1(x + 1)"],
            ["-1(x + 1)", "-1x + (-1)(1)"],
            ["-1x", "-x"],
            ["(-1)(1)", "-1"],
            ["-x", "-x"], // add inverse -> subtraction
            ["-1", "-1"], // add inverse -> subtraction
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "3 - (x + 1)",
                "3 + -1(x + 1)",
                "3 + -1x + (-1)(1)",
                "3 + -x + (-1)(1)",
                "3 + -x + -1",
                "3 - x + -1",
                "3 - x - 1",
            ],
        });
    });

    test("(ab)(xy - yz)", () => {
        const ast = parse("(ab)(xy - yz)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("abxy - abyz");
        expect(print(applySteps(ast, step.substeps))).toEqual("abxy - abyz");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the negative",
            "multiply each term",
            "multiply monomials",
            "multiplying a negative by a positive is negative",
            "adding the negative is the same as subtraction",
        ]);

        expect(step).toHaveSubstepsLike([
            ["-yz", "-yz"], // subtraction -> add inverse
            ["(ab)(xy + -yz)", "(ab)(xy) + (ab)(-yz)"],
            ["(ab)(xy)", "abxy"],
            ["(ab)(-yz)", "-abyz"],
            ["-abyz", "-abyz"], // add inverse -> subtraction
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "(ab)(xy - yz)",
                "(ab)(xy + -yz)",
                "(ab)(xy) + (ab)(-yz)",
                "abxy + (ab)(-yz)",
                "abxy + -abyz",
                "abxy - abyz",
            ],
        });
    });

    test("(-ab)(xy - yz)", () => {
        const ast = parse("(-ab)(xy - yz)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("-abxy + abyz");
        expect(print(applySteps(ast, step.substeps))).toEqual("-abxy + abyz");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the negative",
            "multiply each term",
            "multiplying a negative by a positive is negative",
            "multiplying two negatives is a positive",
        ]);
    });

    // `distribute` only performs one distribution at a time
    test("3(x + 1) + 4(x - 1) -> 3x + 3 + 4(x - 1)", () => {
        const ast = parse("3(x + 1) + 4(x - 1)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("3x + 3 + 4(x - 1)");
        expect(print(applySteps(ast, step.substeps))).toEqual(
            "3x + 3 + 4(x - 1)",
        );

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "multiply each term",
            "multiply monomials",
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "3(x + 1) + 4(x - 1)",
                "3x + (3)(1) + 4(x - 1)",
                "3x + 3 + 4(x - 1)",
            ],
        });
    });

    test("x(x + 1) -> xx + x", () => {
        const ast = parse("x(x + 1)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("xx + x");
        expect(print(applySteps(ast, step.substeps))).toEqual("xx + x");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "multiply each term",
            "multiply monomials",
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: ["x(x + 1)", "xx + (x)(1)", "xx + x"],
        });
    });

    test("x(x - 1) -> xx - x", () => {
        const ast = parse("x(x - 1)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("xx - x");
        expect(print(applySteps(ast, step.substeps))).toEqual("xx - x");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the negative",
            "multiply each term",
            "multiplying a negative by a positive is negative",
            "adding the negative is the same as subtraction",
        ]);

        expect(step).toHaveSubstepsLike([
            ["-1", "-1"], // subtraction -> add inverse
            ["x(x + -1)", "xx + (x)(-1)"],
            ["(x)(-1)", "-x"],
            ["-x", "-x"], // add inverse -> subtraction
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "x(x - 1)",
                "x(x + -1)",
                "xx + (x)(-1)",
                "xx + -x",
                "xx - x",
            ],
        });
    });
});
