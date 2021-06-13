import * as builders from "../ast/builders";
import * as types from "../ast/types";

import type {State, Zipper, BreadcrumbRow, Breadcrumb, ZTable} from "./types";

export type MatrixActions =
    | {
          type: "InsertMatrix";
      }
    | {
          type: "AddRow";
          side: "above" | "below";
      }
    | {
          type: "AddColumn";
          side: "left" | "right";
      }
    | {
          type: "DeleteRow";
      }
    | {
          type: "DeleteColumn";
      };

type Cell = {
    row: number;
    col: number;
    content: types.Row | BreadcrumbRow | null;
};

// TODO: make the Breadcrumb type generic
const getCellsFromCrumb = (focus: ZTable, bcrow: BreadcrumbRow): Cell[] => {
    const cells: Cell[] = [];
    const {colCount, left, right} = focus;

    let index = 0;
    for (let i = 0; i < left.length; i++) {
        const col = index % colCount;
        const row = Math.floor(index / colCount);
        cells[index++] = {
            row,
            col,
            content: left[i],
        };
    }
    const col = index % colCount;
    const row = Math.floor(index / colCount);
    cells[index++] = {
        row,
        col,
        content: bcrow,
    };
    for (let i = 0; i < right.length; i++) {
        const col = index % colCount;
        const row = Math.floor(index / colCount);
        cells[index++] = {
            row,
            col,
            content: right[i],
        };
    }

    return cells;
};

const getCrumbFromCells = (
    cells: Cell[],
    focus: ZTable,
    orientation: "row" | "col",
): Breadcrumb => {
    const orderedContent: (types.Row | BreadcrumbRow | null)[] = [];
    for (const cell of cells) {
        const {row, col, content} = cell;
        const index =
            orientation === "row"
                ? row * focus.colCount + col
                : row * (focus.colCount + 1) + col;
        orderedContent[index] = content;
    }

    const indexOfBreadcrumbRow = orderedContent.findIndex(
        (item) => item?.type === "bcrow",
    );

    if (indexOfBreadcrumbRow === -1) {
        throw new Error("Breadcrumb row is missing");
    }

    const newLeft = orderedContent.slice(
        0,
        indexOfBreadcrumbRow,
    ) as (types.Row | null)[];
    const newRow = orderedContent[indexOfBreadcrumbRow] as BreadcrumbRow;
    const newRight = orderedContent.slice(
        indexOfBreadcrumbRow + 1,
    ) as (types.Row | null)[];

    if (orientation === "row") {
        return {
            row: newRow,
            focus: {
                ...focus,
                rowCount: focus.rowCount + 1,
                left: newLeft,
                right: newRight,
            },
        };
    } else {
        return {
            row: newRow,
            focus: {
                ...focus,
                colCount: focus.colCount + 1,
                left: newLeft,
                right: newRight,
            },
        };
    }
};

export const matrix = (state: State, action: MatrixActions): State => {
    // TODO: add a helpers to insert any node type that handles selections and
    // cursor position
    if (action.type === "InsertMatrix") {
        const zipper = state.zipper;
        const {left, selection} = zipper.row;
        const newNode = builders.table(2, 2, [
            [builders.glyph("1")],
            [builders.glyph("0")],
            [builders.glyph("0")],
            [builders.glyph("1")],
        ]);

        if (selection.length > 0) {
            const newLeft = [...left, newNode];

            const newZipper: Zipper = {
                ...zipper,
                row: {
                    ...zipper.row,
                    selection: [],
                    left: newLeft,
                },
            };
            return {
                startZipper: newZipper,
                endZipper: newZipper,
                zipper: newZipper,
                selecting: false,
            };
        }

        const newZipper: Zipper = {
            ...zipper,
            row: {
                ...zipper.row,
                left: [...left, newNode],
            },
        };
        return {
            startZipper: newZipper,
            endZipper: newZipper,
            zipper: newZipper,
            selecting: false,
        };
    }

    if (action.type === "AddRow") {
        const {breadcrumbs} = state.zipper;
        const crumb = breadcrumbs[breadcrumbs.length - 1];
        if (crumb?.focus.type === "ztable") {
            const {colCount, left} = crumb.focus;

            const cells = getCellsFromCrumb(crumb.focus, crumb.row);

            const cursorIndex = left.length;
            const cursorRow = Math.floor(cursorIndex / colCount);

            if (action.side === "above") {
                for (const cell of cells) {
                    if (cell.row >= cursorRow) {
                        cell.row++;
                    }
                }
                for (let col = 0; col < colCount; col++) {
                    cells.push({
                        row: cursorRow,
                        col: col,
                        content: builders.row([builders.glyph("0")]),
                    });
                }
            } else if (action.side === "below") {
                for (const cell of cells) {
                    if (cell.row > cursorRow) {
                        cell.row++;
                    }
                }
                for (let col = 0; col < colCount; col++) {
                    cells.push({
                        row: cursorRow + 1,
                        col: col,
                        content: builders.row([builders.glyph("0")]),
                    });
                }
            }

            const newCrumb = getCrumbFromCells(cells, crumb.focus, "row");
            const restCrumbs = breadcrumbs.slice(0, -1);

            const {zipper} = state;
            const newZipper: Zipper = {
                ...zipper,
                breadcrumbs: [...restCrumbs, newCrumb],
            };
            return {
                startZipper: newZipper,
                endZipper: newZipper,
                zipper: newZipper,
                selecting: false,
            };
        }
    }

    if (action.type === "AddColumn") {
        const {breadcrumbs} = state.zipper;
        const crumb = breadcrumbs[breadcrumbs.length - 1];
        if (crumb?.focus.type === "ztable") {
            const {colCount, rowCount, left} = crumb.focus;

            const cells = getCellsFromCrumb(crumb.focus, crumb.row);

            const cursorIndex = left.length;
            const cursorCol = cursorIndex % colCount;

            if (action.side === "left") {
                for (const cell of cells) {
                    if (cell.col >= cursorCol) {
                        cell.col++;
                    }
                }
                for (let row = 0; row < rowCount; row++) {
                    cells.push({
                        col: cursorCol,
                        row: row,
                        content: builders.row([builders.glyph("0")]),
                    });
                }
            } else if (action.side === "right") {
                for (const cell of cells) {
                    if (cell.col > cursorCol) {
                        cell.col++;
                    }
                }
                for (let row = 0; row < rowCount; row++) {
                    cells.push({
                        col: cursorCol + 1,
                        row: row,
                        content: builders.row([builders.glyph("0")]),
                    });
                }
            }

            const newCrumb = getCrumbFromCells(cells, crumb.focus, "col");
            const restCrumbs = breadcrumbs.slice(0, -1);

            const {zipper} = state;
            const newZipper: Zipper = {
                ...zipper,
                breadcrumbs: [...restCrumbs, newCrumb],
            };
            return {
                startZipper: newZipper,
                endZipper: newZipper,
                zipper: newZipper,
                selecting: false,
            };
        }
    }

    // TODO: handle deleting the current row/column

    return state;
};
