import assert from "assert";
import {getId} from "@math-blocks/core";

import {stateFromZipper, toEqualEditorNodes, row, zrow} from "../../test-util";
import * as util from "../../util";
import {backspace} from "../../backspace";
import {moveLeft} from "../../move-left";
import {moveRight} from "../../move-right";
import {moveUp, moveDown} from "../move-vertically";
import {insertChar} from "../../insert-char";

import {verticalWork} from "../reducer";

import type {BreadcrumbRow, Zipper, ZTable} from "../../types";

declare global {
    /* eslint-disable */
    namespace jest {
        interface Matchers<R, T> {
            toEqualZTable(actual: ZTable): R;
            toEqualZipper(actual: Zipper): R;
        }
    }
    /* eslint-enable */
}

const toEqualZTable = (
    expected: ZTable,
    actual: ZTable,
): {readonly message: () => string; readonly pass: boolean} => {
    if (expected.colCount !== actual.colCount) {
        return {
            message: () =>
                `Expected ZTable to have ${expected.colCount} columns but had ${actual.colCount} instead.`,
            pass: false,
        };
    }

    if (expected.rowCount !== actual.rowCount) {
        return {
            message: () =>
                `Expected ZTable to have ${expected.rowCount} rows but had ${actual.rowCount} instead.`,
            pass: false,
        };
    }

    const expectedCursorCol = expected.left.length % expected.colCount;
    const actualCursorCol = actual.left.length % actual.colCount;

    if (expectedCursorCol !== actualCursorCol) {
        return {
            message: () =>
                `Expected cursor to be in column ${expectedCursorCol} but was in column ${actualCursorCol}.`,
            pass: false,
        };
    }

    const expectedCursorRow = Math.floor(
        expected.left.length / expected.colCount,
    );
    const actualCursorRow = Math.floor(
        expected.left.length / expected.colCount,
    );

    if (expectedCursorRow !== actualCursorRow) {
        return {
            message: () =>
                `Expected cursor to be in row ${expectedCursorRow} but was in row ${actualCursorRow}.`,
            pass: false,
        };
    }

    for (let i = 0; i < expected.left.length; i++) {
        const actualLeft = actual.left[i];
        const expectedLeft = expected.left[i];
        if (actualLeft && expectedLeft) {
            expect(actualLeft.children).toEqualEditorNodes(
                expectedLeft.children,
            );
        }
    }

    for (let i = 0; i < expected.right.length; i++) {
        const actualRight = actual.right[i];
        const expectedRight = expected.right[i];
        if (actualRight && expectedRight) {
            expect(actualRight.children).toEqualEditorNodes(
                expectedRight.children,
            );
        }
    }

    return {
        message: () => "Everything passed",
        pass: true,
    };
};

const toEqualZipper = (
    expected: Zipper,
    actual: Zipper,
): {readonly message: () => string; readonly pass: boolean} => {
    const actualCrumb = actual.breadcrumbs[actual.breadcrumbs.length - 1];
    const expectedCrumb = expected.breadcrumbs[expected.breadcrumbs.length - 1];

    if (
        actualCrumb.focus.type === "ztable" &&
        expectedCrumb.focus.type === "ztable"
    ) {
        expect(actualCrumb.focus).toEqualZTable(expectedCrumb.focus);
        expect(actual.row.left).toEqualEditorNodes(expected.row.left);
        expect(actual.row.right).toEqualEditorNodes(expected.row.right);
    }

    return {
        message: () => "Everything passed",
        pass: true,
    };
};

expect.extend({toEqualEditorNodes});
expect.extend({toEqualZTable});
expect.extend({toEqualZipper});

const textRepToZipper = (textRep: string): Zipper => {
    const lines = textRep
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split("|").map((cell) => cell.trim()));

    assert.equal(lines[0].length, lines[1].length);

    const cells: string[] = [];
    for (const line of lines) {
        cells.push(...line);
    }
    const cursorIndex = cells.findIndex((cell) => cell.includes("@"));

    assert.notEqual(cursorIndex, -1);

    const focus: ZTable = {
        id: getId(),
        type: "ztable",
        subtype: "algebra",
        rowCount: lines.length,
        colCount: lines[0].length,
        left: cells.slice(0, cursorIndex).map(row),
        right: cells.slice(cursorIndex + 1).map(row),
        style: {},
    };

    const bcRow: BreadcrumbRow = {
        id: getId(),
        type: "bcrow",
        left: [],
        right: [],
        style: {},
    };

    const cursorCell = cells[cursorIndex];
    const [left, right] = cursorCell.split("@");

    const zipper: Zipper = {
        // TODO: generate a zrow based on the cell containing the '@'
        row: util.zrow(getId(), row(left).children, row(right).children),
        breadcrumbs: [
            {
                row: bcRow,
                focus: focus,
            },
        ],
    };

    return zipper;
};

describe("verticalWork reducer", () => {
    describe("vertical navigation", () => {
        test("pressing down splits the row into a table", () => {
            const zipper: Zipper = {
                row: zrow([], row("2x+5=10").children),
                breadcrumbs: [],
            };
            const state = stateFromZipper(zipper);

            const {zipper: result} = verticalWork(state, {type: "ArrowDown"});
            const expected = textRepToZipper(`
             |2x| |+|5| |=| |10| 
             | @| | | | | | |  | `);

            expect(result).toEqualZipper(expected);
        });

        test("pressing down a second time will add a third row with a bar", () => {
            const zipper: Zipper = {
                row: zrow([], row("2x+5=10").children),
                breadcrumbs: [],
            };
            const state = stateFromZipper(zipper);

            const {zipper: result} = verticalWork(
                verticalWork(state, {type: "ArrowDown"}),
                {type: "ArrowDown"},
            );

            const expected = textRepToZipper(`
             |2x| |+|5| |=| |10| 
             |  | | | | | | |  | 
             | @| | | | | | |  | `);

            expect(result).toEqualZipper(expected);
            const focus = result.breadcrumbs[0].focus as ZTable;
            expect(focus.rowStyles).toEqual([null, null, {border: "top"}]);
        });

        test("pressing down a third time will does nothing", () => {
            const zipper: Zipper = {
                row: zrow([], row("2x+5=10").children),
                breadcrumbs: [],
            };
            const state = stateFromZipper(zipper);

            const {zipper: result} = verticalWork(
                verticalWork(verticalWork(state, {type: "ArrowDown"}), {
                    type: "ArrowDown",
                }),
                {type: "ArrowDown"},
            );

            const expected = textRepToZipper(`
             |2x| |+|5| |=| |10| 
             |  | | | | | | |  | 
             | @| | | | | | |  | `);

            expect(result).toEqualZipper(expected);
            const focus = result.breadcrumbs[0].focus as ZTable;
            expect(focus.rowStyles).toEqual([null, null, {border: "top"}]);
        });

        test("pressing up from inside an empty third row will remove that row", () => {
            const zipper: Zipper = {
                row: zrow([], row("2x+5=10").children),
                breadcrumbs: [],
            };
            const state = stateFromZipper(zipper);

            const {zipper: result} = verticalWork(
                verticalWork(verticalWork(state, {type: "ArrowDown"}), {
                    type: "ArrowDown",
                }),
                {type: "ArrowUp"},
            );

            const expected = textRepToZipper(`
             |2x| |+|5| |=| |10| 
             | @| | | | | | |  | `);

            expect(result).toEqualZipper(expected);
        });

        test("pressing up from from inside an empty second row will join the cells in the row", () => {
            const zipper: Zipper = {
                row: zrow([], row("2x+5=10").children),
                breadcrumbs: [],
            };
            const state = stateFromZipper(zipper);

            const newState = verticalWork(
                verticalWork(state, {type: "ArrowDown"}),
                {type: "ArrowUp"},
            );

            expect(newState.zipper.breadcrumbs).toHaveLength(0);
            expect(newState.zipper.row.left).toEqualEditorNodes([]);
            expect(newState.zipper.row.right).toEqualEditorNodes(
                row("2x+5=10").children,
            );
        });
    });

    describe("backspace", () => {
        test("backspace moves to the left", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| |+|5| 
             |2x|@| |5|`);

            const state = stateFromZipper(zipper);
            const newState = backspace(state);

            const {zipper: result} = newState;

            const expected: Zipper = textRepToZipper(`
             |2x | |+|5| 
             |2x@| | |5| `);

            expect(result).toEqualZipper(expected);
        });

        // TODO: figure out what the rows should look like after the columns
        // have been adjusted
        test("backspace moves to the left and deletes operators", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| |+| 5| 
             |2x| |+|@5| `);

            const state = stateFromZipper(zipper);
            const newState = backspace(state);

            const {zipper: result} = newState;

            const expected: Zipper = textRepToZipper(`
             |2x| |+|5| 
             |2x| |@|5| `);

            expect(result).toEqualZipper(expected);
        });

        test("merges cells when possible", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| | | | |  | |+|5| 
             |  | |+|2|+|@3| | | | `);

            const state = stateFromZipper(zipper);
            const newState = backspace(state);

            const {zipper: result} = newState;

            const expected: Zipper = textRepToZipper(`
             |2x| | |   | |+|5| 
             |  | |+|2@3| | | | `);

            expect(result).toEqualZipper(expected);
        });

        test("doesn't merge cells when it doesn't make sense to do so", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| | | |+| 5| 
             |  | |+|2|+|@3| `);

            const state = stateFromZipper(zipper);
            const newState = backspace(state);

            const {zipper: result} = newState;

            const expected: Zipper = textRepToZipper(`
             |2x| | | | |+|5| 
             |  | |+|2| |@|3| `);

            expect(result).toEqualZipper(expected);
        });
    });

    describe("moving horizontally", () => {
        test("can't move left past the start of a row", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| |+|5| 
            @|2x| |+|5| `);

            const state = stateFromZipper(zipper);
            const newState = moveLeft(state);

            expect(newState).toEqual(state);
        });

        test("can't move right past the end of a row", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| |+|5| 
             |2x| |+|5|@`);

            const state = stateFromZipper(zipper);
            const result = moveRight(state);

            expect(result).toEqual(state);
        });

        test("moving left over an operator skips the cell", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| |+| 5| 
             |2x| |+|@5| `);

            const state = stateFromZipper(zipper);
            const {zipper: result} = moveLeft(state);

            const expected: Zipper = textRepToZipper(`
             |2x| |+|5| 
             |2x|@|+|5| `);

            expect(result).toEqualZipper(expected);
        });

        test("moving right over an operator skips the cell", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| |+|5| 
             |2x|@|+|5| `);

            const state = stateFromZipper(zipper);
            const {zipper: result} = moveRight(state);

            const expected: Zipper = textRepToZipper(`
             |2x| |+| 5| 
             |2x| |+|@5| `);

            expect(result).toEqualZipper(expected);
        });
    });

    describe("moving vertically", () => {
        describe("moving down", () => {
            test("adds extra columns as insertion points as needed", () => {
                const zipper: Zipper = textRepToZipper(`
                 |2x| |+|5@|=|10|  
                 |2x| | |  | |  | `);

                const state = stateFromZipper(zipper);
                const {zipper: result} = moveDown(state);

                const expected: Zipper = textRepToZipper(`
                 |2x| |+|5| |=| |10|  
                 |2x| | |@| | | |  | `);

                expect(result).toEqualZipper(expected);
            });

            test("removes extra columns if no longer needed", () => {
                const zipper: Zipper = textRepToZipper(`
                 | | | | | |+|5@|  
                 |+|x| |+|y| |  | `);

                const state = stateFromZipper(zipper);
                const {zipper: result} = moveDown(state);

                const expected: Zipper = textRepToZipper(`
                 | | | | | |+|5|  
                 |+|x|+|y| | |@| `);

                expect(result).toEqualZipper(expected);
            });
        });

        describe("moving up", () => {
            test("removes extra columns if no longer needed", () => {
                const zipper: Zipper = textRepToZipper(`
                |2x| |+|5| |=| |10|  
                |2x| | |@| | | |  | `);

                const state = stateFromZipper(zipper);
                const {zipper: result} = moveUp(state);

                const expected: Zipper = textRepToZipper(`
                 |2x| |+|@5|=|10|  
                 |2x| | |  | |  | `);

                expect(result).toEqualZipper(expected);
            });
        });
    });

    describe("inserting characters", () => {
        test("plus/minus operator in a plus/minus column will insert and move to the next cell", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| |+|5| 
             |2x| |@| | `);

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepToZipper(`
             |2x| |+|5| 
             |2x| |+|@| `);

            expect(result).toEqualZipper(expected);
        });

        test("non-plus/minus in plus/minus column will move to the next cell and then insert", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| |+|5| 
             |2x| |@| | `);

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "a");

            const expected: Zipper = textRepToZipper(`
             |2x| |+|5 | 
             |2x| | |a@| `);

            expect(result).toEqualZipper(expected);
        });

        test("plus/minus operator at the end of a non-empty cell", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| | |  | |+|5| 
             |2x| |+|x@| | | | `);

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepToZipper(`
             |2x| | | | | |+|5| 
             |2x| |+|x|+|@| | | `);

            expect(result).toEqualZipper(expected);
        });

        test("plus/minus operator in an empty column", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| |+|5| 
             |2x|@| | | `);

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepToZipper(`
             |2x| | | |+|5| 
             |2x| |+|@| | | `);

            expect(result).toEqualZipper(expected);
        });

        test("relation operator in a relation column will insert and then move to the next cell", () => {
            const zipper: Zipper = textRepToZipper(`
             |x|=|y| 
             | |@| | `);

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "=");

            const expected: Zipper = textRepToZipper(`
             |x|=|y| 
             | |=|@| `);

            expect(result).toEqualZipper(expected);
        });

        test("non-relation operator in a relation column will move to the next cell and then insert", () => {
            const zipper: Zipper = textRepToZipper(`
             |x|=|y| 
             | |@| | `);

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "a");

            const expected: Zipper = textRepToZipper(`
             |x|=|y| 
             | | |a@| `);

            expect(result).toEqualZipper(expected);
        });

        test("plus/minus operator splitting a cell", () => {
            const zipper: Zipper = textRepToZipper(`
             |2x| | |   | |+|5| 
             |2x| |+|2@3| | | | `);

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepToZipper(`
             |2x| | | | |  | |+|5| 
             |2x| |+|2|+|@3| | | | `);

            expect(result).toEqualZipper(expected);
        });
    });

    // TODO:
    // - create snapshot tests when navigating horizontally across the second row,
    //   this is to ensure that the padding stays the way we want it
});
