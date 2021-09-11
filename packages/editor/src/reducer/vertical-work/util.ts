import {getId} from "@math-blocks/core";
import * as types from "../../char/types";
import * as builders from "../../char/builders";
import * as util from "../../char/util";
import type {ZTable, Zipper, Focus} from "../types";
import {zrowToRow, zrow} from "../util";
import type {Column, VerticalWork, ZVerticalWork} from "./types";

export const zipperToVerticalWork = (zipper: Zipper): ZVerticalWork | null => {
    const {breadcrumbs, row: cursorRow} = zipper;
    const crumb = breadcrumbs[0];
    const {focus} = crumb;

    if (
        breadcrumbs.length === 1 &&
        focus.type === "ztable" &&
        focus.subtype === "algebra"
    ) {
        const {rowCount, colCount, left, right} = focus;
        // The ZTable type says it can contain null cells, but right now this
        // never happens so we ignore this.
        const cells = [
            ...left,
            zrowToRow(cursorRow),
            ...right,
        ] as types.CharRow[];

        const columns: Column[] = [];
        for (let i = 0; i < colCount; i++) {
            const col: types.CharRow[] = [];
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

export const verticalWorkToZipper = (work: ZVerticalWork): Zipper => {
    const {columns, colCount, rowCount, cursorId, cursorIndex, crumb} = work;

    const cells: types.CharRow[] = [];
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

export const tableToVerticalWork = (
    table: types.CharTable,
): VerticalWork | null => {
    if (table.subtype !== "algebra") {
        return null;
    }

    const {rowCount, colCount, id, type, subtype, ...rest} = table;
    // The Table type says it can contain null cells, but right now this
    // never happens so we ignore this.
    const cells = table.children as types.CharRow[];

    const columns: Column[] = [];
    for (let i = 0; i < colCount; i++) {
        const col: types.CharRow[] = [];
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
        id,
        type,
        subtype,
        ...rest,
    };
};

export const verticalWorkToTable = (work: VerticalWork): types.CharTable => {
    const {columns, rowCount, ...rest} = work;

    const cells: types.CharRow[] = [];
    for (let i = 0; i < rowCount; i++) {
        for (const col of columns) {
            cells.push(col[i]);
        }
    }

    return {
        children: cells,
        rowCount,
        ...rest,
    };
};

export const isCellEmpty = (cell: types.CharRow | null): boolean =>
    !cell || cell.children.length === 0;
export const isColumnEmpty = (col: Column | null): boolean =>
    !col || col.every(isCellEmpty);

export const isCellPlusMinus = (cell: types.CharRow | null): boolean =>
    cell?.children.length === 1 &&
    util.isAtom(cell.children[0], ["+", "\u2212"]);

export const isCellEqualSign = (cell: types.CharRow | null): boolean =>
    cell?.children.length === 1 && util.isAtom(cell.children[0], "=");

export const isOperator = (cell: types.CharRow | null): boolean =>
    isCellPlusMinus(cell) || isCellEqualSign(cell);

export const isCellSkippable = (cell: types.CharRow | null): boolean =>
    cell?.children.length === 1 &&
    util.isAtom(cell.children[0], ["+", "\u2212", "=", "<", ">"]);

export const isEmpty = (cell: types.CharRow | null): boolean =>
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

export const getCursorLoc = (work: ZVerticalWork): CursorLoc => {
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

export const getCursorCell = (work: ZVerticalWork): types.CharRow => {
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
    work: ZVerticalWork,
    cell: types.CharRow,
): types.CharRow | null => {
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
    work: ZVerticalWork,
    cell: types.CharRow,
): types.CharRow | null => {
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
    keepCell: types.CharRow,
): types.CharRow[] => {
    return col.filter((cell: types.CharRow) => cell !== keepCell);
};

export const createEmptyColumn = (rowCount: number): Column => {
    const emptyCol: types.CharRow[] = [];
    for (let i = 0; i < rowCount; i++) {
        emptyCol.push(builders.row([]));
    }
    return emptyCol;
};

export const createEmptyColumnWithCell = (
    rowCount: number,
    cursorRow: number,
    cell: types.CharRow,
): Column => {
    const col: types.CharRow[] = [];
    for (let i = 0; i < rowCount; i++) {
        if (i === cursorRow) {
            col.push(cell);
        } else {
            col.push(builders.row([]));
        }
    }
    return col;
};
