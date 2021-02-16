import * as Editor from "@math-blocks/editor-core";
import * as Semantic from "@math-blocks/semantic";
import * as Testing from "@math-blocks/testing";

import {checkStep as _checkStep} from "../step-checker";
import type {Result, Mistake} from "../types";

export const checkStep = (
    prev: string,
    next: string,
): Result & {successfulChecks: Set<string>} => {
    const {result, successfulChecks} = _checkStep(
        Testing.parse(prev),
        Testing.parse(next),
    );
    if (!result) {
        throw new Error("No path found");
    }
    return {
        ...result,
        successfulChecks,
    };
};

export const checkMistake = (prev: string, next: string): Mistake[] => {
    const {result, mistakes} = _checkStep(
        Testing.parse(prev),
        Testing.parse(next),
    );
    if (!result) {
        if (mistakes.length > 0) {
            return mistakes;
        } else {
            throw new Error("No mistakes found");
        }
    }
    throw new Error("Unexpected result");
};

const myParse = (text: string): Semantic.types.Node => {
    const node = Editor.print(Testing.parse(text), true) as Editor.types.Row;
    return Editor.parse(node);
};

export const toParseLike = (
    received: string,
    expected: string,
): {message: () => string; pass: boolean} => {
    if (Semantic.util.deepEquals(received, myParse(expected))) {
        return {
            message: () => `expected steps not to match`,
            pass: true,
        };
    }
    return {
        message: () => `expected steps not to match`,
        pass: false,
    };
};

export function toHaveMessages(
    this: any,
    received: Result,
    expected: string[],
): {message: () => string; pass: boolean} {
    if (this.isNot) {
        expect(received.steps.map((step) => step.message)).not.toEqual(
            expected,
        );
    } else {
        expect(received.steps.map((step) => step.message)).toEqual(expected);
    }

    // This point is reached when the above assertion was successful.
    // The test should therefore always pass, that means it needs to be
    // `true` when used normally, and `false` when `.not` was used.
    return {message: () => "", pass: !this.isNot};
}

export const toHaveStepsLike = (
    received: Result,
    expected: [string, string][],
): {message: () => string; pass: boolean} => {
    if (received.steps.length !== expected.length) {
        return {
            message: () =>
                `expected ${expected.length} steps but received ${received.steps.length}`,
            pass: false,
        };
    }

    const failures: {
        step: number;
        node: number;
        received: Semantic.types.Node;
        expected: Semantic.types.Node;
    }[] = [];
    for (let i = 0; i < expected.length; i++) {
        if (
            !Semantic.util.deepEquals(
                received.steps[i].before,
                myParse(expected[i][0]),
            )
        ) {
            failures.push({
                step: i,
                node: 0,
                received: received.steps[i].before,
                expected: myParse(expected[i][0]),
            });
        }
        if (
            !Semantic.util.deepEquals(
                received.steps[i].after,
                myParse(expected[i][1]),
            )
        ) {
            failures.push({
                step: i,
                node: 1,
                received: received.steps[i].after,
                expected: myParse(expected[i][1]),
            });
        }
    }

    if (failures.length > 0) {
        return {
            message: () =>
                failures
                    .map(({step, node, received, expected}) => {
                        return `step ${step}, node ${node}: expected ${Testing.print(
                            expected,
                            true,
                        )} but received ${Testing.print(received, true)}`;
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
