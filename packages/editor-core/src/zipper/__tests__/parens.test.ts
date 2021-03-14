import * as Semantic from "@math-blocks/semantic";

import * as types from "../../types";

// import {parens} from "../parens";

const toEqualEditorNodes = (
    received: types.Node[],
    actual: types.Node[],
): {message: () => string; pass: boolean} => {
    const message = "Editor nodes didn't match";
    if (Semantic.util.deepEquals(received, actual)) {
        return {
            message: () => message,
            pass: true,
        };
    }
    return {
        message: () => message,
        pass: false,
    };
};

expect.extend({toEqualEditorNodes});

declare global {
    /* eslint-disable */
    namespace jest {
        interface Matchers<R, T> {
            toEqualEditorNodes(actual: readonly types.Node[]): R;
        }
    }
    /* eslint-enable */
}

describe("parens", () => {
    describe("selection", () => {
        test.todo("'(' wraps selection in non-pending parens");
        test.todo("')' wraps selection in non-pending parens");
    });

    describe("no selection", () => {
        // TODO: write tests
    });
});
