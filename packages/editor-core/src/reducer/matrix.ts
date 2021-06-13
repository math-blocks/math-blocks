import * as builders from "../ast/builders";
import * as types from "../ast/types";

import type {State, Zipper, Breadcrumb, ZTable, ZRow} from "./types";

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
    content: types.Row | ZRow | null;
};

// TODO: make the Breadcrumb type generic
const getCellsFromCrumb = (
    crumb: Breadcrumb<ZTable>,
    zipper: Zipper,
): Cell[] => {
    const cells: Cell[] = [];
    const {colCount, left, right} = crumb.focus;

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
        content: zipper.row,
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
    crumb: Breadcrumb<ZTable>,
    orientation: "row" | "col",
): Breadcrumb => {
    const orderedContent: (types.Row | ZRow | null)[] = [];
    for (const cell of cells) {
        const {row, col, content} = cell;
        const index =
            orientation === "row"
                ? row * crumb.focus.colCount + col
                : row * (crumb.focus.colCount + 1) + col;
        orderedContent[index] = content;
    }

    const indexOfZRow = orderedContent.findIndex(
        (item) => item?.type === "zrow",
    );

    if (indexOfZRow === -1) {
        throw new Error("ZRow cell is missing");
    }

    const newLeft = orderedContent.slice(
        0,
        indexOfZRow,
    ) as (types.Row | null)[];
    const newRight = orderedContent.slice(
        indexOfZRow + 1,
    ) as (types.Row | null)[];

    if (orientation === "row") {
        return {
            ...crumb,
            focus: {
                ...crumb.focus,
                rowCount: crumb.focus.rowCount + 1,
                left: newLeft,
                right: newRight,
            },
        };
    } else {
        return {
            ...crumb,
            focus: {
                ...crumb.focus,
                colCount: crumb.focus.colCount + 1,
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

            const cells = getCellsFromCrumb(
                crumb as Breadcrumb<ZTable>,
                state.zipper,
            );

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

            const newCrumb = getCrumbFromCells(
                cells,
                crumb as Breadcrumb<ZTable>,
                "row",
            );
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

            const cells = getCellsFromCrumb(
                crumb as Breadcrumb<ZTable>,
                state.zipper,
            );

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

            const newCrumb = getCrumbFromCells(
                cells,
                crumb as Breadcrumb<ZTable>,
                "col",
            );
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

    if (action.type === "DeleteRow") {
        const {breadcrumbs} = state.zipper;
        const crumb = breadcrumbs[breadcrumbs.length - 1];
        if (crumb?.focus.type === "ztable") {
            const {colCount, rowCount, left} = crumb.focus;

            const cursorIndex = left.length;
            const cursorRow = Math.floor(cursorIndex / colCount);

            const cells = getCellsFromCrumb(
                crumb as Breadcrumb<ZTable>,
                state.zipper,
            )
                // remove all cells in the current row
                .filter((cell) => cell.row !== cursorRow);

            for (const cell of cells) {
                if (cell.row > cursorRow) {
                    cell.row--;
                }
            }

            if (cells.length === 0) {
                const restCrumbs = breadcrumbs.slice(0, -1);
                const newZipper: Zipper = {
                    row: {
                        ...crumb.row,
                        type: "zrow",
                        selection: [],
                    },
                    breadcrumbs: restCrumbs,
                };
                return {
                    startZipper: newZipper,
                    endZipper: newZipper,
                    zipper: newZipper,
                    selecting: false,
                };
            }

            const indexOfZRow =
                cursorRow < rowCount - 1 ? cursorIndex : cursorIndex - colCount;

            const orderedContent: (types.Row | ZRow | null)[] = [];
            for (const cell of cells) {
                const {row, col, content} = cell;
                const index = row * crumb.focus.colCount + col;
                orderedContent[index] = content;
            }

            const row = orderedContent[indexOfZRow];
            if (row?.type === "row") {
                orderedContent[indexOfZRow] = {
                    id: row.id,
                    type: "zrow",
                    left: [],
                    selection: [],
                    right: row.children,
                    style: row.style,
                };
            } else {
                throw new Error(
                    `No ordereredContent item with index ${indexOfZRow}`,
                );
            }

            const newLeft = orderedContent.slice(
                0,
                indexOfZRow,
            ) as (types.Row | null)[];
            const newRight = orderedContent.slice(
                indexOfZRow + 1,
            ) as (types.Row | null)[];

            const newCrumb: Breadcrumb = {
                ...crumb,
                focus: {
                    ...crumb.focus,
                    rowCount: rowCount - 1,
                    left: newLeft,
                    right: newRight,
                },
            };
            const restCrumbs = breadcrumbs.slice(0, -1);

            const {zipper} = state;
            const newZipper: Zipper = {
                ...zipper,
                row: orderedContent[indexOfZRow] as ZRow,
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

    if (action.type === "DeleteColumn") {
        const {breadcrumbs} = state.zipper;
        const crumb = breadcrumbs[breadcrumbs.length - 1];
        if (crumb?.focus.type === "ztable") {
            const {colCount, left} = crumb.focus;

            const cursorIndex = left.length;
            const cursorCol = cursorIndex % colCount;

            const cells = getCellsFromCrumb(
                crumb as Breadcrumb<ZTable>,
                state.zipper,
            )
                // remove all cells in the current column
                .filter((cell) => cell.col !== cursorCol);

            for (const cell of cells) {
                if (cell.col > cursorCol) {
                    cell.col--;
                }
            }

            if (cells.length === 0) {
                const restCrumbs = breadcrumbs.slice(0, -1);
                const newZipper: Zipper = {
                    row: {
                        ...crumb.row,
                        type: "zrow",
                        selection: [],
                    },
                    breadcrumbs: restCrumbs,
                };
                return {
                    startZipper: newZipper,
                    endZipper: newZipper,
                    zipper: newZipper,
                    selecting: false,
                };
            }

            const newColCount = colCount - 1;
            const orderedContent: (types.Row | ZRow | null)[] = [];
            for (const cell of cells) {
                const {row, col, content} = cell;
                const index = row * newColCount + col;
                orderedContent[index] = content;
            }

            // Determine the new location of the cursor after removing a column.
            const cursorRow = Math.floor(cursorIndex / colCount);
            const indexOfZRow =
                cursorRow * newColCount + Math.min(cursorCol, newColCount - 1);

            const row = orderedContent[indexOfZRow];
            if (row?.type === "row") {
                orderedContent[indexOfZRow] = {
                    id: row.id,
                    type: "zrow",
                    left: [],
                    selection: [],
                    right: row.children,
                    style: row.style,
                };
            } else {
                throw new Error(
                    `No ordereredContent item with index ${indexOfZRow}`,
                );
            }

            const newLeft = orderedContent.slice(
                0,
                indexOfZRow,
            ) as (types.Row | null)[];
            const newRight = orderedContent.slice(
                indexOfZRow + 1,
            ) as (types.Row | null)[];

            const newCrumb: Breadcrumb = {
                ...crumb,
                focus: {
                    ...crumb.focus,
                    colCount: colCount - 1,
                    left: newLeft,
                    right: newRight,
                },
            };
            const restCrumbs = breadcrumbs.slice(0, -1);

            const {zipper} = state;
            const newZipper: Zipper = {
                ...zipper,
                row: orderedContent[indexOfZRow] as ZRow,
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

    return state;
};
