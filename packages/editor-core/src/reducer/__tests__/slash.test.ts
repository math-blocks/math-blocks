import * as builders from "../../ast/builders";

import {slash} from "../slash";
import {moveLeft} from "../move-left";
import {row, toEqualEditorNodes} from "../test-util";
import {selectionZipperFromZippers} from "../convert";
import {zrow} from "../test-util";

import type {Zipper, State} from "../types";

expect.extend({toEqualEditorNodes});

describe("slash", () => {
    describe("without selection", () => {
        test("after number", () => {
            const zipper: Zipper = {
                row: zrow(row("1+2").children, []),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = slash(state);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.right).toEqual([]);
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.left[0]?.children,
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
                row: zrow(row("1+ab").children, []),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = slash(state);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.right).toEqual([]);
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.left[0]?.children,
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
                row: zrow(row("(1+2)").children, []),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = slash(state);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.right).toEqual([]);
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.left[0]?.children,
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
                row: zrow(row("1+(a)(b)").children, []),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = slash(state);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.right).toEqual([]);
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.left[0]?.children,
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
                row: zrow(row("(1").children, row("+2)").children),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = slash(state);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.right).toEqual([]);
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.left[0]?.children,
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
                row: zrow(row("x=1").children, []),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = slash(state);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.right).toEqual([]);
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.left[0]?.children,
            ).toEqualEditorNodes(row("1").children);

            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("x=").children,
            );
        });

        test("after limits", () => {
            const zipper: Zipper = {
                row: zrow(
                    builders.row([
                        builders.glyph("1"),
                        builders.glyph("+"),
                        builders.limits(
                            builders.glyph("\u03a3"), // \sum
                            [],
                            [],
                        ),
                        builders.glyph("2"),
                    ]).children,
                    [],
                ),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = slash(state);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.right).toEqual([]);
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.left[0]?.children,
            ).toEqualEditorNodes(row("2").children);

            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                builders.row([
                    builders.glyph("1"),
                    builders.glyph("+"),
                    builders.limits(
                        builders.glyph("\u03a3"), // \sum
                        [],
                        [],
                    ),
                ]).children,
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
                    selection: row("2+3").children,
                    right: [],
                    style: {},
                },
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = slash(state);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.right).toEqual([]);
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.left[0]?.children,
            ).toEqualEditorNodes(row("2+3").children);
            expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                row("").children,
            );
            expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                row("1+").children,
            );
        });

        test("selection in breadcrumbs", () => {
            const startZipper: Zipper = {
                row: zrow(
                    [
                        builders.glyph("1"),
                        builders.glyph("+"),
                        builders.glyph("x"),
                        builders.subsup(undefined, [builders.glyph("2")]),
                    ],
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: startZipper,
                endZipper: startZipper,
                zipper: startZipper,
                selecting: false,
            };
            state = moveLeft(moveLeft(state));
            state = {
                startZipper: state.startZipper,
                endZipper: state.startZipper,
                zipper: state.startZipper,
                selecting: true,
            };
            state = moveLeft(moveLeft(state));

            const selectionZipper = selectionZipperFromZippers(
                state.startZipper,
                state.endZipper,
            );

            if (!selectionZipper) {
                throw new Error("Can't create selection from zippers");
            }

            const {startZipper: result} = slash({
                // TODO: update this once we've added .zipper to State
                startZipper: state.startZipper,
                endZipper: state.endZipper,
                zipper: selectionZipper,
                selecting: false,
            });

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus.right).toEqual([]);
            expect(result.breadcrumbs[0].focus.type).toEqual("zfrac");
            expect(
                result.breadcrumbs[0].focus.left[0]?.children,
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
