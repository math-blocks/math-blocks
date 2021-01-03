import {types} from "@math-blocks/semantic";
import {parse, print} from "@math-blocks/testing";

import {applyStep} from "../../../apply-step";

import {collectLikeTerms as _collectLikeTerms} from "../collect-like-terms";
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

const collectLikeTerms = (node: types.Node): Step => {
    const result = _collectLikeTerms(node, []);
    if (!result) {
        throw new Error("no step returned");
    }
    return result;
};

describe("collect like terms", () => {
    test("2x + 3x -> 5x", () => {
        const ast = parse("2x + 3x");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("5x");
        expect(print(applySteps(ast, step.substeps))).toEqual("5x");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "factor variable part of like terms", // substeps
            "compute new coefficients", // substeps
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: ["2x + 3x", "(2 + 3)x", "5x"],
        });
    });

    test("2x + 1 + 3x -> 5x + 1", () => {
        const ast = parse("2x + 1 + 3x");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("5x + 1");
        expect(print(applySteps(ast, step.substeps))).toEqual("5x + 1");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "reorder terms so that like terms are beside each other",
            "factor variable part of like terms", // substeps
            "compute new coefficients", // substeps
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "2x + 1 + 3x",
                "2x + 3x + 1",
                "(2 + 3)x + 1",
                "5x + 1",
            ],
        });
    });

    test("2x - 1 + 3x -> 5x - 1", () => {
        const ast = parse("2x - 1 + 3x");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("5x - 1");
        expect(print(applySteps(ast, step.substeps))).toEqual("5x - 1");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the inverse",
            "reorder terms so that like terms are beside each other",
            "factor variable part of like terms", // substeps
            "compute new coefficients", // substeps
            "adding the inverse is the same as subtraction",
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "2x - 1 + 3x",
                "2x + -1 + 3x",
                "2x + 3x + -1",
                "(2 + 3)x + -1",
                "5x + -1",
                "5x - 1",
            ],
        });
    });

    test("2x + 3x -> unchanged", () => {
        const ast = parse("2x + 3y");

        expect(() => collectLikeTerms(ast)).toThrowErrorMatchingInlineSnapshot(
            `"no step returned"`,
        );
    });

    test("x + 3x -> 4x", () => {
        const ast = parse("x + 3x");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("4x");
    });

    test("-x + 3x -> 2x", () => {
        const ast = parse("-x + 3x");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("2x");
    });

    // Shows that we drop the `1` in `-1x`
    test("x - 2x -> -x", () => {
        const ast = parse("x - 2x");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("-x");
        expect(print(applySteps(ast, step.substeps))).toEqual("-x");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the inverse",
            "factor variable part of like terms", // substeps
            "compute new coefficients", // substeps
            "simplify terms",
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: ["x - 2x", "x + -2x", "(1 + -2)x", "-1x", "-x"],
        });
    });

    // Shows that we convert additive inverse to subtraction where possible
    test("a + x - 2x -> a - x", () => {
        const ast = parse("a + x - 2x");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("a - x");
        expect(print(applySteps(ast, step.substeps))).toEqual("a - x");
    });

    // Shows that we convert additive inverse to subtraction where possible
    test("a + 2x - 5x -> a - 3x", () => {
        const ast = parse("a + 2x - 5x");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("a - 3x");
        expect(print(applySteps(ast, step.substeps))).toEqual("a - 3x");
    });

    test("2x - -3x -> 5x", () => {
        const ast = parse("2x - -3x");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("5x");
    });

    // TODO: add transform that converts (neg (mul 2 x)) to (mul (neg 2 x))
    // or update how deal directly with the first and then add a transform that
    // converts (mul (neg 2) x) to (neg (mul 2 x)).  The second option seems easier.
    test("2x - (-3)(x) -> 5x", () => {
        const ast = parse("2x - (-3)(x)");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("5x");
        expect(print(applySteps(ast, step.substeps))).toEqual("5x");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the inverse", // substeps
            "factor variable part of like terms", // substeps
            "compute new coefficients", // substeps
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "2x - -3x",
                "2x + --3x", // TODO: we should simplify the muls here as well
                "(2 + --3)x",
                "5x",
            ],
        });
    });

    test("5x + 1 - 3x - 7 -> 2x - 6", () => {
        const ast = parse("5x + 1 - 3x - 7");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("2x - 6");
        expect(print(applySteps(ast, step.substeps))).toEqual("2x - 6");

        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the inverse", // substeps
            "reorder terms so that like terms are beside each other",
            "factor variable part of like terms", // substeps
            "compute new coefficients", // substeps
            "adding the inverse is the same as subtraction", // substeps
        ]);

        expect(ast).toHaveFullStepsLike({
            steps: step.substeps,
            expressions: [
                "5x + 1 - 3x - 7",
                "5x + 1 + -3x + -7",
                "5x + -3x + 1 + -7",
                "(5 + -3)x + (1 + -7)",
                "2x + -6",
                "2x - 6",
            ],
        });
    });

    test("4x + -3x - 1 -> 7x - 1", () => {
        const ast = parse("4x + -3x - 1");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("x - 1");
        expect(print(applySteps(ast, step.substeps))).toEqual("x - 1");
    });

    test("4x - 3x - 1 -> 7x - 1", () => {
        const ast = parse("4x - 3x - 1");

        const step = collectLikeTerms(ast);

        expect(step.message).toEqual("collect like terms");
        expect(print(step.after)).toEqual("x - 1");
        expect(print(applySteps(ast, step.substeps))).toEqual("x - 1");
    });

    describe("fractions", () => {
        test("(1/2)x + (1/3)x -> (5/6)x", () => {
            const ast = parse("(1/2)x + (1/3)x");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("(5 / 6)(x)");
            expect(print(applySteps(ast, step.substeps))).toEqual("(5 / 6)(x)");

            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "factor variable part of like terms", // substeps
                "compute new coefficients", // substeps
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: step.substeps,
                expressions: [
                    "(1 / 2)(x) + (1 / 3)(x)",
                    "(1 / 2 + 1 / 3)x", // The printer could be a bit more consistent with the parens
                    "(5 / 6)(x)",
                ],
            });
        });

        test("x/2 + x/3 -> (5/6)x", () => {
            const ast = parse("x/2 + x/3");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("(5 / 6)(x)");
            expect(print(applySteps(ast, step.substeps))).toEqual("(5 / 6)(x)");

            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "factor variable part of like terms", // substeps
                "compute new coefficients", // substeps
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: step.substeps,
                expressions: [
                    "x / 2 + x / 3", // TODO: add a step to convert x / 2 -> (1 / 2)(x)
                    "(1 / 2 + 1 / 3)x", // The printer could be a bit more consistent with the parens
                    "(5 / 6)(x)",
                ],
            });
        });

        test("2x/7 + 3x/7 -> (5/7)x", () => {
            const ast = parse("2x/7 + 3x/7");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("(5 / 7)(x)");
            expect(print(applySteps(ast, step.substeps))).toEqual("(5 / 7)(x)");

            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "factor variable part of like terms", // substeps
                "compute new coefficients", // substeps
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: step.substeps,
                expressions: [
                    "2x / 7 + 3x / 7", // TODO: add a step to convert x / 2 -> (1 / 2)(x)
                    "(2 / 7 + 3 / 7)x", // The printer could be a bit more consistent with the parens
                    "(5 / 7)(x)",
                ],
            });
        });

        test("x/2 - x/3 -> x / 6", () => {
            const ast = parse("x/2 - x/3");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("(1 / 6)(x)");
        });

        test("x/2 + x/-3 -> x", () => {
            const ast = parse("x/2 + x/-3");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("(1 / 6)(x)");
            expect(print(applySteps(ast, step.substeps))).toEqual("(1 / 6)(x)");
        });

        test("x/-2 + x/3 -> x", () => {
            const ast = parse("x/-2 + x/3");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("-(1 / 6)(x)");
            expect(print(applySteps(ast, step.substeps))).toEqual(
                "-(1 / 6)(x)",
            );
        });

        test("x/2 + x/3 -> x", () => {
            const ast = parse("x/2 + x/3");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("(5 / 6)(x)");
            expect(print(applySteps(ast, step.substeps))).toEqual("(5 / 6)(x)");
        });
    });

    describe("terms with multiple variables", () => {
        test("2xy + 3xy -> 5xy", () => {
            const ast = parse("2xy + 3xy");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("5xy");
            expect(print(applySteps(ast, step.substeps))).toEqual("5xy");
        });

        test("2ab + 3xy + 4ab - xy -> 6ab + 2xy", () => {
            const ast = parse("2ab + 3xy + 4ab - xy");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("6ab + 2xy");
            expect(print(applySteps(ast, step.substeps))).toEqual("6ab + 2xy");

            expect(step.substeps.map((substep) => substep.message)).toEqual([
                "subtraction is the same as adding the inverse",
                "reorder terms so that like terms are beside each other",
                "factor variable part of like terms", // substeps
                "compute new coefficients", // substeps
                "simplify terms",
            ]);

            expect(ast).toHaveFullStepsLike({
                steps: step.substeps,
                expressions: [
                    "2ab + 3xy + 4ab - xy",
                    "2ab + 3xy + 4ab + -xy",
                    "2ab + 4ab + 3xy + -xy",
                    "(2 + 4)(ab) + (3 + -1)(xy)",
                    "6(ab) + 2(xy)", // we should probably elide this step
                    "6ab + 2xy",
                ],
            });
        });
    });

    describe("simplifying terms", () => {
        test("x + 1 + 4 -> x + 5", () => {
            const ast = parse("x + 1 + 4");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("x + 5");
        });

        test("3 - 1x - 1 -> -x + 2", () => {
            const ast = parse("3 - 1x - 1");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            // TODO: have the output use -x instead of -1x
            expect(print(step.after)).toEqual("2 - x");
        });

        test("3 - x - 1 -> -x + 2", () => {
            const ast = parse("3 - x - 1");

            const step = collectLikeTerms(ast);

            expect(step.message).toEqual("collect like terms");
            expect(print(step.after)).toEqual("2 - x");
        });
    });
});
