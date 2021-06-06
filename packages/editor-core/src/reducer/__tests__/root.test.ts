import * as core from "@math-blocks/core";

import * as builders from "../../ast/builders";

import {moveLeft} from "../move-left";
import {root} from "../root";
import {row, toEqualEditorNodes, zrow} from "../test-util";
import {selectionZipperFromZippers} from "../convert";

import type {Zipper, State} from "../types";

expect.extend({toEqualEditorNodes});

describe("root", () => {
    beforeEach(() => {
        let i = 0;
        jest.spyOn(core, "getId").mockImplementation(() => {
            return i++;
        });
    });

    describe("without selection", () => {
        test("no index", () => {
            const zipper: Zipper = {
                row: zrow(row("1+").children, []),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = root(state, false);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toMatchInlineSnapshot(`
                Object {
                  "id": 3,
                  "left": Array [
                    null,
                  ],
                  "right": Array [],
                  "style": Object {},
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

        test("with index", () => {
            const zipper: Zipper = {
                row: zrow(row("1+").children, []),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: null,
                zipper: zipper,
                selecting: false,
            };

            const {startZipper: result} = root(state, true);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toMatchInlineSnapshot(`
                Object {
                  "id": 3,
                  "left": Array [],
                  "right": Array [
                    Object {
                      "children": Array [],
                      "id": 4,
                      "style": Object {},
                      "type": "row",
                    },
                  ],
                  "style": Object {},
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
    });

    describe("with selection", () => {
        describe("no index", () => {
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
                    endZipper: null,
                    zipper: zipper,
                    selecting: false,
                };

                const {startZipper: result} = root(state, false);

                // The cursor is inside the radicand
                expect(result.row.left).toEqualEditorNodes(row("2+3").children);
                expect(result.row.right).toEqualEditorNodes(row("").children);
                expect(result.breadcrumbs).toHaveLength(1);
                expect(result.breadcrumbs[0].focus.type).toEqual("zroot");
                expect(result.breadcrumbs[0].focus.left).toEqual([null]);
                expect(result.breadcrumbs[0].focus.right).toEqual([]);
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
                    endZipper: null,
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

                const {startZipper: result} = root(
                    {
                        // TODO: update this once we've added .zipper to State
                        startZipper: state.startZipper,
                        endZipper: state.endZipper,
                        zipper: selectionZipper,
                        selecting: false,
                    },
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
                expect(result.breadcrumbs[0].focus.type).toEqual("zroot");
                expect(result.breadcrumbs[0].focus.left).toEqual([null]);
                expect(result.breadcrumbs[0].focus.right).toEqual([]);
                expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                    row("").children,
                );
                expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                    row("1+").children,
                );
            });
        });

        describe("with index", () => {
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
                // TODO: fix this test so that startZipper and endZipper are accurate
                const state: State = {
                    startZipper: zipper,
                    endZipper: zipper,
                    zipper: zipper,
                    selecting: false,
                };

                const {startZipper: result} = root(state, true);

                // The cursor is inside the radicand
                expect(result.row.left).toEqualEditorNodes(row("2+3").children);
                expect(result.row.right).toEqualEditorNodes(row("").children);
                expect(result.breadcrumbs).toHaveLength(1);
                expect(result.breadcrumbs[0].focus.type).toEqual("zroot");
                expect(result.breadcrumbs[0].focus.left).toEqual([]);
                expect(result.breadcrumbs[0].focus.right)
                    .toMatchInlineSnapshot(`
                    Array [
                      Object {
                        "children": Array [],
                        "id": 8,
                        "style": Object {},
                        "type": "row",
                      },
                    ]
                `);
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
                    endZipper: null,
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

                const {startZipper: result} = root(
                    {
                        // TODO: fix this test so that startZipper and endZipper are accurate
                        startZipper: state.startZipper,
                        endZipper: state.endZipper,
                        zipper: selectionZipper,
                        selecting: false,
                    },
                    true, // index
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
                expect(result.breadcrumbs[0].focus.type).toEqual("zroot");
                expect(result.breadcrumbs[0].focus.left).toEqual([]);
                expect(result.breadcrumbs[0].focus.right)
                    .toMatchInlineSnapshot(`
                    Array [
                      Object {
                        "children": Array [],
                        "id": 7,
                        "style": Object {},
                        "type": "row",
                      },
                    ]
                `);
                expect(result.breadcrumbs[0].row.right).toEqualEditorNodes(
                    row("").children,
                );
                expect(result.breadcrumbs[0].row.left).toEqualEditorNodes(
                    row("1+").children,
                );
            });
        });
    });
});
