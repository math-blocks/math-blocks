import {stateFromZipper, toEqualEditorNodes, row, zrow} from "../../test-util";
import {backspace} from "../../backspace";
import {moveLeft} from "../../move-left";
import {moveRight} from "../../move-right";
import {moveUp, moveDown} from "../move-vertically";
import {insertChar} from "../../insert-char";

import {verticalWork} from "../reducer";
import {toEqualZTable, toEqualZipper, textRepsToZipper} from "../test-util";

import type {Zipper, ZTable} from "../../types";

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

expect.extend({toEqualEditorNodes});
expect.extend({toEqualZTable});
expect.extend({toEqualZipper});

describe("verticalWork reducer", () => {
    describe("vertical navigation", () => {
        test("pressing down splits the row into a table", () => {
            const zipper: Zipper = {
                row: zrow([], row("2x+5=10").children),
                breadcrumbs: [],
            };
            const state = stateFromZipper(zipper);

            const {zipper: result} = verticalWork(state, {type: "ArrowDown"});
            const expected = textRepsToZipper(
                " |2x| |+|5| |=| |10| ",
                " | @| | | | | | |  | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("pressing down a second time will add a third row with a bar and removes all empty columns", () => {
            const zipper: Zipper = {
                row: zrow([], row("2x+5=10").children),
                breadcrumbs: [],
            };
            const state = stateFromZipper(zipper);

            const {zipper: result} = verticalWork(
                verticalWork(state, {type: "ArrowDown"}),
                {type: "ArrowDown"},
            );

            const expected = textRepsToZipper(
                "2x|+|5|=|10",
                "  | | | |  ",
                " @| | | |  ",
            );

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

            const expected = textRepsToZipper(
                "2x|+|5|=|10",
                "  | | | |  ",
                " @| | | |  ",
            );

            expect(result).toEqualZipper(expected);
            const focus = result.breadcrumbs[0].focus as ZTable;
            expect(focus.rowStyles).toEqual([null, null, {border: "top"}]);
        });

        test("pressing up from inside an empty third row will remove that row and re-add empty columns", () => {
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

            const expected = textRepsToZipper(
                " |2x| |+|5| |=| |10| ",
                " | @| | | | | | |  | ",
            );

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
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |2x|@| |5| ",
            );

            const state = stateFromZipper(zipper);
            const newState = backspace(state);

            const {zipper: result} = newState;

            const expected: Zipper = textRepsToZipper(
                " |2x | |+|5| ",
                " |2x@| | |5| ",
            );

            expect(result).toEqualZipper(expected);
        });

        // TODO: figure out what the rows should look like after the columns
        // have been adjusted
        test("backspace moves to the left and deletes operators", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+| 5| ",
                " |2x| |+|@5| ",
            );

            const state = stateFromZipper(zipper);
            const newState = backspace(state);

            const {zipper: result} = newState;

            const expected: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |2x| |@|5| ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("merges cells when possible", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| | | | |  | |+|5| ",
                " |  | |+|2|+|@3| | | | ",
            );

            const state = stateFromZipper(zipper);
            const newState = backspace(state);

            const {zipper: result} = newState;

            const expected: Zipper = textRepsToZipper(
                " |2x| | |   | |+|5| ",
                " |  | |+|2@3| | | | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("doesn't merge cells when it doesn't make sense to do so", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| | | |+| 5| ",
                " |  | |+|2|+|@3| ",
            );

            const state = stateFromZipper(zipper);
            const newState = backspace(state);

            const {zipper: result} = newState;

            const expected: Zipper = textRepsToZipper(
                " |2x| | | | |+|5| ",
                " |  | |+|2| |@|3| ",
            );

            expect(result).toEqualZipper(expected);
        });
    });

    describe("moving horizontally", () => {
        test("can't move left past the start of a row", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                "@|2x| |+|5| ",
            );

            const state = stateFromZipper(zipper);
            const newState = moveLeft(state);

            expect(newState).toEqual(state);
        });

        test("can't move right past the end of a row", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |2x| |+|5|@",
            );

            const state = stateFromZipper(zipper);
            const result = moveRight(state);

            expect(result).toEqual(state);
        });

        test("moving left over an operator skips the cell", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+| 5| ",
                " |2x| |+|@5| ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = moveLeft(state);

            const expected: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |2x|@|+|5| ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("moving right over an operator skips the cell", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |2x|@|+|5| ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = moveRight(state);

            const expected: Zipper = textRepsToZipper(
                " |2x| |+| 5| ",
                " |2x| |+|@5| ",
            );

            expect(result).toEqualZipper(expected);
        });

        describe("last row", () => {
            test("move right in the last row skips over empty columns", () => {
                const zipper: Zipper = textRepsToZipper(
                    " |2x | |=| |5| ",
                    " |2x | | | |5| ",
                    " |2x@| |=| |5| ",
                );

                const state = stateFromZipper(zipper);
                const {zipper: result} = moveRight(state);

                const expected: Zipper = textRepsToZipper(
                    " |2x| |=| | 5| ",
                    " |2x| | | | 5| ",
                    " |2x| |=| |@5| ",
                );

                expect(result).toEqualZipper(expected);
            });

            test("move left in the last row skips over empty columns", () => {
                const zipper: Zipper = textRepsToZipper(
                    " |2x| |=| | 5| ",
                    " |2x| | | | 5| ",
                    " |2x| |=| |@5| ",
                );

                const state = stateFromZipper(zipper);
                const {zipper: result} = moveLeft(state);

                const expected: Zipper = textRepsToZipper(
                    " |2x | |=| |5| ",
                    " |2x | | | |5| ",
                    " |2x@| |=| |5| ",
                );

                expect(result).toEqualZipper(expected);
            });
        });
    });

    describe("moving vertically", () => {
        describe("moving down", () => {
            test("adds extra columns as insertion points as needed", () => {
                const zipper: Zipper = textRepsToZipper(
                    " |2x| |+|5@|=|10| ",
                    " |2x| | |  | |  | ",
                );

                const state = stateFromZipper(zipper);
                const {zipper: result} = moveDown(state);

                const expected: Zipper = textRepsToZipper(
                    " |2x| |+|5| |=| |10| ",
                    " |2x| | |@| | | |  | ",
                );

                expect(result).toEqualZipper(expected);
            });

            test("removes extra columns if no longer needed", () => {
                const zipper: Zipper = textRepsToZipper(
                    " | | | | | |+|5@| ",
                    " |+|x| |+|y| |  | ",
                );

                const state = stateFromZipper(zipper);
                const {zipper: result} = moveDown(state);

                const expected: Zipper = textRepsToZipper(
                    " | | | | | |+|5| ",
                    " |+|x|+|y| | |@| ",
                );

                expect(result).toEqualZipper(expected);
            });

            test("moves cursor left if the column it's in gets removed", () => {
                const zipper: Zipper = textRepsToZipper(
                    " | | |@| | |+|5| ",
                    " |+|x| |+|y| | | ",
                );

                const state = stateFromZipper(zipper);
                const {zipper: result} = moveDown(state);

                const expected: Zipper = textRepsToZipper(
                    " | |  | | | |+|5| ",
                    " |+|x@|+|y| | | | ",
                );

                expect(result).toEqualZipper(expected);
            });
        });

        describe("moving up", () => {
            test("removes extra columns if no longer needed", () => {
                const zipper: Zipper = textRepsToZipper(
                    " |2x| |+|5| |=| |10| ",
                    " |2x| | |@| | | |  | ",
                );

                const state = stateFromZipper(zipper);
                const {zipper: result} = moveUp(state);

                const expected: Zipper = textRepsToZipper(
                    " |2x| |+|@5|=|10| ",
                    " |2x| | |  | |  | ",
                );

                expect(result).toEqualZipper(expected);
            });
        });
    });

    describe("inserting characters", () => {
        test("plus/minus operator in a plus/minus column will insert and move to the next cell", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |2x| |@| | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |2x| |+|@| ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("non-plus/minus in plus/minus column will move to the next cell and then insert", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |2x| |@| | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "a");

            const expected: Zipper = textRepsToZipper(
                " |2x| |+|5 | ",
                " |2x| | |a@| ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("plus/minus operator at the end of a non-empty cell", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| | |  | |+|5| ",
                " |2x| |+|x@| | | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepsToZipper(
                " |2x| | | | | |+|5| ",
                " |2x| |+|x|+|@| | | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("plus/minus operator in an empty column", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |2x|@| | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepsToZipper(
                " |2x| | | |+|5| ",
                " |2x| |+|@| | | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("relation operator in a relation column will insert and then move to the next cell", () => {
            const zipper: Zipper = textRepsToZipper(" |x|=|y| ", " | |@| | ");

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "=");

            const expected: Zipper = textRepsToZipper(" |x|=|y| ", " | |=|@| ");

            expect(result).toEqualZipper(expected);
        });

        test("non-relation operator in a relation column will move to the next cell and then insert", () => {
            const zipper: Zipper = textRepsToZipper(
                " |x| |=| |y| ",
                " | | |@| | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "a");

            // TODO: this is not the behavior we want.  We'd like it be the same
            // as if the user had move the cursor right before inserting.
            // Consolidating behavior in adjustColumns should help with this,
            // we'll still need some logic in insertChar to move right before
            // inserting.
            const expected: Zipper = textRepsToZipper(
                " |x| |=|  |y| ",
                " | | | |a@| | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("plus/minus operator at the start of a cell with nothing to the left", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |  | |+|5| ",
                " |2x| |@3| | | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepsToZipper(
                " |2x| | |  | |+|5| ",
                " |2x| |+|@3| | | | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("plus/minus operator at the start of a cell with an operator to the left", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| | |  | |+|5| ",
                " |2x| |+|@3| | | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepsToZipper(
                " |2x| | |   | |+|5| ",
                " |2x| |+|+@3| | | | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("plus/minus operator in an empty cell with an operator to the left", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| | | | |+|5| ",
                " |2x| |+|@| | | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepsToZipper(
                " |2x| | |  | |+|5| ",
                " |2x| |+|+@| | | | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("plus/minus operator at end of cell with other non-empty cells in the column", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+|5 | ",
                " |2x| |+|5@| ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(insertChar(state, "+"), "x");

            const expected: Zipper = textRepsToZipper(
                " |2x| |+|5| | |  | ",
                " |2x| |+|5| |+|x@| ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("plus/minus operator at end of cell in the last row", () => {
            const zipper: Zipper = textRepsToZipper(
                "2x |+|5",
                "2x |-|5",
                "2x@| | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepsToZipper(
                "2x|+|5",
                "2x|-|5",
                "2x|+|@",
            );

            expect(result).toEqualZipper(expected);
        });
    });

    describe("splitting cells", () => {
        test("plus/minus operator splitting a cell", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| | |   | |+|5| ",
                " |2x| |+|2@3| | | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "+");

            const expected: Zipper = textRepsToZipper(
                " |2x| | | | |  | |+|5| ",
                " |2x| |+|2|+|@3| | | | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("operand infront of unary operator", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| | |   | |+|5| ",
                " |2x| |+|@+y| | | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = insertChar(state, "x");

            const expected: Zipper = textRepsToZipper(
                " |2x| | |  | | | |+|5| ",
                " |2x| |+|x@|+|y| | | | ",
            );

            expect(result).toEqualZipper(expected);
        });
    });

    describe("merging cells", () => {
        test("deleting operands infront of plus/minus operators merge next two cell", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| | |  | | | |+|5| ",
                " |2x| |+|x@|+|y| | | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = backspace(state);

            const expected: Zipper = textRepsToZipper(
                " |2x| | |   | |+|5| ",
                " |2x| |+|@+y| | | | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("deleting plus/minus operators merge prev and next cell", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| | | |  | | |+|5| ",
                " |2x| |+|x|+@|y| | | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = backspace(state);

            const expected: Zipper = textRepsToZipper(
                " |2x| | |   | |+|5| ",
                " |2x| |+|x@y| | | | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("removing excess empty column when deleting operand", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| | | | |  | |+|5| ",
                " |2x| |+|x|+|y@| | | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = backspace(state);

            const expected: Zipper = textRepsToZipper(
                " |2x| | | | | |+|5| ",
                " |2x| |+|x|+|@| | | ",
            );

            expect(result).toEqualZipper(expected);
        });

        test("deleting the contents of a cell followed by an empty row doesn't delete the column if there", () => {
            const zipper: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |2@| | | | ",
            );

            const state = stateFromZipper(zipper);
            const {zipper: result} = backspace(state);

            const expected: Zipper = textRepsToZipper(
                " |2x| |+|5| ",
                " |@ | | | | ",
            );

            expect(result).toEqualZipper(expected);
        });
    });

    // TODO:
    // - create snapshot tests when navigating horizontally across the second row,
    //   this is to ensure that the padding stays the way we want it
});
