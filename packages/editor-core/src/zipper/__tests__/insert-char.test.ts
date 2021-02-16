import * as Semantic from "@math-blocks/semantic";

import * as builders from "../../builders";
import * as types from "../../types";

import {insertChar} from "../insert-char";
import {row} from "../test-util";
import {Dir} from "../enums";
import type {Zipper} from "../types";

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
            toEqualEditorNodes(actual: types.Node[]): R;
        }
    }
    /* eslint-enable */
}

describe("insertChar", () => {
    test("it inserts characters at the end", () => {
        const zipper: Zipper = {
            row: {
                id: 0,
                type: "zrow",
                left: row("1+").children,
                selection: null,
                right: [],
            },
            breadcrumbs: [],
        };

        const result = insertChar(zipper, "2");

        expect(result.row.left).toEqualEditorNodes(row("1+2").children);
        expect(result.row.right).toEqualEditorNodes(row("").children);
    });

    test("it inserts characters at the start", () => {
        const zipper: Zipper = {
            row: {
                id: 0,
                type: "zrow",
                selection: null,
                left: [],
                right: row("+2").children,
            },
            breadcrumbs: [],
        };

        const result = insertChar(zipper, "1");

        expect(result.row.left).toEqualEditorNodes(row("1").children);
        expect(result.row.right).toEqualEditorNodes(row("+2").children);
    });

    test("it inserts characters in the middle", () => {
        const zipper: Zipper = {
            row: {
                id: 0,
                type: "zrow",
                left: [builders.glyph("1")],
                selection: null,
                right: [builders.glyph("2")],
            },
            breadcrumbs: [],
        };

        const result = insertChar(zipper, "+");

        expect(result.row.left).toEqualEditorNodes(row("1+").children);
        expect(result.row.right).toEqualEditorNodes(row("2").children);
    });

    describe("selections", () => {
        test("replace selection in zipper.row", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [builders.glyph("1")],
                    selection: {
                        dir: Dir.Right,
                        nodes: [builders.glyph("+")],
                    },
                    right: [builders.glyph("2")],
                },
                breadcrumbs: [],
            };

            const result = insertChar(zipper, "\u2122");

            expect(result.row.left).toEqualEditorNodes(row("1\u2122").children);
            expect(result.row.right).toEqualEditorNodes(row("2").children);
        });

        test("replace a selection spanning multiple levels", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [],
                    selection: {
                        dir: Dir.Left,
                        nodes: [builders.glyph("2")],
                    },
                    right: [],
                },
                breadcrumbs: [
                    {
                        focus: {
                            id: 0,
                            type: "zfrac",
                            dir: Dir.Right,
                            other: builders.row([builders.glyph("3")]),
                        },
                        row: {
                            id: 0,
                            type: "zrow",
                            left: [builders.glyph("1"), builders.glyph("+")],
                            selection: {
                                dir: Dir.Left,
                                nodes: [],
                            },
                            right: [],
                        },
                    },
                ],
            };

            const result = insertChar(zipper, "2");

            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toEqualEditorNodes(row("1+2").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
        });
    });
});
