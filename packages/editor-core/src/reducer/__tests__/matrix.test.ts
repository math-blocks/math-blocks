import {getId} from "@math-blocks/core";

import * as builders from "../../char/builders";

import {matrix} from "../matrix";
import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {toEqualEditorNodes, zrow} from "../test-util";
import {zipperToRow} from "../convert";

import type {Zipper, State} from "../types";

expect.extend({toEqualEditorNodes});

describe("matrix", () => {
    describe("InsertMatrix", () => {
        test("no selection, delimiters: 'brackets'", () => {
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

            const {zipper: result} = matrix(state, {
                type: "InsertMatrix",
                delimiters: "brackets",
            });
            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toEqualEditorNodes([
                builders.matrix(
                    [
                        [builders.char("1")],
                        [builders.char("0")],
                        [builders.char("0")],
                        [builders.char("1")],
                    ],
                    2,
                    2,
                    {
                        left: builders.char("["),
                        right: builders.char("]"),
                    },
                ),
            ]);
        });

        test("no selection, delimiters: 'parens'", () => {
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

            const {zipper: result} = matrix(state, {
                type: "InsertMatrix",
                delimiters: "parens",
            });
            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toEqualEditorNodes([
                builders.matrix(
                    [
                        [builders.char("1")],
                        [builders.char("0")],
                        [builders.char("0")],
                        [builders.char("1")],
                    ],
                    2,
                    2,
                    {
                        left: builders.char("("),
                        right: builders.char(")"),
                    },
                ),
            ]);
        });

        test("selection", () => {
            const zipper: Zipper = {
                row: {
                    type: "zrow",
                    id: getId(),
                    left: [builders.char("1")],
                    selection: [],
                    right: [builders.char("+"), builders.char("2")],
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

            const {zipper: result} = matrix(state, {
                type: "InsertMatrix",
                delimiters: "brackets",
            });
            expect(result.breadcrumbs).toHaveLength(0);
            expect(result.row.left).toEqualEditorNodes([
                builders.char("1"),
                builders.matrix(
                    [
                        [builders.char("1")],
                        [builders.char("0")],
                        [builders.char("0")],
                        [builders.char("1")],
                    ],
                    2,
                    2,
                    {
                        left: builders.char("["),
                        right: builders.char("]"),
                    },
                ),
            ]);
            expect(result.row.selection).toEqual([]);
            expect(result.row.right).toEqualEditorNodes([builders.char("2")]);
        });
    });

    describe("AddRow", () => {
        test("adding a row above", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                builders.matrix(
                    [
                        [builders.char("0")],
                        [builders.char("0")],
                        [builders.char("a")],
                        [builders.char("b")],
                        [builders.char("c")],
                        [builders.char("d")],
                    ],
                    2,
                    3,
                ),
            ]);
        });

        test("adding a row below", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                builders.matrix(
                    [
                        [builders.char("a")],
                        [builders.char("b")],
                        [builders.char("0")],
                        [builders.char("0")],
                        [builders.char("c")],
                        [builders.char("d")],
                    ],
                    2,
                    3,
                ),
            ]);
        });

        test("adding a row below the last row", () => {
            const zipper: Zipper = {
                row: zrow(
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                builders.matrix(
                    [
                        [builders.char("a")],
                        [builders.char("b")],
                        [builders.char("c")],
                        [builders.char("d")],
                        [builders.char("0")],
                        [builders.char("0")],
                    ],
                    2,
                    3,
                ),
            ]);
        });
    });

    describe("AddColumn", () => {
        test("adding a column to the left", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                builders.matrix(
                    [
                        [builders.char("0")],
                        [builders.char("a")],
                        [builders.char("b")],
                        [builders.char("0")],
                        [builders.char("c")],
                        [builders.char("d")],
                    ],
                    3,
                    2,
                ),
            ]);
        });

        test("adding a column to the right", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                builders.matrix(
                    [
                        [builders.char("a")],
                        [builders.char("0")],
                        [builders.char("b")],
                        [builders.char("c")],
                        [builders.char("0")],
                        [builders.char("d")],
                    ],
                    3,
                    2,
                ),
            ]);
        });

        test("adding a column to the right of the last column", () => {
            const zipper: Zipper = {
                row: zrow(
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                builders.matrix(
                    [
                        [builders.char("a")],
                        [builders.char("b")],
                        [builders.char("0")],
                        [builders.char("c")],
                        [builders.char("d")],
                        [builders.char("0")],
                    ],
                    3,
                    2,
                ),
            ]);
        });
    });

    describe("DeleteRow", () => {
        test("deleting the first row", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                builders.matrix(
                    [[builders.char("c")], [builders.char("d")]],
                    2,
                    1,
                ),
            ]);
        });

        test("deleting the last row", () => {
            const zipper: Zipper = {
                row: zrow(
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                builders.matrix(
                    [[builders.char("a")], [builders.char("b")]],
                    2,
                    1,
                ),
            ]);
        });

        test("deleting all rows", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                builders.matrix(
                    [[builders.char("b")], [builders.char("d")]],
                    1,
                    2,
                ),
            ]);
        });
        test("deleting the last column", () => {
            const zipper: Zipper = {
                row: zrow(
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
                builders.matrix(
                    [[builders.char("a")], [builders.char("c")]],
                    1,
                    2,
                ),
            ]);
        });
        test("deleting all columns", () => {
            const zipper: Zipper = {
                row: zrow(
                    [],
                    [
                        builders.matrix(
                            [
                                [builders.char("a")],
                                [builders.char("b")],
                                [builders.char("c")],
                                [builders.char("d")],
                            ],
                            2,
                            2,
                        ),
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
