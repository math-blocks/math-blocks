import * as types from "../../char/types";
import * as builders from "../../char/builders";
import {isAtom} from "../../char/util";

import * as util from "../util";
import {cursorLeft} from "../move-left";
import {adjustColumns} from "./adjust-columns";
import {
    zipperToVerticalWork,
    verticalWorkToZTable,
    isCellEmpty,
    getCursorLoc,
    getCursorCell,
    getOtherCells,
    createEmptyColumnWithCell,
    isColumnEmpty,
} from "./util";

import type {VerticalWork} from "./types";
import type {Breadcrumb, Zipper, State} from "../types";

// TODO: rename this and move into utils
const removeEmptyColumns = (zipper: Zipper): Zipper => {
    const work = zipperToVerticalWork(zipper);
    if (!work) {
        return zipper;
    }
    const adjustedWork = adjustColumns(work);
    return verticalWorkToZTable(adjustedWork);
};

const isPlusMinus = (cell: types.CharRow | null): cell is types.CharRow =>
    cell?.children.length === 1 &&
    isAtom(cell.children[0], ["+", "\u2212", "="]);

export const backspace = (state: State): State => {
    const zipper = state.zipper;

    const {breadcrumbs, row} = zipper;
    if (breadcrumbs.length === 0) {
        return state;
    }

    const crumb = breadcrumbs[breadcrumbs.length - 1];
    const {focus} = crumb;

    const prevCell = focus.left[focus.left.length - 1];
    // If the previous cell is a single plus/minus character, delete it
    // and move into that cell.
    if (row.left.length === 0 && isPlusMinus(prevCell)) {
        // Try to merge the cells
        const prevPrevCell = focus.left[focus.left.length - 2];
        const work = zipperToVerticalWork(zipper);
        if (work && prevPrevCell && row.right.length > 0) {
            const {columns, rowCount, rowStyles} = work;
            const cursorLoc = getCursorLoc(work);
            const cursorCell = getCursorCell(work);

            const cursorCol = columns[cursorLoc.col];
            const prevCol = columns[cursorLoc.col - 1];
            const prevPrevCol = columns[cursorLoc.col - 2];

            const otherCells = getOtherCells(cursorCol, cursorCell);
            const prevOtherCells = getOtherCells(prevCol, prevCell);
            const prevPrevOtherCells = getOtherCells(prevPrevCol, prevPrevCell);

            // In order to merge cells, we require all other cells in the
            // columns of the cells to be merge to be empty.
            if (
                otherCells.every(isCellEmpty) &&
                prevOtherCells.every(isCellEmpty) &&
                prevPrevOtherCells.every(isCellEmpty)
            ) {
                const mergedCol = createEmptyColumnWithCell(
                    rowCount,
                    cursorLoc.row,
                    builders.row([
                        ...prevPrevCell.children,
                        ...cursorCell.children,
                    ]),
                );

                const newColumns = [
                    ...columns.slice(0, cursorLoc.col - 2),
                    mergedCol,
                    ...columns.slice(cursorLoc.col + 1),
                ];

                // TODO: create a helper function for updating a VerticalWork
                // object with new columns and changing the cursor location.
                const newWork: VerticalWork = {
                    columns: newColumns,
                    colCount: newColumns.length,
                    rowCount: rowCount,
                    cursorId: mergedCol[cursorLoc.row].id,
                    cursorIndex: prevPrevCell.children.length,
                    crumb: crumb,
                    rowStyles: rowStyles,
                };

                const newZipper = verticalWorkToZTable(adjustColumns(newWork));
                return util.zipperToState(newZipper);
            }
        }

        // Erase the contents of the previous cell
        const newPrevCell = {
            ...prevCell,
            children: [],
        };
        const newCrumb: Breadcrumb = {
            ...crumb,
            focus: {
                ...focus,
                left: [...focus.left.slice(0, -1), newPrevCell],
            },
        };
        let newZipper: Zipper = {
            ...zipper,
            breadcrumbs: [...breadcrumbs.slice(0, -1), newCrumb],
        };
        newZipper = cursorLeft(newZipper);
        newZipper = removeEmptyColumns(newZipper);
        // Move left into the now empty cell.
        return util.zipperToState(newZipper);
    }

    // Delete a cell with a single char
    const nextCell = focus.right[0];
    const nextNextCell = focus.right[1];

    // If there's only one glyph left in the current cell...
    if (
        row.left.length === 1 &&
        row.right.length === 0 &&
        row.left[0].type === "char" &&
        prevCell &&
        nextCell &&
        nextNextCell
    ) {
        const work = zipperToVerticalWork(zipper);
        if (work) {
            const cursorLoc = getCursorLoc(work);
            const cursorCell = getCursorCell(work);
            const {columns, rowCount, rowStyles} = work;

            const cursorCol = columns[cursorLoc.col];
            const otherCells = getOtherCells(cursorCol, cursorCell);

            if (isPlusMinus(cursorCell)) {
                // case: |+|x|-@|y| -> |+|x@y|
                // delete the current column and merge the prev and next columns
                const prevCol = columns[cursorLoc.col - 1];
                const nextCol = columns[cursorLoc.col + 1];

                const prevOtherCells = getOtherCells(prevCol, prevCell);
                const nextOtherCells = getOtherCells(nextCol, nextCell);

                // In order to merge cells, we require all other cells in the
                // columns of the cells to be merge to be empty.
                if (
                    otherCells.every(isCellEmpty) &&
                    prevOtherCells.every(isCellEmpty) &&
                    nextOtherCells.every(isCellEmpty) &&
                    !isCellEmpty(prevCell) &&
                    !isCellEmpty(nextCell)
                ) {
                    const mergedCol = createEmptyColumnWithCell(
                        rowCount,
                        cursorLoc.row,
                        builders.row([
                            ...prevCell.children,
                            ...nextCell.children,
                        ]),
                    );

                    const newColumns = [
                        ...columns.slice(0, cursorLoc.col - 1),
                        mergedCol,
                        ...columns.slice(cursorLoc.col + 2),
                    ];

                    // TODO: create a helper function for updating a VerticalWork
                    // object with new columns and changing the cursor location.
                    const newWork: VerticalWork = {
                        columns: newColumns,
                        colCount: newColumns.length,
                        rowCount: rowCount,
                        cursorId: mergedCol[cursorLoc.row].id,
                        cursorIndex: prevCell.children.length,
                        crumb: crumb,
                        rowStyles: rowStyles,
                    };

                    const newZipper = verticalWorkToZTable(
                        adjustColumns(newWork),
                    );
                    return util.zipperToState(newZipper);
                }
            } else {
                // case: |+|x@|-|y| -> |+|-y|
                // Delete the current cell and merge the two cells to the right
                const nextCol = columns[cursorLoc.col + 1];
                const nextNextCol = columns[cursorLoc.col + 2];

                const nextOtherCells = getOtherCells(nextCol, nextCell);
                const nextNextOtherCells = getOtherCells(
                    nextNextCol,
                    nextNextCell,
                );

                // In order to merge cells, we require all other cells in the
                // columns of the cells to be merge to be empty.
                if (
                    otherCells.every(isCellEmpty) &&
                    nextNextOtherCells.every(isCellEmpty) &&
                    nextOtherCells.every(isCellEmpty) &&
                    !isCellEmpty(nextCell) &&
                    !isCellEmpty(nextNextCell)
                ) {
                    const mergedCol = createEmptyColumnWithCell(
                        rowCount,
                        cursorLoc.row,
                        builders.row([
                            ...nextCell.children,
                            ...nextNextCell.children,
                        ]),
                    );

                    const newColumns = [
                        ...columns.slice(0, cursorLoc.col),
                        mergedCol,
                        ...columns.slice(cursorLoc.col + 3),
                    ];

                    // TODO: create a helper function for updating a VerticalWork
                    // object with new columns and changing the cursor location.
                    const newWork: VerticalWork = {
                        columns: newColumns,
                        colCount: newColumns.length,
                        rowCount: rowCount,
                        cursorId: mergedCol[cursorLoc.row].id,
                        cursorIndex: 0,
                        crumb: crumb,
                        rowStyles: rowStyles,
                    };

                    const newZipper = verticalWorkToZTable(
                        adjustColumns(newWork),
                    );
                    return util.zipperToState(newZipper);
                }

                // If the next column is empty
                if (isColumnEmpty(nextCol)) {
                    // Delete the contents of the current cell
                    const newCell = builders.row([]);
                    const updateCursorCol = [
                        ...cursorCol.slice(0, cursorLoc.row),
                        newCell,
                        ...cursorCol.slice(cursorLoc.row + 1),
                    ];
                    // Replace the current column and delete the next column
                    const newColumns = [
                        ...columns.slice(0, cursorLoc.col),
                        updateCursorCol,
                        ...columns.slice(cursorLoc.col + 2),
                    ];
                    const newWork: VerticalWork = {
                        columns: newColumns,
                        colCount: newColumns.length,
                        rowCount: rowCount,
                        cursorId: newCell.id,
                        cursorIndex: 0,
                        crumb: crumb,
                        rowStyles: rowStyles,
                    };

                    const newZipper = verticalWorkToZTable(
                        adjustColumns(newWork),
                    );
                    return util.zipperToState(newZipper);
                }
            }
        }
    }

    // TODO: figure out what we want to do for deleting at the start of
    // a non-empty cell.
    if (zipper.row.left.length === 0 && zipper.row.right.length === 0) {
        const newZipper = removeEmptyColumns(cursorLeft(zipper));
        return util.zipperToState(newZipper);
    }

    return state;
};
