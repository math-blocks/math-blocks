import * as Semantic from "@math-blocks/semantic";

import * as builders from "../../builders";
import * as types from "../../types";

import {Dir} from "../enums";
import {moveLeft} from "../move-left";
import {root} from "../root";
import {row} from "../test-util";
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

describe("root", () => {
    describe("without selection", () => {
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

        const result = root(zipper, false);

        expect(result.row.left).toEqualEditorNodes(row("").children);
        expect(result.row.right).toEqualEditorNodes(row("").children);
        expect(result.breadcrumbs).toHaveLength(1);
        expect(result.breadcrumbs[0].focus).toMatchInlineSnapshot(`
            Object {
              "dir": "right",
              "id": 3,
              "other": null,
              "type": "zroot",
            }
        `);
        expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
            row("").children,
        );
        expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
            row("1+").children,
        );
    });

    describe("with selection", () => {
        test("selection in the same row as cursor", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1+").children,
                    selection: {
                        dir: Dir.Right,
                        nodes: row("2+3").children,
                    },
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = root(zipper, false);

            // The cursor is inside the radicand
            expect(result.row.left).toEqualEditorNodes(row("2+3").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.dir).toEqual("right");
            expect(result.breadcrumbs[0].focus.type).toEqual("zroot");
            expect(result.breadcrumbs[0].focus.other).toBeNull();
            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("1+").children,
            );
        });

        test("selection in breadcrumbs", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: [
                        builders.glyph("1"),
                        builders.glyph("+"),
                        builders.glyph("x"),
                        builders.subsup(undefined, [builders.glyph("2")]),
                    ],
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = root(
                moveLeft(moveLeft(moveLeft(moveLeft(zipper)), true), true),
                false,
            );

            // The selection is now the randicand and the cursor is at the end of it
            expect(result.row.left).toEqualEditorNodes(
                builders.row([
                    builders.glyph("x"),
                    builders.subsup(undefined, [builders.glyph("2")]),
                ]).children,
            );
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.dir).toEqual("right");
            expect(result.breadcrumbs[0].focus.type).toEqual("zroot");
            expect(result.breadcrumbs[0].focus.other).toBeNull();
            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("1+").children,
            );
        });
    });
});
