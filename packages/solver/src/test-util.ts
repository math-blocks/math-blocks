import {print} from "@math-blocks/testing";
import {types} from "semantic/src";
import {applyStep} from "./apply-step";

import {Step} from "./types";

export const toHaveSubstepsLike = (
    received: Step,
    expected: [string, string][],
): {message: () => string; pass: boolean} => {
    if (received.substeps.length !== expected.length) {
        return {
            message: () =>
                `expected ${expected.length} steps but received ${received.substeps.length}`,
            pass: false,
        };
    }

    const failures: {
        step: number;
        node: "before" | "after";
        received: string;
        expected: string;
    }[] = [];

    for (let i = 0; i < expected.length; i++) {
        if (print(received.substeps[i].before) !== expected[i][0]) {
            failures.push({
                step: i,
                node: "before",
                received: print(received.substeps[i].before),
                expected: expected[i][0],
            });
        }
        if (print(received.substeps[i].after) !== expected[i][1]) {
            failures.push({
                step: i,
                node: "after",
                received: print(received.substeps[i].after),
                expected: expected[i][1],
            });
        }
    }

    if (failures.length > 0) {
        return {
            message: () =>
                failures
                    .map(({step, node, received, expected}) => {
                        return `step ${step}, node ${node}: expected ${expected} but received ${received}`;
                    })
                    .join("\n"),
            pass: false,
        };
    }

    return {
        message: () => `steps matched`,
        pass: true,
    };
};

export const toHaveFullStepsLike = (
    received: types.Node,
    expected: {steps: Step[]; expressions: string[]},
): {message: () => string; pass: boolean} => {
    if (expected.steps.length + 1 !== expected.expressions.length) {
        return {
            message: () =>
                `expected the number of expressions (${expected.expressions.length}) to be one more than the number of steps (${expected.steps.length})`,
            pass: false,
        };
    }

    const failures: {
        step: number;
        received: string;
        expected: string;
    }[] = [];

    let node = received;

    if (print(node) !== expected.expressions[0]) {
        failures.push({
            step: 0,
            received: print(node),
            expected: expected.expressions[0],
        });
    }

    for (let i = 0; i < expected.steps.length; i++) {
        const step = expected.steps[i];
        node = applyStep(node, step);
        if (print(node) !== expected.expressions[i + 1]) {
            failures.push({
                step: i + 1,
                received: print(node),
                expected: expected.expressions[i + 1],
            });
        }
    }

    if (failures.length > 0) {
        return {
            message: () =>
                failures
                    .map(({step, received, expected}) => {
                        return `step ${step}: expected '${expected}' but received '${received}'`;
                    })
                    .join("\n"),
            pass: false,
        };
    }

    return {
        message: () => `steps matched`,
        pass: true,
    };
};
