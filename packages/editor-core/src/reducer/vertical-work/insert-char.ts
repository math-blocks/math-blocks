import * as types from "../../char/types";
import * as builders from "../../char/builders";
import {isAtom} from "../../char/util";

import * as util from "../util";
import {adjustColumns} from "./adjust-columns";
import {
    zipperToVerticalWork,
    verticalWorkToZipper,
    isColumnEmpty,
    isCellEmpty,
    getCursorLoc,
    getCursorCell,
    getPrevCell,
    getNextCell,
    getOtherCells,
    createEmptyColumn,
    createEmptyColumnWithCell,
} from "./util";
import {cursorRight} from "../move-right";

import type {State, Zipper} from "../types";
import type {ZVerticalWork, Column} from "./types";

const isPlusMinus = (cell: types.CharRow | null): boolean =>
    cell?.children.length === 1 && isAtom(cell.children[0], ["+", "\u2212"]);

const isRelOp = (cell: types.CharRow | null): boolean =>
    cell?.children.length === 1 && isAtom(cell.children[0], ["=", ">", "<"]);

const isOp = (cell: types.CharRow | null): boolean =>
    isPlusMinus(cell) || isRelOp(cell);

// TODO: place cursor in lower limits
// TODO: dedupe this with insert-char.ts
const LIMIT_CHARS = [
    "\u03a3", // \sum
    "\u03a0", // \prod
    "\u222B", // \int
    // TODO: handle \lim (need to make sure we exclude the upper limit)
];

const insert = (zipper: Zipper, node: types.CharNode): Zipper => {
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
    const adjustedWork = adjustColumns(work);
    return verticalWorkToZipper(adjustedWork);
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
    const prevCell = getPrevCell(work, cursorCell);
    const nextCell = getNextCell(work, cursorCell);

    const cursorCol = columns[cursorLoc.col];
    const otherCells = getOtherCells(cursorCol, cursorCell);

    const newNode = LIMIT_CHARS.includes(char)
        ? builders.limits(builders.char(char), [], [])
        : builders.char(char);

    if (rowCount === 3 && cursorLoc.row === 2) {
        if (
            !isCellEmpty(cursorCell) &&
            zipper.row.right.length === 0 &&
            ["+", "\u2212", "=", ">", "<"].includes(char) &&
            isCellEmpty(nextCell)
        ) {
            return util.zipperToState(
                cursorRight(insert(cursorRight(zipper), newNode)),
            );
        }
    }

    // If we're in an empty column, empty columns will be inserted to the
    // left and right of the current column.
    if (isColumnEmpty(cursorCol)) {
        // if (["+", "\u2212"].includes(char) && isOp(prevCell)) {
        //     return util.zipperToState(insert(zipper, newNode));
        // }
        const cursorColIndex = columns.findIndex((col) => col === cursorCol);
        const leftEmptyCol = createEmptyColumn(rowCount);
        const newNodeCol: Column = [
            ...cursorCol.slice(0, cursorLoc.row),
            builders.row([newNode]),
            ...cursorCol.slice(cursorLoc.row + 1),
        ];
        const rightEmptyCol = createEmptyColumn(rowCount);
        const newColumns = [
            ...columns.slice(0, cursorColIndex),
            leftEmptyCol,
            newNodeCol,
            rightEmptyCol,
            ...columns.slice(cursorColIndex + 1),
        ];
        const newWork: ZVerticalWork = {
            columns: newColumns,
            colCount: newColumns.length,
            rowCount: rowCount,
            // If a +/- was inserted the cursor will be moved to the right of
            // the cell where the character was inserted.
            cursorId:
                ["+", "\u2212"].includes(char) && !isOp(prevCell)
                    ? rightEmptyCol[cursorLoc.row].id
                    : newNodeCol[cursorLoc.row].id,
            cursorIndex:
                ["+", "\u2212"].includes(char) && !isOp(prevCell) ? 0 : 1,
            crumb: crumb,
            rowStyles: rowStyles,
        };
        const newZipper = verticalWorkToZipper(adjustColumns(newWork));
        return util.zipperToState(newZipper);
    }

    // Inserting +/- operators will result in additional empty columns being
    // inserted.
    // TODO: handle the situation where there are other non-empty cells in the
    // current column.
    if (["+", "\u2212"].includes(char)) {
        // If the current cell isn't empty and the cursor is at the right end
        // of the cell, we insert two now columns to the right.  The +/- operator
        // is inserted into the first new column at the current row and the cursor
        // is places in the second new column.
        if (!isCellEmpty(cursorCell) && zipper.row.right.length === 0) {
            const cursorColIndex = columns.findIndex(
                (col) => col === cursorCol,
            );
            const newPlusMinusCol: types.CharRow[] = [];
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
            const newWork: ZVerticalWork = {
                columns: newColumns,
                colCount: newColumns.length,
                rowCount: rowCount,
                cursorId: newCursorCol[cursorLoc.row].id,
                cursorIndex: 0,
                crumb: crumb,
                rowStyles: rowStyles,
            };
            const newZipper = verticalWorkToZipper(adjustColumns(newWork));
            return util.zipperToState(newZipper);
        }

        // add a new column with +/- when the cursor is at the start of a cell
        if (
            !isCellEmpty(cursorCell) &&
            !isOp(prevCell) &&
            zipper.row.left.length === 0 &&
            otherCells.every(isCellEmpty)
        ) {
            const cursorColIndex = columns.findIndex(
                (col) => col === cursorCol,
            );
            const newPlusMinusCol: types.CharRow[] = [];
            for (let i = 0; i < rowCount; i++) {
                if (i === cursorLoc.row) {
                    newPlusMinusCol.push(builders.row([newNode]));
                } else {
                    newPlusMinusCol.push(builders.row([]));
                }
            }
            const newColumns = [
                ...columns.slice(0, cursorColIndex),
                newPlusMinusCol,
                ...columns.slice(cursorColIndex),
            ];
            const newWork: ZVerticalWork = {
                columns: newColumns,
                colCount: newColumns.length,
                rowCount: rowCount,
                cursorId: cursorCell.id,
                cursorIndex: 0,
                crumb: crumb,
                rowStyles: rowStyles,
            };
            const newZipper = verticalWorkToZipper(adjustColumns(newWork));
            return util.zipperToState(newZipper);
        }

        // split a cell with a +/- operator
        if (
            zipper.row.right.length > 0 &&
            zipper.row.left.length > 0 &&
            otherCells.every(isCellEmpty)
        ) {
            const prevNode = zipper.row.left[zipper.row.left.length - 1];
            if (
                // If there's a +/- operate just to the left of the cursor that
                // would indicate that this operand has one or more unary +/-.
                prevNode.type !== "char" ||
                !["+", "\u2212"].includes(prevNode.value)
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
                const newWork: ZVerticalWork = {
                    columns: newColumns,
                    colCount: newColumns.length,
                    rowCount: rowCount,
                    cursorId: rightCol[cursorLoc.row].id,
                    cursorIndex: 0,
                    crumb: crumb,
                    rowStyles: rowStyles,
                };
                const newZipper = verticalWorkToZipper(adjustColumns(newWork));
                return util.zipperToState(newZipper);
            }
        }
    }

    // |@+y| -> |x@|+|y|
    if (!isCellEmpty(cursorCell) && otherCells.every(isCellEmpty)) {
        if (
            cursorCell.children.length > 0 &&
            cursorCell.children[0].type === "char" &&
            ["+", "\u2212"].includes(cursorCell.children[0].value)
        ) {
            if (!["+", "\u2212"].includes(char)) {
                const cursorColIndex = columns.findIndex(
                    (col) => col === cursorCol,
                );
                const leftCol = createEmptyColumnWithCell(
                    rowCount,
                    cursorLoc.row,
                    builders.row([newNode]),
                );
                const plusMinusCol = createEmptyColumnWithCell(
                    rowCount,
                    cursorLoc.row,
                    builders.row([cursorCell.children[0]]),
                );
                const rightCol = createEmptyColumnWithCell(
                    rowCount,
                    cursorLoc.row,
                    builders.row(cursorCell.children.slice(1)),
                );
                const newColumns = [
                    ...columns.slice(0, cursorColIndex),
                    leftCol,
                    plusMinusCol,
                    rightCol,
                    ...columns.slice(cursorColIndex + 1),
                ];
                const newWork: ZVerticalWork = {
                    columns: newColumns,
                    colCount: newColumns.length,
                    rowCount: rowCount,
                    cursorId: leftCol[cursorLoc.row].id,
                    cursorIndex: 1,
                    crumb: crumb,
                    rowStyles: rowStyles,
                };
                const newZipper = verticalWorkToZipper(adjustColumns(newWork));
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
