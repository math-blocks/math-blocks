import {getId} from "@math-blocks/core";
import * as types from "../ast/types";
import * as builders from "../ast/builders";
import type {ZTable, Zipper, Breadcrumb} from "./types";
import {zrowToRow, zrow} from "./util";

export type Column = readonly types.Row[];

// TODO: capture row styles from ZTable
export type VerticalWork = {
    readonly columns: readonly Column[];
    readonly colCount: number;
    readonly rowCount: number;
    // We use an id for the cursor so that we can move it to the appropriate
    // cell after adding/removing columns.
    readonly cursorId: number;
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
            crumb,
            rowStyles: focus.rowStyles,
        };
    }

    return null;
};

export const verticalWorkToZTable = (work: VerticalWork): Zipper => {
    const {columns, colCount, rowCount, cursorId, crumb} = work;

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
        gutterWidth: 0, // TODO: infer this from the subtype
        rowStyles: work.rowStyles,
        style: {},
    };

    const newZipper: Zipper = {
        row: zrow(cursorCell.id, [], cursorCell.children),
        breadcrumbs: [
            {
                row: crumb.row,
                focus: table,
            },
        ],
    };

    return newZipper;
};

const isCellEmpty = (cell: types.Row | null): boolean =>
    !cell || cell.children.length === 0;
const isColumnEmpty = (col: Column | null): boolean =>
    !col || col.every(isCellEmpty);

export const adjustEmptyColumns = (work: VerticalWork): VerticalWork => {
    // TODO:
    // - reposition cursor appropriate when removing a column containing the cursor
    // - add any empty columns that are missing
    const {columns, colCount, rowCount, cursorId} = work;

    let cursorRow = -1;
    for (let i = 0; i < rowCount; i++) {
        if (columns.some((col) => col[i].id === cursorId)) {
            cursorRow = i;
        }
    }

    const colsToRemove: number[] = [];
    for (let i = 0; i < colCount; i++) {
        const isPrevCellEmpty = isCellEmpty(
            i > 0 ? columns[i - 1][cursorRow] : null,
        );
        const isNextCellEmpty = isCellEmpty(
            i < colCount - 1 ? columns[i + 1][cursorRow] : null,
        );
        if (
            (!isPrevCellEmpty || !isNextCellEmpty) &&
            isColumnEmpty(columns[i])
        ) {
            colsToRemove.push(i);
        }
    }

    const filteredColumns = columns.filter(
        (col, index) => !colsToRemove.includes(index),
    );

    const finalColumns: Column[] = [];
    for (let i = 0; i < filteredColumns.length; i++) {
        const isPrevCellEmpty = isCellEmpty(
            i > 0 ? filteredColumns[i - 1][cursorRow] : null,
        );

        const isFirstColumn = i === 0;
        const isLastColumn = i === filteredColumns.length - 1;

        const isCurrentCellEmpty = isCellEmpty(filteredColumns[i][cursorRow]);
        const isCurrentColumnEmpty = isColumnEmpty(filteredColumns[i]);
        const isPrevColumnEmpty = isColumnEmpty(filteredColumns[i - 1]);

        // First column, current cell is empty, but not the column isn't empty
        if (isFirstColumn && isCurrentCellEmpty && !isCurrentColumnEmpty) {
            const emptyColumn: types.Row[] = [];
            for (let j = 0; j < rowCount; j++) {
                emptyColumn.push(builders.row([]));
            }
            finalColumns.push(emptyColumn);
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
                const emptyColumn: types.Row[] = [];
                for (let j = 0; j < rowCount; j++) {
                    emptyColumn.push(builders.row([]));
                }
                finalColumns.push(emptyColumn);
            }
        }
        finalColumns.push(filteredColumns[i]);

        // Last column, current cell is empty, and the current cell is not
        if (isLastColumn && isCurrentCellEmpty && !isCurrentColumnEmpty) {
            const emptyColumn: types.Row[] = [];
            for (let j = 0; j < rowCount; j++) {
                emptyColumn.push(builders.row([]));
            }
            finalColumns.push(emptyColumn);
        }
    }

    return {
        ...work,
        columns: finalColumns,
        colCount: finalColumns.length,
    };
};
