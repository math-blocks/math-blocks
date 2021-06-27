import {getId} from "@math-blocks/core";

import * as types from "../../ast/types";
import * as builders from "../../ast/builders";

import {stateFromZipper, toEqualEditorNodes, row, zrow} from "../test-util";
import * as util from "../util";
import {verticalWork} from "../vertical-work";
import {backspace} from "../backspace";
import {moveLeft} from "../move-left";
import {moveRight} from "../move-right";
import {insertChar} from "../insert-char";

import type {BreadcrumbRow, Zipper} from "../types";

expect.extend({toEqualEditorNodes});

describe("verticalWork", () => {
    test("pressing down splits the row into a table", () => {
        const zipper: Zipper = {
            row: zrow([], row("2x+5=10").children),
            breadcrumbs: [],
        };
        const state = stateFromZipper(zipper);

        const newState = verticalWork(state, "down");

        const focus = newState.zipper.breadcrumbs[0].focus;
        if (focus.type !== "ztable") {
            throw new Error("focus should be a ZTable");
        }
        expect(focus.left).toHaveLength(10);

        // Empty cells are place at the start and end
        expect(focus.left[0]?.children).toEqualEditorNodes([]);
        expect(focus.left[1]?.children).toEqualEditorNodes(row("2x").children);
        // Empty cells are placed in front of each plus/minus opeartor
        expect(focus.left[2]?.children).toEqualEditorNodes([]);
        expect(focus.left[3]?.children).toEqualEditorNodes(row("+").children);
        expect(focus.left[4]?.children).toEqualEditorNodes(row("5").children);
        // Empty cells are placed around each relationship operator
        expect(focus.left[5]?.children).toEqualEditorNodes([]);
        expect(focus.left[6]?.children).toEqualEditorNodes(row("=").children);
        expect(focus.left[7]?.children).toEqualEditorNodes([]);
        expect(focus.left[8]?.children).toEqualEditorNodes(row("10").children);
        expect(focus.left[9]?.children).toEqualEditorNodes([]);

        // The cursor is placed in the first column of the second row
        expect(focus.right).toHaveLength(9);

        // All cells in the second row are empty to being with
        expect(focus.right[0]?.children).toEqualEditorNodes([]);
        expect(focus.right[1]?.children).toEqualEditorNodes([]);
        expect(focus.right[2]?.children).toEqualEditorNodes([]);
        expect(focus.right[3]?.children).toEqualEditorNodes([]);
        expect(focus.right[4]?.children).toEqualEditorNodes([]);
        expect(focus.right[5]?.children).toEqualEditorNodes([]);
        expect(focus.right[6]?.children).toEqualEditorNodes([]);
        expect(focus.right[7]?.children).toEqualEditorNodes([]);
        expect(focus.right[8]?.children).toEqualEditorNodes([]);
    });

    test("pressing down a second time will add a third row with a bar", () => {
        const zipper: Zipper = {
            row: zrow([], row("2x+5=10").children),
            breadcrumbs: [],
        };
        const state = stateFromZipper(zipper);

        const newState = verticalWork(verticalWork(state, "down"), "down");

        const focus = newState.zipper.breadcrumbs[0].focus;
        if (focus.type !== "ztable") {
            throw new Error("focus should be a ZTable");
        }
        expect(focus.left).toHaveLength(20);

        // Empty cells are place at the start and end
        expect(focus.left[0]?.children).toEqualEditorNodes([]);
        expect(focus.left[1]?.children).toEqualEditorNodes(row("2x").children);
        // Empty cells are placed in front of each plus/minus opeartor
        expect(focus.left[2]?.children).toEqualEditorNodes([]);
        expect(focus.left[3]?.children).toEqualEditorNodes(row("+").children);
        expect(focus.left[4]?.children).toEqualEditorNodes(row("5").children);
        // Empty cells are placed around each relationship operator
        expect(focus.left[5]?.children).toEqualEditorNodes([]);
        expect(focus.left[6]?.children).toEqualEditorNodes(row("=").children);
        expect(focus.left[7]?.children).toEqualEditorNodes([]);
        expect(focus.left[8]?.children).toEqualEditorNodes(row("10").children);
        expect(focus.left[9]?.children).toEqualEditorNodes([]);

        // The cursor is placed in the first column of the second row
        expect(focus.right).toHaveLength(9);

        // All cells in the second row are empty to begin with
        expect(focus.left[10]?.children).toEqualEditorNodes([]);
        expect(focus.left[11]?.children).toEqualEditorNodes([]);
        expect(focus.left[12]?.children).toEqualEditorNodes([]);
        expect(focus.left[13]?.children).toEqualEditorNodes([]);
        expect(focus.left[14]?.children).toEqualEditorNodes([]);
        expect(focus.left[15]?.children).toEqualEditorNodes([]);
        expect(focus.left[16]?.children).toEqualEditorNodes([]);
        expect(focus.left[17]?.children).toEqualEditorNodes([]);
        expect(focus.left[18]?.children).toEqualEditorNodes([]);

        // All cells in the third row are empty to begin with
        expect(focus.right[0]?.children).toEqualEditorNodes([]);
        expect(focus.right[1]?.children).toEqualEditorNodes([]);
        expect(focus.right[2]?.children).toEqualEditorNodes([]);
        expect(focus.right[3]?.children).toEqualEditorNodes([]);
        expect(focus.right[4]?.children).toEqualEditorNodes([]);
        expect(focus.right[5]?.children).toEqualEditorNodes([]);
        expect(focus.right[6]?.children).toEqualEditorNodes([]);
        expect(focus.right[7]?.children).toEqualEditorNodes([]);
        expect(focus.right[8]?.children).toEqualEditorNodes([]);

        expect(focus.rowStyles).toEqual([null, null, {border: "top"}]);
    });

    test("pressing down a third time will does nothing", () => {
        const zipper: Zipper = {
            row: zrow([], row("2x+5=10").children),
            breadcrumbs: [],
        };
        const state = stateFromZipper(zipper);

        const newState = verticalWork(
            verticalWork(verticalWork(state, "down"), "down"),
            "down",
        );

        const focus = newState.zipper.breadcrumbs[0].focus;
        if (focus.type !== "ztable") {
            throw new Error("focus should be a ZTable");
        }

        expect(focus.rowCount).toEqual(3);
    });

    test("pressing up from inside an empty third row will remove that row", () => {
        const zipper: Zipper = {
            row: zrow([], row("2x+5=10").children),
            breadcrumbs: [],
        };
        const state = stateFromZipper(zipper);

        const newState = verticalWork(
            verticalWork(verticalWork(state, "down"), "down"),
            "up",
        );

        const focus = newState.zipper.breadcrumbs[0].focus;
        if (focus.type !== "ztable") {
            throw new Error("focus should be a ZTable");
        }
        expect(focus.left).toHaveLength(10);

        // Empty cells are place at the start and end
        expect(focus.left[0]?.children).toEqualEditorNodes([]);
        expect(focus.left[1]?.children).toEqualEditorNodes(row("2x").children);
        // Empty cells are placed in front of each plus/minus opeartor
        expect(focus.left[2]?.children).toEqualEditorNodes([]);
        expect(focus.left[3]?.children).toEqualEditorNodes(row("+").children);
        expect(focus.left[4]?.children).toEqualEditorNodes(row("5").children);
        // Empty cells are placed around each relationship operator
        expect(focus.left[5]?.children).toEqualEditorNodes([]);
        expect(focus.left[6]?.children).toEqualEditorNodes(row("=").children);
        expect(focus.left[7]?.children).toEqualEditorNodes([]);
        expect(focus.left[8]?.children).toEqualEditorNodes(row("10").children);
        expect(focus.left[9]?.children).toEqualEditorNodes([]);

        // The cursor is placed in the first column of the second row
        expect(focus.right).toHaveLength(9);
        expect(focus.rowCount).toEqual(2);

        expect(focus.rowStyles).toEqual([null, null]);
    });

    test("pressing up from from inside an empty second row will join the cells in the row", () => {
        const zipper: Zipper = {
            row: zrow([], row("2x+5=10").children),
            breadcrumbs: [],
        };
        const state = stateFromZipper(zipper);

        const newState = verticalWork(verticalWork(state, "down"), "up");

        expect(newState.zipper.breadcrumbs).toHaveLength(0);
        expect(newState.zipper.row.left).toEqualEditorNodes([]);
        expect(newState.zipper.row.right).toEqualEditorNodes(
            row("2x+5=10").children,
        );
    });

    describe("backspace", () => {
        const {glyph} = builders;
        const node: types.Table = builders.algebra(
            [
                // first row
                [glyph("2"), glyph("x")],
                [glyph("+")],
                [glyph("5")],

                // second row
                [glyph("2"), glyph("x")],
                [glyph("\u2212")],
                [glyph("5")],
            ],
            3,
            2,
        );

        const bcRow: BreadcrumbRow = {
            id: getId(),
            type: "bcrow",
            left: [],
            right: [],
            style: {},
        };

        test("backspace moves to the left", () => {
            const zipper: Zipper = {
                row: util.zrow(getId(), [], row("\u2212").children),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 4),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = backspace(state);

            const {zipper: result} = newState;
            expect(result.row.left).toEqualEditorNodes([
                glyph("2"),
                glyph("x"),
            ]);
            expect(result.row.right).toEqualEditorNodes([]);
        });

        test("backspace moves to the left and deletes operators", () => {
            const zipper: Zipper = {
                row: util.zrow(getId(), [], row("5").children),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 5),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = backspace(state);

            const {zipper: newZipper} = newState;
            const {focus} = newZipper.breadcrumbs[0];
            expect(newZipper.row.left).toEqualEditorNodes([]);
            expect(newZipper.row.right).toEqualEditorNodes([]);
            expect(focus.left).toHaveLength(4);
        });
    });

    describe("moving horizontally", () => {
        const {glyph} = builders;
        const node: types.Table = builders.algebra(
            [
                // first row
                [glyph("2"), glyph("x")],
                [glyph("+")],
                [glyph("5")],

                // second row
                [glyph("2"), glyph("x")],
                [glyph("\u2212")],
                [glyph("5")],
            ],
            3,
            2,
        );

        const bcRow: BreadcrumbRow = {
            id: getId(),
            type: "bcrow",
            left: [],
            right: [],
            style: {},
        };

        test("can't move left past the start of a row", () => {
            const zipper: Zipper = {
                row: util.zrow(getId(), [], row("2x").children),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 3),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = moveLeft(state);

            expect(newState).toEqual(state);
        });

        test("can't move right past the end of a row", () => {
            const zipper: Zipper = {
                row: util.zrow(getId(), row("5").children, []),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 5),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = moveRight(state);

            expect(newState).toEqual(state);
        });

        test("moving left over an operator skips the cell", () => {
            const zipper: Zipper = {
                row: util.zrow(getId(), [], row("5").children),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 5),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = moveLeft(state);

            const {zipper: newZipper} = newState;
            const {focus} = newZipper.breadcrumbs[0];
            expect(focus.left).toHaveLength(3);
            expect(focus.right).toHaveLength(2);
            expect(newZipper.row.left).toEqualEditorNodes([
                glyph("2"),
                glyph("x"),
            ]);
            expect(newZipper.row.right).toEqualEditorNodes([]);
        });

        test("moving right over an operator skips the cell", () => {
            const zipper: Zipper = {
                row: util.zrow(getId(), row("2x").children, []),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 3),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = moveRight(state);

            const {zipper: newZipper} = newState;
            const {focus} = newZipper.breadcrumbs[0];
            expect(focus.left).toHaveLength(5);
            expect(focus.right).toHaveLength(0);
            expect(newZipper.row.left).toEqualEditorNodes([]);
            expect(newZipper.row.right).toEqualEditorNodes([glyph("5")]);
        });

        test("can't exit table to right even if last column is empty", () => {
            const node: types.Table = builders.algebra(
                [
                    // first row
                    [],
                    [glyph("2"), glyph("x")],
                    [glyph("+")],
                    [glyph("5")],
                    [],

                    // second row
                    [],
                    [],
                    [glyph("\u2212")],
                    [glyph("5")],
                    [],

                    // third row
                    [],
                    [glyph("2"), glyph("x")],
                    [glyph("+")],
                    [glyph("0")],
                    [],
                ],
                5,
                3,
            );

            const zipper: Zipper = {
                row: util.zrow(getId(), row("0").children, []),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 13),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = moveRight(state);

            expect(state).toEqual(newState);
        });

        test("can't wrap around from one row to the previous when navigating left even if there's a empty column", () => {
            const node: types.Table = builders.algebra(
                [
                    // first row
                    [],
                    [glyph("2"), glyph("x")],
                    [glyph("+")],
                    [glyph("5")],
                    [],

                    // second row
                    [],
                    [],
                    [glyph("\u2212")],
                    [glyph("5")],
                    [],

                    // third row
                    [],
                    [glyph("2"), glyph("x")],
                    [glyph("+")],
                    [glyph("0")],
                    [],
                ],
                5,
                3,
            );

            const zipper: Zipper = {
                row: util.zrow(getId(), [], row("2x").children),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 11),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = moveLeft(state);

            expect(state).toEqual(newState);
        });
    });

    describe("entering characters", () => {
        const {glyph} = builders;
        const node: types.Table = builders.algebra(
            [
                // first row
                [glyph("2"), glyph("x")],
                [glyph("+")],
                [glyph("5")],
                [glyph("=")],
                [glyph("1"), glyph("0")],

                // second row
                [glyph("2"), glyph("x")],
                [],
                [],
                [],
                [],
            ],
            5,
            2,
        );

        const bcRow: BreadcrumbRow = {
            id: getId(),
            type: "bcrow",
            left: [],
            right: [],
            style: {},
        };

        test("plus/minus operator in a plus/mins column will insert and move to the next cell", () => {
            const zipper: Zipper = {
                row: util.zrow(getId(), [], []),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 6),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = insertChar(state, "\u2212");

            const {zipper: newZipper} = newState;
            const {focus} = newZipper.breadcrumbs[0];
            expect(focus.left).toHaveLength(7);
            expect(focus.right).toHaveLength(2);
            expect(focus.left[6]?.children).toEqualEditorNodes([
                glyph("\u2212"),
            ]);
        });

        test("non plus/minus operator in plus/minus column will move to the next cell and then insert", () => {
            const zipper: Zipper = {
                row: util.zrow(getId(), [], []),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 6),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = insertChar(state, "a");

            const {zipper: newZipper} = newState;
            const {focus} = newZipper.breadcrumbs[0];
            expect(focus.left).toHaveLength(7);
            expect(focus.right).toHaveLength(2);
            expect(focus.left[6]?.children).toEqualEditorNodes([]);
            expect(newZipper.row.left).toEqualEditorNodes([glyph("a")]);
        });

        test("relation operator in a relation column will insert and then move to the next cell", () => {
            const zipper: Zipper = {
                row: util.zrow(getId(), [], []),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 8),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = insertChar(state, "=");

            const {zipper: newZipper} = newState;
            const {focus} = newZipper.breadcrumbs[0];
            expect(focus.left).toHaveLength(9);
            expect(focus.right).toHaveLength(0);
            expect(focus.left[8]?.children).toEqualEditorNodes([glyph("=")]);
        });

        test("non-relation operator in a relation column will move to the next cell and then insert", () => {
            const zipper: Zipper = {
                row: util.zrow(getId(), [], []),
                breadcrumbs: [
                    {
                        row: bcRow,
                        focus: util.nodeToFocus(node, 8),
                    },
                ],
            };

            const state = stateFromZipper(zipper);
            const newState = insertChar(state, "a");

            const {zipper: newZipper} = newState;
            const {focus} = newZipper.breadcrumbs[0];
            expect(focus.left).toHaveLength(9);
            expect(focus.right).toHaveLength(0);
            expect(focus.left[6]?.children).toEqualEditorNodes([]);
            expect(newZipper.row.left).toEqualEditorNodes([glyph("a")]);
        });
    });
    // TODO:
    // - create snapshot tests when navigating horizontall across the second row,
    //   this is to ensure that the padding stays the way we want it
});
