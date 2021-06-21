import {verticalWork} from "../vertical-work";
import {stateFromZipper, toEqualEditorNodes, row, zrow} from "../test-util";

import type {Zipper} from "../types";

expect.extend({toEqualEditorNodes});

describe("verticalWork", () => {
    test("pressing down splits the row into a table", () => {
        const zipper: Zipper = {
            row: zrow([], row("2x+5=10").children),
            breadcrumbs: [],
        };
        const state = stateFromZipper(zipper);

        const newState = verticalWork(state);

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
});
