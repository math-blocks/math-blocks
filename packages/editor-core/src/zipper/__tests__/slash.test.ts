import * as Semantic from "@math-blocks/semantic";

import * as builders from "../../builders";
import * as types from "../../types";

import {Dir} from "../enums";
import {slash} from "../slash";
import {moveLeft} from "../move-left";
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

describe("slash", () => {
    describe("without selection", () => {
        test("after number", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1+2").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = slash(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.dir).toEqual("right");
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.other?.children,
            ).toEqualEditorNodes(row("2").children);
            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("1+").children,
            );
        });

        test("after implicit multiplication of variables", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1+ab").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = slash(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.dir).toEqual("right");
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.other?.children,
            ).toEqualEditorNodes(row("ab").children);

            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("1+").children,
            );
        });

        test("after parens", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("(1+2)").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = slash(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.dir).toEqual("right");
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.other?.children,
            ).toEqualEditorNodes(row("(1+2)").children);

            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("").children,
            );
        });

        test("after implicit multiplication w/ parens", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("1+(a)(b)").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = slash(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.dir).toEqual("right");
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.other?.children,
            ).toEqualEditorNodes(row("(a)(b)").children);

            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("1+").children,
            );
        });

        test("inside parens", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("(1").children,
                    selection: null,
                    right: row("+2)").children,
                },
                breadcrumbs: [],
            };

            const result = slash(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.dir).toEqual("right");
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.other?.children,
            ).toEqualEditorNodes(row("1").children);

            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("+2)").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("(").children,
            );
        });

        test("after equals", () => {
            const zipper: Zipper = {
                row: {
                    id: 0,
                    type: "zrow",
                    left: row("x=1").children,
                    selection: null,
                    right: [],
                },
                breadcrumbs: [],
            };

            const result = slash(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.dir).toEqual("right");
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.other?.children,
            ).toEqualEditorNodes(row("1").children);

            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("x=").children,
            );
        });
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

            const result = slash(zipper);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.dir).toEqual("right");
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.other?.children,
            ).toEqualEditorNodes(row("2+3").children);
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

            const result = slash(
                moveLeft(moveLeft(moveLeft(moveLeft(zipper)), true), true),
            );

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.dir).toEqual("right");
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.other?.children,
            ).toEqualEditorNodes(
                builders.row([
                    builders.glyph("x"),
                    builders.subsup(undefined, [builders.glyph("2")]),
                ]).children,
            );

            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("1+").children,
            );
        });
    });
});
