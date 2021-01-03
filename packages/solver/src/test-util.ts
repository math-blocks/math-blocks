import {print} from "@math-blocks/testing";

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
