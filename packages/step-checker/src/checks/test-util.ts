import * as Editor from "@math-blocks/editor";
import * as Semantic from "@math-blocks/semantic";
import {parse as _parse} from "@math-blocks/editor-parser";
import {parse} from "@math-blocks/text-parser";

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
