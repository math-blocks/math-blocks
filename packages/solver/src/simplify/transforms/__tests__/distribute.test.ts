import {types} from "@math-blocks/semantic";
import {parse, print} from "@math-blocks/testing";

import {distribute as _distribute} from "../distribute";
import {Step} from "../../types";

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
        expect(step.substeps.map((substep) => substep.message)).toEqual([]);
        expect(print(step.after)).toEqual("ab + ac");
    });

    test("3(x + 1) -> 3x + 3", () => {
        const ast = parse("3(x + 1)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "evaluate multiplication",
        ]);
        expect(print(step.after)).toEqual("3x + 3");
    });

    test("3(x + 1) + 4 -> 3x + 7", () => {
        const ast = parse("3(x + 1) + 4");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "evaluate multiplication",
        ]);
        expect(print(step.after)).toEqual("3x + 3 + 4");
    });

    test("3(x + y + z) -> 3x + 3y + 3z", () => {
        const ast = parse("3(x + y + z)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(step.substeps.map((substep) => substep.message)).toEqual([]);
        expect(print(step.after)).toEqual("3x + 3y + 3z");
    });

    test("(-2)(x - 3) -> -2x + 6", () => {
        const ast = parse("(-2)(x - 3)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the negative",
            "evaluate multiplication",
            "multiplying two negatives is a positive",
        ]);
        expect(print(step.after)).toEqual("-2x + 6");
    });

    test("3 - (x + 1) -> -x + 2", () => {
        const ast = parse("3 - (x + 1)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "negation is the same as multipyling by one",
            "multiplication by -1 is the same as being negative",
            "evaluate multiplication",
            "adding the negative is the same as subtraction",
            "adding the negative is the same as subtraction",
        ]);
        expect(print(step.after)).toEqual("3 - x - 1");

        expect(print(step.substeps[0].before)).toEqual("-(x + 1)");
        expect(print(step.substeps[0].after)).toEqual("-1(x + 1)");
        // TODO: figure out how we can show the entire expression at each of these substeps
        expect(print(step.substeps[1].before)).toEqual("-1x");
        expect(print(step.substeps[1].after)).toEqual("-x");
        expect(print(step.substeps[2].before)).toEqual("(1)(1)");
        expect(print(step.substeps[2].after)).toEqual("1");
        // TODO: figure out how we can show the entire expression at each of these substeps
        expect(print(step.substeps[3].before)).toEqual("-x");
        expect(print(step.substeps[3].after)).toEqual("-x");
    });

    test("(ab)(xy - yz)", () => {
        const ast = parse("(ab)(xy - yz)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("abxy - abyz");
        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the negative",
            "adding the negative is the same as subtraction",
        ]);
    });

    test("(-ab)(xy - yz)", () => {
        const ast = parse("(-ab)(xy - yz)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(print(step.after)).toEqual("-abxy + abyz");
        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the negative",
            "multiplying two negatives is a positive",
        ]);
    });

    test("3(x + 1) + 4(x - 1) -> 7x - 1", () => {
        const ast = parse("3(x + 1) + 4(x - 1)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "evaluate multiplication",
        ]);
        expect(print(step.after)).toEqual("3x + 3 + 4(x - 1)");
    });

    test("x(x + 1) -> x^2 + x", () => {
        const ast = parse("x(x + 1)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "multiplication by 1 is a no-op",
        ]);
        expect(print(step.after)).toEqual("xx + x");
    });

    test("x(x - 1) -> x^2 - x", () => {
        const ast = parse("x(x - 1)");

        const step = distribute(ast);

        expect(step.message).toEqual("distribute");
        expect(step.substeps.map((substep) => substep.message)).toEqual([
            "subtraction is the same as adding the negative",
            "multiplication by -1 is the same as being negative",
            "adding the negative is the same as subtraction",
        ]);
        expect(print(step.after)).toEqual("xx - x");
    });
});
