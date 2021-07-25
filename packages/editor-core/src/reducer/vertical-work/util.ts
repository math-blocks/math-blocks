import {getId} from "@math-blocks/core";
import * as types from "../../ast/types";
import * as builders from "../../ast/builders";
import * as util from "../../ast/util";
import type {ZTable, Zipper, Breadcrumb, Focus} from "../types";
import {zrowToRow, zrow} from "../util";

export type Column = readonly types.Row[];

export type VerticalWork = {
    readonly columns: readonly Column[];
    readonly colCount: number;
    readonly rowCount: number;
    // The id of the cell in which the cursor resides.
    // We use an id for the cursor so that we can move it to the appropriate
    // cell after adding/removing columns.
    readonly cursorId: number;
    // Location of the cursor within a cell.
    readonly cursorIndex: number;
    readonly crumb: Breadcrumb;
    readonly rowStyles?: ZTable["rowStyles"];
};

export const zipperToVerticalWork = (zipper: Zipper): VerticalWork | null => {
    const {breadcrumbs, row: cursorRow} = zipper;
    const crumb = breadcrumbs[0];
    const {focus} = crumb;

    if (
        breadcrumbs.length === 1 &&
        focus.type === "ztable" &&
        focus.subtype === "algebra"
    ) {
        const {rowCount, colCount, left, right} = focus;
        const cells = [...left, zrowToRow(cursorRow), ...right] as types.Row[]; // ZTables can contain null cells, ignore for now

        const columns: Column[] = [];
        for (let i = 0; i < colCount; i++) {
            const col: types.Row[] = [];
            for (let j = 0; j < rowCount; j++) {
                const index = j * colCount + i;
                col.push(cells[index]);
            }
            columns.push(col); // this is unsafe
        }

        return {
            columns,
            colCount,
            rowCount,
            cursorId: cursorRow.id,
            cursorIndex: cursorRow.left.length,
            crumb,
            rowStyles: focus.rowStyles,
        };
    }

    return null;
};

export const verticalWorkToZTable = (work: VerticalWork): Zipper => {
    const {columns, colCount, rowCount, cursorId, cursorIndex, crumb} = work;

    const cells: types.Row[] = [];
    for (let i = 0; i < rowCount; i++) {
        for (const col of columns) {
            cells.push(col[i]);
        }
    }

    const index = cells.findIndex((cell) => cell.id === cursorId);
    const cursorCell = cells[index];

    const table: ZTable = {
        id: getId(),
        type: "ztable",
        subtype: "algebra",
        rowCount: rowCount,
        colCount: colCount,
        left: cells.slice(0, index),
        right: cells.slice(index + 1),
        rowStyles: work.rowStyles,
        style: {},
    };

    const newZipper: Zipper = {
        row: zrow(
            cursorCell.id,
            cursorCell.children.slice(0, cursorIndex),
            cursorCell.children.slice(cursorIndex),
        ),
        breadcrumbs: [
            {
                row: crumb.row,
                focus: table,
            },
        ],
    };

    return newZipper;
};

export const isCellEmpty = (cell: types.Row | null): boolean =>
    !cell || cell.children.length === 0;
export const isColumnEmpty = (col: Column | null): boolean =>
    !col || col.every(isCellEmpty);

const isCellPlusMinus = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 &&
    util.isAtom(cell.children[0], ["+", "\u2212"]);

const isCellEqualSign = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 && util.isAtom(cell.children[0], "=");

const isOperator = (cell: types.Row | null): boolean =>
    isCellPlusMinus(cell) || isCellEqualSign(cell);

const createEmptyCol = (rowCount: number): types.Row[] => {
    const emptyColumn: types.Row[] = [];
    for (let j = 0; j < rowCount; j++) {
        emptyColumn.push(builders.row([]));
    }
    return emptyColumn;
};

export const adjustEmptyColumns = (work: VerticalWork): VerticalWork => {
    // TODO:
    // - reposition cursor appropriate when removing a column containing the cursor
    // - add any empty columns that are missing
    const {columns, rowCount, colCount} = work;

    const cursorLoc = getCursorLoc(work);

    const colsToRemove = new Set<number>();
    for (let i = 0; i < colCount; i++) {
        const prevColumn = columns[i - 1];
        const nextColumn = columns[i + 1];
        const isPrevCellEmpty = isCellEmpty(columns[i - 1]?.[cursorLoc.row]);
        const isNextCellEmpty = isCellEmpty(columns[i + 1]?.[cursorLoc.row]);

        // If the previous and next cells are not empty but the current column
        // is empty and all other cells in the previous nad next columns are
        // empty remove the current column.
        if (!isPrevCellEmpty && !isNextCellEmpty && isColumnEmpty(columns[i])) {
            if (prevColumn && nextColumn) {
                const otherPrevCells = prevColumn.filter(
                    (cell, index) => index !== cursorLoc.row,
                );
                const otherNextCells = nextColumn.filter(
                    (cell, index) => index !== cursorLoc.row,
                );
                if (
                    otherPrevCells.every(isCellEmpty) &&
                    otherNextCells.every(isCellEmpty)
                ) {
                    colsToRemove.add(i);
                }
            }
        }

        if (i > 0) {
            // If there are two empty columns in a row, delete them while not
            // deleting the column containing the cursor.
            if (isColumnEmpty(columns[i - 1]) && isColumnEmpty(columns[i])) {
                if (cursorLoc.col !== i - 1) {
                    colsToRemove.add(i - 1);
                }
                if (cursorLoc.col !== i) {
                    colsToRemove.add(i);
                }
            }
        }
    }

    // TODO: figure out if we can move the cursor to the left in this situation
    // Prevent the column containing the cursor for being removed
    if (colsToRemove.has(cursorLoc.col)) {
        colsToRemove.delete(cursorLoc.col);
    }

    const filteredColumns = columns.filter(
        (col, index) => !colsToRemove.has(index),
    );

    const finalColumns: Column[] = [];
    for (let i = 0; i < filteredColumns.length; i++) {
        const isPrevCellEmpty = isCellEmpty(
            i > 0 ? filteredColumns[i - 1][cursorLoc.row] : null,
        );

        const isFirstColumn = i === 0;
        const isLastColumn = i === filteredColumns.length - 1;

        const isCurrentCellEmpty = isCellEmpty(
            filteredColumns[i][cursorLoc.row],
        );
        const isCurrentColumnEmpty = isColumnEmpty(filteredColumns[i]);
        const isPrevColumnEmpty = isColumnEmpty(filteredColumns[i - 1]);

        // First column, current cell is empty, but not the column isn't empty
        if (isFirstColumn && isCurrentCellEmpty && !isCurrentColumnEmpty) {
            finalColumns.push(createEmptyCol(rowCount));
        } else if (
            // Not the first column
            !isFirstColumn &&
            // current and previous cells are empty
            isCurrentCellEmpty &&
            isPrevCellEmpty &&
            // but the columns themselves are not
            !isCurrentColumnEmpty &&
            !isPrevColumnEmpty
        ) {
            const prevColHasPlusMinus = filteredColumns[i - 1].some((cell) => {
                if (isCellEmpty(cell)) {
                    return false;
                }
                const child = cell.children[0];
                if (
                    child.type === "atom" &&
                    ["+", "\u2212"].includes(child.value.char)
                ) {
                    return true;
                }
                return false;
            });

            // If the previous column doesn't have any +/- operators than it's
            // safe to insert an empty column here.
            if (!prevColHasPlusMinus) {
                finalColumns.push(createEmptyCol(rowCount));
            }
        } else if (
            !isFirstColumn &&
            !isPrevColumnEmpty &&
            filteredColumns[i].some(isOperator)
        ) {
            if (
                isOperator(filteredColumns[i][cursorLoc.row]) &&
                !isCellEmpty(filteredColumns[i - 1][cursorLoc.row])
            ) {
                // Don't add an empty column if there's an operand to the left
                // of the operator in the cursor row.
            } else {
                finalColumns.push(createEmptyCol(rowCount));
            }
        }

        finalColumns.push(filteredColumns[i]);

        // Last column, current cell is empty, and the current cell is not
        if (isLastColumn && isCurrentCellEmpty && !isCurrentColumnEmpty) {
            finalColumns.push(createEmptyCol(rowCount));
        }
    }

    return {
        ...work,
        columns: finalColumns,
        colCount: finalColumns.length,
    };
};

export const isCellSkippable = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 &&
    util.isAtom(cell.children[0], ["+", "\u2212", "=", "<", ">"]);

export const isEmpty = (cell: types.Row | null): boolean =>
    (cell?.children?.length ?? 0) === 0;

export const getAllowed = (zipper: Zipper, focus: Focus): boolean[] => {
    const children = [...focus.left, zrowToRow(zipper.row), ...focus.right];

    // By default all non-null cells are allowed
    const allowed = children.map((child) => child != null);
    const cursorIndex = focus.left.length;

    if (focus.type === "ztable" && focus.subtype === "algebra") {
        // TODO: handle situations where there's an +/- in a column with operands
        for (let i = 0; i < children.length; i++) {
            if (isCellSkippable(children[i])) {
                allowed[i] = false;
            }
        }

        const cursorRow = Math.floor(cursorIndex / focus.colCount);
        if (cursorRow === 2) {
            for (let i = 0; i < focus.colCount; i++) {
                const col = [
                    children[0 * focus.colCount + i],
                    children[1 * focus.colCount + i],
                    children[2 * focus.colCount + i],
                ];
                if (col.every(isEmpty)) {
                    allowed[2 * focus.colCount + i] = false;
                }
            }
        }
    }

    return allowed;
};

export type CursorLoc = {
    readonly col: number;
    readonly row: number;
};

export const getCursorLoc = (work: VerticalWork): CursorLoc => {
    const {columns, cursorId, colCount, rowCount} = work;

    for (let col = 0; col < colCount; col++) {
        for (let row = 0; row < rowCount; row++) {
            const cell = columns[col][row];
            if (cell.id === cursorId) {
                return {row, col};
            }
        }
    }

    throw new Error(`Couldn't find cell with id: ${cursorId}`);
};

export const getCursorCell = (work: VerticalWork): types.Row => {
    const {columns, cursorId, colCount, rowCount} = work;

    for (let col = 0; col < colCount; col++) {
        for (let row = 0; row < rowCount; row++) {
            const cell = columns[col][row];
            if (cell.id === cursorId) {
                return cell;
            }
        }
    }

    throw new Error(`Couldn't find cell with id: ${cursorId}`);
};

export const getOtherCells = (
    col: Column,
    keepCell: types.Row,
): types.Row[] => {
    return col.filter((cell: types.Row) => cell !== keepCell);
};

export const createEmptyColumn = (rowCount: number): Column => {
    const emptyCol: types.Row[] = [];
    for (let i = 0; i < rowCount; i++) {
        emptyCol.push(builders.row([]));
    }
    return emptyCol;
};

export const createEmptyColumnWithCell = (
    rowCount: number,
    cursorRow: number,
    cell: types.Row,
): Column => {
    const col: types.Row[] = [];
    for (let i = 0; i < rowCount; i++) {
        if (i === cursorRow) {
            col.push(cell);
        } else {
            col.push(builders.row([]));
        }
    }
    return col;
};
