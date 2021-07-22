import * as types from "../../ast/types";
import * as builders from "../../ast/builders";
import {isAtom} from "../../ast/util";

import * as util from "../util";
import {cursorLeft} from "../move-left";
import {
    zipperToVerticalWork,
    verticalWorkToZTable,
    adjustEmptyColumns,
    isCellEmpty,
    getCursorLoc,
    getCursorCell,
    getOtherCells,
    createEmptyColumnWithCell,
} from "./util";

import type {VerticalWork} from "./util";
import type {Breadcrumb, Zipper, State} from "../types";

// TODO: rename this and move into utils
const removeEmptyColumns = (zipper: Zipper): Zipper => {
    const work = zipperToVerticalWork(zipper);
    if (!work) {
        return zipper;
    }
    const adjustedWork = adjustEmptyColumns(work);
    return verticalWorkToZTable(adjustedWork);
};

const isPlusMinus = (cell: types.Row | null): cell is types.Row =>
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

                const newZipper = verticalWorkToZTable(
                    adjustEmptyColumns(newWork),
                );
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

    // TODO: figure out what we want to do for deleting at the start of
    // a non-empty cell.
    if (zipper.row.left.length === 0 && zipper.row.right.length === 0) {
        const newZipper = removeEmptyColumns(cursorLeft(zipper));
        return util.zipperToState(newZipper);
    }

    return state;
};
