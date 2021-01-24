import * as Semantic from "@math-blocks/semantic";
import * as Testing from "@math-blocks/testing";
import {Step, applyStep} from "@math-blocks/step-utils";

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
        if (Testing.print(received.substeps[i].before) !== expected[i][0]) {
            failures.push({
                step: i,
                node: "before",
                received: Testing.print(received.substeps[i].before),
                expected: expected[i][0],
            });
        }
        if (Testing.print(received.substeps[i].after) !== expected[i][1]) {
            failures.push({
                step: i,
                node: "after",
                received: Testing.print(received.substeps[i].after),
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
    received: Semantic.types.Node,
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

    if (Testing.print(node) !== expected.expressions[0]) {
        failures.push({
            step: 0,
            received: Testing.print(node),
            expected: expected.expressions[0],
        });
    }

    for (let i = 0; i < expected.steps.length; i++) {
        const step = expected.steps[i];
        node = applyStep(node, step);
        if (Testing.print(node) !== expected.expressions[i + 1]) {
            failures.push({
                step: i + 1,
                received: Testing.print(node),
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
