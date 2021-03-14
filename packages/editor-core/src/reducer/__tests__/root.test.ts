import * as core from "@math-blocks/core";

import * as builders from "../../builders";

import {Dir} from "../enums";
import {moveLeft} from "../move-left";
import {root} from "../root";
import {row, toEqualEditorNodes} from "../test-util";

import type {Zipper} from "../types";

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

        test("with index", () => {
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

            const result = root(zipper, true);

            expect(result.row.left).toEqualEditorNodes(row("").children);
            expect(result.row.right).toEqualEditorNodes(row("").children);
            expect(result.breadcrumbs).toHaveLength(1);
            expect(result.breadcrumbs[0].focus).toMatchInlineSnapshot(`
                Object {
                  "dir": "left",
                  "id": 3,
                  "other": Object {
                    "children": Array [],
                    "id": 4,
                    "type": "row",
                  },
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

        describe("with index", () => {
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

                const result = root(zipper, true);

                // The cursor is inside the radicand
                expect(result.row.left).toEqualEditorNodes(row("2+3").children);
                expect(result.row.right).toEqualEditorNodes(row("").children);
                expect(result.breadcrumbs).toHaveLength(1);
                expect(result.breadcrumbs[0].focus.dir).toEqual("left");
                expect(result.breadcrumbs[0].focus.type).toEqual("zroot");
                expect(result.breadcrumbs[0].focus.other)
                    .toMatchInlineSnapshot(`
                    Object {
                      "children": Array [],
                      "id": 8,
                      "type": "row",
                    }
                `);
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
                expect(result.breadcrumbs[0].focus.dir).toEqual("left");
                expect(result.breadcrumbs[0].focus.type).toEqual("zroot");
                expect(result.breadcrumbs[0].focus.other)
                    .toMatchInlineSnapshot(`
                    Object {
                      "children": Array [],
                      "id": 7,
                      "type": "row",
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
    });
});
