import {getId} from "@math-blocks/core";

import * as types from "../ast/types";
import * as builders from "../ast/builders";
import {isAtom} from "../ast/util";

import * as util from "./util";
import {
    zipperToVerticalWork,
    verticalWorkToZTable,
    adjustEmptyColumns,
    isColumnEmpty,
    isCellEmpty,
} from "./vertical-work-utils";
import {moveRight} from "./move-right";

import type {State, ZTable, Zipper, Focus} from "./types";
import type {Action} from "./action-types";
import type {VerticalWork, Column} from "./vertical-work-utils";

// TODO: place cursor in lower limits
// TODO: dedupe this with insert-char.ts
const LIMIT_CHARS = [
    "\u03a3", // \sum
    "\u03a0", // \prod
    "\u222B", // \int
    // TODO: handle \lim (need to make sure we exclude the upper limit)
];

const removeEmptyColumns = (zipper: Zipper): Zipper => {
    const work = zipperToVerticalWork(zipper);
    if (!work) {
        return zipper;
    }
    const adjustedWork = adjustEmptyColumns(work);
    return verticalWorkToZTable(adjustedWork);
};

const isCellPlusMinus = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 && isAtom(cell.children[0], ["+", "\u2212"]);

const isCellRelationOperator = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 && isAtom(cell.children[0], ["=", ">", "<"]);

const moveDown = (state: State): State => {
    // Does it make sense if the root is not a Row?  Is this how we could prevent
    // users from exiting the table?

    const {zipper} = state;
    const {breadcrumbs} = zipper;

    if (
        breadcrumbs.length === 1 &&
        breadcrumbs[0].focus.type === "ztable" &&
        breadcrumbs[0].focus.subtype === "algebra"
    ) {
        const {focus} = breadcrumbs[0];

        const cellIndex = focus.left.length;
        const row = Math.floor(cellIndex / focus.colCount);

        // If we're in the bottom row of a two-row table, and the user presses
        // down, add a third row.
        if (focus.rowCount === 2 && row === 1) {
            const nodes = [
                ...focus.left,
                util.zrowToRow(zipper.row),
                ...focus.right,
            ];
            for (let i = 0; i < focus.colCount; i++) {
                nodes.push(builders.row([]));
            }

            const left = nodes.slice(0, cellIndex + focus.colCount);
            const right = nodes.slice(cellIndex + focus.colCount + 1);

            const table: ZTable = {
                ...focus,
                rowCount: 3,
                left,
                right,
                rowStyles: [null, null, {border: "top"}],
            };

            const newZipper: Zipper = {
                row: util.zrow(getId(), [], []),
                breadcrumbs: [
                    {
                        ...breadcrumbs[0],
                        focus: table,
                    },
                ],
            };

            // TODO: update vertical work helpers to main the row style
            return util.zipperToState(removeEmptyColumns(newZipper));
        }

        if (row < focus.rowCount - 1) {
            const work = zipperToVerticalWork(zipper);
            if (!work) {
                return state;
            }
            const col = work.columns.find((col) =>
                col.some((cell) => cell.id === work.cursorId),
            );
            if (!col) {
                throw new Error(
                    "Couldn't find the column containing the cursor",
                );
            }
            const newCell = col[row + 1];
            const adjustedWork = adjustEmptyColumns({
                ...work,
                cursorId: newCell.id,
            });
            const newZipper: Zipper = verticalWorkToZTable(adjustedWork);
            return util.zipperToState(newZipper);
        }

        return state;
    }

    if (breadcrumbs.length > 0) {
        return state;
    }

    // TODO: figure out which cell the cursor should be in after splitting up
    // the row.
    // TODO: move this into a separate function an unit test it
    const row = util.zrowToRow(zipper.row);
    const splitRows: (types.Row | null)[] = [];
    let prevChildren: types.Node[] = [];
    let prevChild: types.Node | null = null;
    // Invariants:
    // - child is either directly to splitRows in its own cell (in the case of
    //   plus/minus operators) or it's added to prevChildren.
    for (const child of row.children) {
        if (
            child.type === "atom" &&
            ["+", "\u2212"].includes(child.value.char)
        ) {
            if (
                prevChild?.type !== "atom" ||
                !["+", "\u2212"].includes(prevChild.value.char)
            ) {
                if (prevChildren.length > 0) {
                    splitRows.push(builders.row(prevChildren));
                    prevChildren = [];
                }
                splitRows.push(builders.row([child]));
            } else {
                prevChildren.push(child);
            }
        } else if (
            child.type === "atom" &&
            ["=", ">", "<"].includes(child.value.char)
        ) {
            if (prevChildren.length > 0) {
                splitRows.push(builders.row(prevChildren));
                prevChildren = [];
            }
            splitRows.push(builders.row([child]));
        } else {
            prevChildren.push(child);
        }
        prevChild = child;
    }
    if (prevChildren.length > 0) {
        splitRows.push(builders.row(prevChildren));
    }

    const left = [...splitRows];
    // left.push(builders.row([])); // first cell in second table row
    const right: (types.Row | null)[] = [];
    // empty cells below first table row's splitRows
    for (let i = 0; i < splitRows.length; i++) {
        if (splitRows[i] == null) {
            right.push(null);
        } else {
            right.push(builders.row([]));
        }
    }

    const table: ZTable = {
        id: getId(),
        type: "ztable",
        subtype: "algebra",
        rowCount: 2,
        colCount: splitRows.length,
        left,
        right,
        style: {},
    };

    const newZipper: Zipper = {
        row: util.zrow(getId(), [], []),
        breadcrumbs: [
            {
                row: {
                    id: getId(),
                    type: "bcrow",
                    left: [],
                    right: [],
                    style: {},
                },
                focus: table,
            },
        ],
    };

    const finalZipper = removeEmptyColumns(newZipper);
    return util.zipperToState(finalZipper);
};

const moveUp = (state: State): State => {
    const {zipper} = state;
    const {breadcrumbs} = zipper;

    if (
        breadcrumbs.length === 1 &&
        breadcrumbs[0].focus.type === "ztable" &&
        breadcrumbs[0].focus.subtype === "algebra"
    ) {
        const {focus} = breadcrumbs[0];
        const cellIndex = focus.left.length;
        const cursorRow = Math.floor(cellIndex / focus.colCount);

        const cells = [
            ...focus.left,
            util.zrowToRow(state.zipper.row),
            ...focus.right,
        ];

        if (focus.rowCount === 3 && cursorRow === 2) {
            const rowCells = cells.filter((cell, index) => {
                const row = Math.floor(index / focus.colCount);
                return row === cursorRow;
            });
            const isEmpty = rowCells.every(
                (cell) => !cell || cell.children.length === 0,
            );
            if (isEmpty) {
                const newCells = cells.slice(0, 2 * focus.colCount);
                const newCursorIndex = cellIndex - focus.colCount;

                const table: ZTable = {
                    ...focus,
                    rowCount: 2,
                    left: newCells.slice(0, newCursorIndex),
                    right: newCells.slice(newCursorIndex + 1),
                    rowStyles: [null, null],
                };

                // TODO: we probably want to have two table variants: one where
                // all cells are navigable to and one where some cells can't be
                // navigated to.
                const newCursorCell = cells[newCursorIndex];

                const newZipper: Zipper = {
                    row: util.zrow(
                        newCursorCell?.id ?? getId(),
                        [],
                        newCursorCell?.children ?? [],
                    ),
                    breadcrumbs: [
                        {
                            ...breadcrumbs[0],
                            focus: table,
                        },
                    ],
                };

                return util.zipperToState(removeEmptyColumns(newZipper));
            }
        }

        if (focus.rowCount === 2 && cursorRow === 1) {
            const rowCells = cells.filter((cell, index) => {
                const row = Math.floor(index / focus.colCount);
                return row === cursorRow;
            });
            const isEmpty = rowCells.every(
                (cell) => !cell || cell.children.length === 0,
            );
            if (isEmpty) {
                // Merge all cells into a single row
                const newCells = cells.slice(0, focus.colCount);
                const nodes = newCells.flatMap((cell) => cell?.children ?? []);

                const newZipper: Zipper = {
                    // TODO: determine where to place the cursor
                    row: util.zrow(getId(), [], nodes),
                    breadcrumbs: [],
                };

                return util.zipperToState(removeEmptyColumns(newZipper));
            }
        }

        if (cursorRow > 0) {
            const work = zipperToVerticalWork(zipper);
            if (!work) {
                return state;
            }
            const col = work.columns.find((col) =>
                col.some((cell) => cell.id === work.cursorId),
            );
            if (!col) {
                throw new Error(
                    "Couldn't find the column containing the cursor",
                );
            }
            const newCell = col[cursorRow - 1];
            const adjustedWork = adjustEmptyColumns({
                ...work,
                cursorId: newCell.id,
            });
            const newZipper: Zipper = verticalWorkToZTable(adjustedWork);
            return util.zipperToState(newZipper);
        }
    }

    return state;
};

const insertChar = (state: State, char: string): State => {
    const zipper = state.zipper;

    // TODO: handle selection

    const work = zipperToVerticalWork(zipper);
    if (!work) {
        return state;
    }

    const {cursorId, columns, rowCount, crumb, rowStyles} = work;

    const cursorCol = columns.find((col) =>
        col.some((cell) => cell.id === cursorId),
    );
    if (!cursorCol) {
        throw new Error(
            "Couldn't find column with a cell.id matching cursorId",
        );
    }
    const cursorCell = cursorCol.find((cell) => cell.id === cursorId);
    const otherCells = cursorCol.filter((cell) => cell.id !== cursorId);
    if (!cursorCell) {
        throw new Error("Couldn't find a cell with id matching cursorId");
    }

    let newNode;
    if (LIMIT_CHARS.includes(char)) {
        newNode = builders.limits(builders.glyph(char), [], []);
    } else {
        newNode = builders.glyph(char);
    }

    if (isColumnEmpty(cursorCol)) {
        if (["+", "\u2212"].includes(char)) {
            const cursorColIndex = columns.findIndex(
                (col) => col === cursorCol,
            );
            const cursorRow = cursorCol.findIndex(
                (cell) => cell.id === cursorCell.id,
            );
            const newEmptyCol: types.Row[] = [];
            for (let i = 0; i < rowCount; i++) {
                newEmptyCol.push(builders.row([]));
            }
            const newPlusMinusCol: Column = [
                ...cursorCol.slice(0, cursorRow),
                builders.row([newNode]),
                ...cursorCol.slice(cursorRow + 1),
            ];
            const newCursorCol: types.Row[] = [];
            for (let i = 0; i < rowCount; i++) {
                newCursorCol.push(builders.row([]));
            }
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
                cursorId: newCursorCol[cursorRow].id,
                crumb: crumb,
                rowStyles: rowStyles,
            };
            const newZipper = verticalWorkToZTable(adjustEmptyColumns(newWork));
            return util.zipperToState(newZipper);
        }
    }

    if (!isCellEmpty(cursorCell) && zipper.row.right.length === 0) {
        if (["+", "\u2212"].includes(char)) {
            const cursorColIndex = columns.findIndex(
                (col) => col === cursorCol,
            );
            const cursorRow = cursorCol.findIndex(
                (cell) => cell.id === cursorCell.id,
            );
            const newPlusMinusCol: types.Row[] = [];
            for (let i = 0; i < rowCount; i++) {
                if (i === cursorRow) {
                    newPlusMinusCol.push(builders.row([newNode]));
                } else {
                    newPlusMinusCol.push(builders.row([]));
                }
            }
            const newCursorCol: types.Row[] = [];
            for (let i = 0; i < rowCount; i++) {
                newCursorCol.push(builders.row([]));
            }
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
                cursorId: newCursorCol[cursorRow].id,
                crumb: crumb,
                rowStyles: rowStyles,
            };
            const newZipper = verticalWorkToZTable(adjustEmptyColumns(newWork));
            return util.zipperToState(newZipper);
        }
    }

    // TODO: handle adding an operator in the middle of a cell, e.g.
    // 23 -> 2 + 3
    // TODO: handle deleting an operator and combing cells, if it makes sense
    // we can probably emove the comining part to adjustEmptyColumns and rename
    // it to be adjust columns, e.g.
    // | | | -> |  |
    // |2|3| -> |23|

    // If there's a +/- in one of the other cells in the current column...
    if (cursorCell.children.length === 0 && otherCells.some(isCellPlusMinus)) {
        // ...and the char being inserted is a +/-...
        if (["+", "\u2212"].includes(char)) {
            // ...insert the char...
            const newZipper: Zipper = {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [newNode], // safe b/c the cell was empty
                },
            };
            // ...and then move right...
            return moveRight(util.zipperToState(newZipper));
        } else {
            // ...otherwise, move to the right first...
            const newState = moveRight({
                ...state,
                selecting: false,
            });
            const zipper = newState.zipper;
            // ...and then insert the character
            const newZipper: Zipper = {
                ...zipper,
                row: {
                    ...zipper.row,
                    // safe b/c we moved to the start of next cell
                    left: [newNode],
                },
            };
            return util.zipperToState(newZipper);
        }
    }
    // If there's a relationship operator in one of the other cells in
    // the current column...
    else if (
        cursorCell.children.length === 0 &&
        otherCells.some(isCellRelationOperator)
    ) {
        // ...and the current char being inserted is also a relationship
        // operator...
        if (["=", ">", "<"].includes(char)) {
            const newZipper: Zipper = {
                // ...insert the char...
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [newNode], // safe b/c the cell was empty
                },
            };
            // ...and then move right...
            return moveRight(util.zipperToState(newZipper));
        } else {
            // ...otherwise, move to the right first...
            const newState = moveRight({
                ...state,
                selecting: false,
            });
            const zipper = newState.zipper;
            // ...and then insert the character
            const newZipper: Zipper = {
                ...zipper,
                row: {
                    ...zipper.row,
                    // safe b/c we moved to the start of the next cell
                    left: [newNode],
                },
            };
            return util.zipperToState(newZipper);
        }
    }

    return state;
};

export const verticalWork = (state: State, action: Action): State => {
    switch (action.type) {
        case "ArrowUp":
            return moveUp(state);
        case "ArrowDown":
            return moveDown(state);
        case "InsertChar":
            return insertChar(state, action.char);
        default:
            return state;
    }
};

export const isCellSkippable = (cell: types.Row | null): boolean =>
    cell?.children.length === 1 &&
    isAtom(cell.children[0], ["+", "\u2212", "=", "<", ">"]);

const isEmpty = (cell: types.Row | null): boolean =>
    (cell?.children?.length ?? 0) === 0;

export const getAllowed = (zipper: Zipper, focus: Focus): boolean[] => {
    const children = [
        ...focus.left,
        util.zrowToRow(zipper.row),
        ...focus.right,
    ];

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
