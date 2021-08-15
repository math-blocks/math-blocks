import {getId} from "@math-blocks/core";
import * as types from "../../ast/types";
import * as builders from "../../ast/builders";
import * as util from "../../ast/util";
import type {ZTable, Zipper, Focus} from "../types";
import {zrowToRow, zrow} from "../util";
import type {Column, VerticalWork} from "./types";

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

export const isCellPlusMinus = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 &&
    util.isAtom(cell.children[0], ["+", "\u2212"]);

export const isCellEqualSign = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 && util.isAtom(cell.children[0], "=");

export const isOperator = (cell: types.Row | null): boolean =>
    isCellPlusMinus(cell) || isCellEqualSign(cell);

export const createEmptyCol = (rowCount: number): types.Row[] => {
    const emptyColumn: types.Row[] = [];
    for (let j = 0; j < rowCount; j++) {
        emptyColumn.push(builders.row([]));
    }
    return emptyColumn;
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

export const getPrevCell = (
    work: VerticalWork,
    cell: types.Row,
): types.Row | null => {
    const {columns, colCount, rowCount} = work;

    for (let col = 0; col < colCount; col++) {
        for (let row = 0; row < rowCount; row++) {
            if (columns[col][row] === cell) {
                return columns[col - 1]?.[row] ?? null;
            }
        }
    }
    return null;
};

export const getNextCell = (
    work: VerticalWork,
    cell: types.Row,
): types.Row | null => {
    const {columns, colCount, rowCount} = work;

    for (let col = 0; col < colCount; col++) {
        for (let row = 0; row < rowCount; row++) {
            if (columns[col][row] === cell) {
                return columns[col + 1]?.[row] ?? null;
            }
        }
    }
    return null;
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
