import * as types from "../../ast/types";
import * as builders from "../../ast/builders";
import {isAtom} from "../../ast/util";

import * as util from "../util";
import {
    zipperToVerticalWork,
    verticalWorkToZTable,
    adjustEmptyColumns,
    isColumnEmpty,
    isCellEmpty,
} from "./utils";
import {cursorRight} from "../move-right";

import type {State, Zipper} from "../types";
import type {VerticalWork, Column} from "./utils";

const isPlusMinus = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 && isAtom(cell.children[0], ["+", "\u2212"]);

const isRelOp = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 && isAtom(cell.children[0], ["=", ">", "<"]);

// TODO: place cursor in lower limits
// TODO: dedupe this with insert-char.ts
const LIMIT_CHARS = [
    "\u03a3", // \sum
    "\u03a0", // \prod
    "\u222B", // \int
    // TODO: handle \lim (need to make sure we exclude the upper limit)
];

const insert = (zipper: Zipper, node: types.Node): Zipper => {
    return {
        ...zipper,
        row: {
            ...zipper.row,
            // safe b/c we moved to the start of next cell
            left: [...zipper.row.left, node],
        },
    };
};

const createEmptyColumn = (rowCount: number): Column => {
    const emptyCol: types.Row[] = [];
    for (let i = 0; i < rowCount; i++) {
        emptyCol.push(builders.row([]));
    }
    return emptyCol;
};

export const insertChar = (state: State, char: string): State => {
    const zipper = state.zipper;

    // TODO: handle selection

    const work = zipperToVerticalWork(zipper);
    if (!work) {
        return state;
    }

    const {cursorId, columns, rowCount, crumb, rowStyles} = work;

    const cursorCol = columns.find((col) =>
        col.some((cell) => cell.id === cursorId),
    );
    if (!cursorCol) {
        throw new Error(
            "Couldn't find column with a cell.id matching cursorId",
        );
    }
    const cursorCell = cursorCol.find((cell) => cell.id === cursorId);
    const otherCells = cursorCol.filter((cell) => cell.id !== cursorId);
    if (!cursorCell) {
        throw new Error("Couldn't find a cell with id matching cursorId");
    }

    const newNode = LIMIT_CHARS.includes(char)
        ? builders.limits(builders.glyph(char), [], [])
        : builders.glyph(char);

    // Inserting +/- operators will result in additional empty columns being
    // inserted.
    if (["+", "\u2212"].includes(char)) {
        // If we're in an empty column, empty columns will be inserted to the
        // left and right and the cursor will be moved to the right of the cell
        // where the +/- operator was inserted.
        if (isColumnEmpty(cursorCol)) {
            const cursorColIndex = columns.findIndex(
                (col) => col === cursorCol,
            );
            const cursorRow = cursorCol.findIndex(
                (cell) => cell.id === cursorCell.id,
            );
            const newEmptyCol = createEmptyColumn(rowCount);
            const newPlusMinusCol: Column = [
                ...cursorCol.slice(0, cursorRow),
                builders.row([newNode]),
                ...cursorCol.slice(cursorRow + 1),
            ];
            const newCursorCol = createEmptyColumn(rowCount);
            const newColumns = [
                ...columns.slice(0, cursorColIndex),
                newEmptyCol,
                newPlusMinusCol,
                newCursorCol,
                ...columns.slice(cursorColIndex + 1),
            ];
            const newWork: VerticalWork = {
                columns: newColumns,
                colCount: newColumns.length,
                rowCount: rowCount,
                cursorId: newCursorCol[cursorRow].id,
                crumb: crumb,
                rowStyles: rowStyles,
            };
            const newZipper = verticalWorkToZTable(adjustEmptyColumns(newWork));
            return util.zipperToState(newZipper);
        }

        // If the current cell isn't empty and the cursor is at the right end
        // of the cell, we insert two now columns to the right.  The +/- operator
        // is inserted into the first new column at the current row and the cursor
        // is places in the second new column.
        if (!isCellEmpty(cursorCell) && zipper.row.right.length === 0) {
            const cursorColIndex = columns.findIndex(
                (col) => col === cursorCol,
            );
            const cursorRow = cursorCol.findIndex(
                (cell) => cell.id === cursorCell.id,
            );
            const newPlusMinusCol: types.Row[] = [];
            for (let i = 0; i < rowCount; i++) {
                if (i === cursorRow) {
                    newPlusMinusCol.push(builders.row([newNode]));
                } else {
                    newPlusMinusCol.push(builders.row([]));
                }
            }
            const newCursorCol = createEmptyColumn(rowCount);
            const newColumns = [
                ...columns.slice(0, cursorColIndex + 1),
                newPlusMinusCol,
                newCursorCol,
                ...columns.slice(cursorColIndex + 1),
            ];
            const newWork: VerticalWork = {
                columns: newColumns,
                colCount: newColumns.length,
                rowCount: rowCount,
                cursorId: newCursorCol[cursorRow].id,
                crumb: crumb,
                rowStyles: rowStyles,
            };
            const newZipper = verticalWorkToZTable(adjustEmptyColumns(newWork));
            return util.zipperToState(newZipper);
        }

        // TODO: handle adding an operator in the middle of a cell, e.g.
        // 23 -> 2 + 3
        // TODO: handle deleting an operator and combing cells, if it makes sense
        // we can probably emove the comining part to adjustEmptyColumns and rename
        // it to be adjust columns, e.g.
        // | | | -> |  |
        // |2|3| -> |23|
    }

    // If there's a +/- in one of the other cells in the current column...
    if (isCellEmpty(cursorCell) && otherCells.some(isPlusMinus)) {
        if (["+", "\u2212"].includes(char)) {
            // ...and we're inserting a +/-, insert the char and move right.
            return util.zipperToState(cursorRight(insert(zipper, newNode)));
        } else {
            // ...otherwise, move right right and then insert the new char.
            return util.zipperToState(insert(cursorRight(zipper), newNode));
        }
    }

    // We disallow inserting non-rel-ops in columns with rel-ops in other cells.
    else if (isCellEmpty(cursorCell) && otherCells.some(isRelOp)) {
        if (["=", ">", "<"].includes(char)) {
            // TODO: disallow inserting a rel-op if there isn't already one
            // in the current column.
            return util.zipperToState(cursorRight(insert(zipper, newNode)));
        } else {
            return util.zipperToState(insert(cursorRight(zipper), newNode));
        }
    }

    return state;
};
