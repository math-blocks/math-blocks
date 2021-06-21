import {getId} from "@math-blocks/core";
import type {State, ZTable, Zipper} from "./types";

import * as types from "../ast/types";
import * as builders from "../ast/builders";
import * as util from "./util";

export const verticalWork = (state: State): State => {
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

            return util.zipperToState(newZipper);
        }

        return state;
    }

    if (breadcrumbs.length > 0) {
        return state;
    }

    // TODO: figure out which cell the cursor should be in after splitting up
    // the row.
    const row = util.zrowToRow(zipper.row);
    const splitRows: (types.Row | null)[] = [];
    let prevChildren: types.Node[] = [];
    let prevChild: types.Node | null = null;
    // Invariants:
    // - child is either directly to splitRows in its own cell or it's added to
    //   prevChildren
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
                // Place an extra cell in front of the '+'
                splitRows.push(builders.row([]));
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
            // Place extra cells around the '='
            splitRows.push(builders.row([]));
            splitRows.push(builders.row([child]));
            splitRows.push(builders.row([]));
        } else {
            prevChildren.push(child);
        }
        prevChild = child;
    }
    if (prevChildren.length > 0) {
        splitRows.push(builders.row(prevChildren));
    }

    const left = [builders.row([]), ...splitRows, builders.row([])];
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
    right.push(builders.row([])); // last cell in second table row

    const table: ZTable = {
        id: getId(),
        type: "ztable",
        subtype: "algebra",
        rowCount: 2,
        colCount: splitRows.length + 2,
        left,
        right,
        style: {},
        gutterWidth: 0,
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

    return util.zipperToState(newZipper);
};
