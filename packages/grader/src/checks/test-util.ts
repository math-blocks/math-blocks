import * as Editor from "@math-blocks/editor";
import * as Semantic from "@math-blocks/semantic";
import {parse as _parse} from "@math-blocks/editor-parser";
import {parse, print} from "@math-blocks/testing";

import {checkStep as _checkStep} from "../step-checker";
import {Result, Mistake} from "../types";

import {deepEquals} from "./util";

export const checkStep = (
    prev: string,
    next: string,
): Result & {successfulChecks: Set<string>} => {
    const {result, successfulChecks} = _checkStep(parse(prev), parse(next));
    if (!result) {
        throw new Error("No path found");
    }
    return {
        ...result,
        successfulChecks,
    };
};

export const checkMistake = (prev: string, next: string): Mistake[] => {
    const {result, mistakes} = _checkStep(parse(prev), parse(next));
    if (!result) {
        if (mistakes.length > 0) {
            return mistakes;
        } else {
            throw new Error("No mistakes found");
        }
    }
    throw new Error("Unexpected result");
};

const myParse = (text: string): Semantic.Types.Node => {
    const node = Editor.print(parse(text)) as Editor.Row;
    return _parse(node);
};

export const toParseLike = (
    received: string,
    expected: string,
): {message: () => string; pass: boolean} => {
    if (deepEquals(received, myParse(expected))) {
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
        received: Semantic.Types.Node;
        expected: Semantic.Types.Node;
    }[] = [];
    for (let i = 0; i < expected.length; i++) {
        if (!deepEquals(received.steps[i].nodes[0], myParse(expected[i][0]))) {
            failures.push({
                step: i,
                node: 0,
                received: received.steps[i].nodes[0],
                expected: myParse(expected[i][0]),
            });
        }
        if (!deepEquals(received.steps[i].nodes[1], myParse(expected[i][1]))) {
            failures.push({
                step: i,
                node: 1,
                received: received.steps[i].nodes[1],
                expected: myParse(expected[i][1]),
            });
        }
    }

    if (failures.length > 0) {
        return {
            message: () =>
                failures
                    .map(({step, node, received, expected}) => {
                        return `step ${step}, node ${node}: expected ${print(
                            expected,
                        )} but received ${print(received)}`;
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
