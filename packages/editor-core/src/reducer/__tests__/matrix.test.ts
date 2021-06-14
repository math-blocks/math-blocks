import {getId} from "@math-blocks/core";

import * as builders from "../../ast/builders";

import {matrix} from "../matrix";
import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {toEqualEditorNodes, zrow} from "../test-util";
import {zipperToRow} from "../convert";

import type {Zipper, State} from "../types";

expect.extend({toEqualEditorNodes});

describe("matrix", () => {
    describe("InsertMatrix", () => {
        test("no selection", () => {
            const zipper: Zipper = {
                row: zrow([], []),
                breadcrumbs: [],
            };
            const state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };

            const {zipper: result} = matrix(state, {type: "InsertMatrix"});
            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toEqualEditorNodes([
                builders.table(2, 2, [
                    [builders.glyph("1")],
                    [builders.glyph("0")],
                    [builders.glyph("0")],
                    [builders.glyph("1")],
                ]),
            ]);
        });

        test("selection", () => {
            const zipper: Zipper = {
                row: {
                    type: "zrow",
                    id: getId(),
                    left: [builders.glyph("1")],
                    selection: [],
                    right: [builders.glyph("+"), builders.glyph("2")],
                    style: {},
                },
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: true,
            };
            state = moveRight(state);

            const {zipper: result} = matrix(state, {type: "InsertMatrix"});
            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toEqualEditorNodes([
                builders.glyph("1"),
                builders.table(2, 2, [
                    [builders.glyph("1")],
                    [builders.glyph("0")],
                    [builders.glyph("0")],
                    [builders.glyph("1")],
                ]),
            ]);
            expect(result.row.selection).toEqual([]);
            expect(result.row.right).toEqualEditorNodes([builders.glyph("2")]);
        });
    });

    describe("AddRow", () => {
        test("adding a row above", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveRight(state);
            state = matrix(state, {type: "AddRow", side: "above"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqualEditorNodes([
                builders.table(2, 3, [
                    [builders.glyph("0")],
                    [builders.glyph("0")],
                    [builders.glyph("a")],
                    [builders.glyph("b")],
                    [builders.glyph("c")],
                    [builders.glyph("d")],
                ]),
            ]);
        });

        test("adding a row below", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveRight(state);
            state = matrix(state, {type: "AddRow", side: "below"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqualEditorNodes([
                builders.table(2, 3, [
                    [builders.glyph("a")],
                    [builders.glyph("b")],
                    [builders.glyph("0")],
                    [builders.glyph("0")],
                    [builders.glyph("c")],
                    [builders.glyph("d")],
                ]),
            ]);
        });

        test("adding a row below the last row", () => {
            const zipper: Zipper = {
                row: zrow(
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveLeft(state);
            state = matrix(state, {type: "AddRow", side: "below"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqualEditorNodes([
                builders.table(2, 3, [
                    [builders.glyph("a")],
                    [builders.glyph("b")],
                    [builders.glyph("c")],
                    [builders.glyph("d")],
                    [builders.glyph("0")],
                    [builders.glyph("0")],
                ]),
            ]);
        });
    });

    describe("AddColumn", () => {
        test("adding a column to the left", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveRight(state);
            state = matrix(state, {type: "AddColumn", side: "left"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqualEditorNodes([
                builders.table(3, 2, [
                    [builders.glyph("0")],
                    [builders.glyph("a")],
                    [builders.glyph("b")],
                    [builders.glyph("0")],
                    [builders.glyph("c")],
                    [builders.glyph("d")],
                ]),
            ]);
        });

        test("adding a column to the right", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveRight(state);
            state = matrix(state, {type: "AddColumn", side: "right"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqualEditorNodes([
                builders.table(3, 2, [
                    [builders.glyph("a")],
                    [builders.glyph("0")],
                    [builders.glyph("b")],
                    [builders.glyph("c")],
                    [builders.glyph("0")],
                    [builders.glyph("d")],
                ]),
            ]);
        });

        test("adding a column to the right of the last column", () => {
            const zipper: Zipper = {
                row: zrow(
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveLeft(state);
            state = matrix(state, {type: "AddColumn", side: "right"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqualEditorNodes([
                builders.table(3, 2, [
                    [builders.glyph("a")],
                    [builders.glyph("b")],
                    [builders.glyph("0")],
                    [builders.glyph("c")],
                    [builders.glyph("d")],
                    [builders.glyph("0")],
                ]),
            ]);
        });
    });

    describe("DeleteRow", () => {
        test("deleting the first row", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveRight(state);
            state = matrix(state, {type: "DeleteRow"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqualEditorNodes([
                builders.table(2, 1, [
                    [builders.glyph("c")],
                    [builders.glyph("d")],
                ]),
            ]);
        });

        test("deleting the last row", () => {
            const zipper: Zipper = {
                row: zrow(
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveLeft(state);
            state = matrix(state, {type: "DeleteRow"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqualEditorNodes([
                builders.table(2, 1, [
                    [builders.glyph("a")],
                    [builders.glyph("b")],
                ]),
            ]);
        });

        test("deleting all rows", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveRight(state);
            state = matrix(state, {type: "DeleteRow"});
            state = matrix(state, {type: "DeleteRow"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqual([]);
        });
    });

    describe("DeleteColumn", () => {
        test("deleting the first column", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveRight(state);
            state = matrix(state, {type: "DeleteColumn"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqualEditorNodes([
                builders.table(1, 2, [
                    [builders.glyph("b")],
                    [builders.glyph("d")],
                ]),
            ]);
        });
        test("deleting the last column", () => {
            const zipper: Zipper = {
                row: zrow(
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                    [],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveLeft(state);
            state = matrix(state, {type: "DeleteColumn"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqualEditorNodes([
                builders.table(1, 2, [
                    [builders.glyph("a")],
                    [builders.glyph("c")],
                ]),
            ]);
        });
        test("deleting all columns", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.table(2, 2, [
                            [builders.glyph("a")],
                            [builders.glyph("b")],
                            [builders.glyph("c")],
                            [builders.glyph("d")],
                        ]),
                    ],
                ),
                breadcrumbs: [],
            };
            let state: State = {
                startZipper: zipper,
                endZipper: zipper,
                zipper: zipper,
                selecting: false,
            };
            state = moveRight(state);
            state = matrix(state, {type: "DeleteColumn"});
            state = matrix(state, {type: "DeleteColumn"});

            const row = zipperToRow(state.zipper);
            expect(row.children).toEqual([]);
        });
    });
});
