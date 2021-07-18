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
    getCursorLoc,
    getCursorCell,
    getOtherCells,
    createEmptyColumn,
    createEmptyColumnWithCell,
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
            left: [...zipper.row.left, node],
        },
    };
};

// TODO: rename this and move into utils
const removeEmptyColumns = (zipper: Zipper): Zipper => {
    const work = zipperToVerticalWork(zipper);
    if (!work) {
        return zipper;
    }
    const adjustedWork = adjustEmptyColumns(work);
    return verticalWorkToZTable(adjustedWork);
};

export const insertChar = (state: State, char: string): State => {
    const zipper = state.zipper;

    // TODO: handle selection

    const work = zipperToVerticalWork(zipper);
    if (!work) {
        return state;
    }

    const {columns, rowCount, crumb, rowStyles} = work;

    const cursorCell = getCursorCell(work);
    const cursorLoc = getCursorLoc(work);

    const cursorCol = columns[cursorLoc.col];
    const otherCells = getOtherCells(cursorCol, cursorCell);

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
            const newEmptyCol = createEmptyColumn(rowCount);
            const newPlusMinusCol: Column = [
                ...cursorCol.slice(0, cursorLoc.row),
                builders.row([newNode]),
                ...cursorCol.slice(cursorLoc.row + 1),
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
                cursorId: newCursorCol[cursorLoc.row].id,
                cursorIndex: 0,
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
            const newPlusMinusCol: types.Row[] = [];
            for (let i = 0; i < rowCount; i++) {
                if (i === cursorLoc.row) {
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
                cursorId: newCursorCol[cursorLoc.row].id,
                cursorIndex: 0,
                crumb: crumb,
                rowStyles: rowStyles,
            };
            const newZipper = verticalWorkToZTable(adjustEmptyColumns(newWork));
            return util.zipperToState(newZipper);
        }

        if (zipper.row.right.length > 0 && zipper.row.left.length > 0) {
            const prevNode = zipper.row.left[zipper.row.left.length - 1];
            if (
                // TODO: handle the situation where there are other non-empty
                // cells in the current column
                // otherCells.every(isCellEmpty) &&
                // If there's a +/- operate just to the left of the cursor that
                // would indicate that this operand has one or more unary +/-.
                prevNode.type !== "atom" ||
                !["+", "\u2212"].includes(prevNode.value.char)
            ) {
                const cursorColIndex = columns.findIndex(
                    (col) => col === cursorCol,
                );
                const leftCol = createEmptyColumnWithCell(
                    rowCount,
                    cursorLoc.row,
                    builders.row(zipper.row.left),
                );
                const newPlusMinusCol = createEmptyColumnWithCell(
                    rowCount,
                    cursorLoc.row,
                    builders.row([newNode]),
                );
                const rightCol = createEmptyColumnWithCell(
                    rowCount,
                    cursorLoc.row,
                    builders.row(zipper.row.right),
                );
                const newColumns = [
                    ...columns.slice(0, cursorColIndex),
                    leftCol,
                    newPlusMinusCol,
                    rightCol,
                    ...columns.slice(cursorColIndex + 1),
                ];
                const newWork: VerticalWork = {
                    columns: newColumns,
                    colCount: newColumns.length,
                    rowCount: rowCount,
                    cursorId: rightCol[cursorLoc.row].id,
                    cursorIndex: 0,
                    crumb: crumb,
                    rowStyles: rowStyles,
                };
                const newZipper = verticalWorkToZTable(
                    adjustEmptyColumns(newWork),
                );
                return util.zipperToState(newZipper);
            }
        }
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

    const newZipper: Zipper = {
        ...zipper,
        row: {
            ...zipper.row,
            left: [...zipper.row.left, newNode],
        },
    };

    return util.zipperToState(removeEmptyColumns(newZipper));
};
