import {UnreachableCaseError} from "@math-blocks/core";

import * as types from "../types";

import {Dir} from "./enums";
import type {Breadcrumb, Focus, Zipper, ZRow, ZRowWithSelection} from "./types";
import * as util from "./util";
import {crumbMoveRight, startSelection, stopSelection} from "./selection-util";
import {replaceItem} from "./array-util";

const cursorRight = (zipper: Zipper): Zipper => {
    zipper = util.rezipSelection(zipper);
    const {left, selection, right} = zipper.row;

    // Exit the selection to the right
    if (selection) {
        return {
            ...zipper,
            row: {
                ...zipper.row,
                left: [...left, ...selection.nodes],
                selection: null,
            },
        };
    }

    // Move the cursor right within the current row.
    if (right.length > 0) {
        const next = right[0]; // right.head

        // move right
        if (next.type === "atom") {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left, next],
                    right: right.slice(1),
                },
            };
        }

        // Rows should only be used as children of non-rows
        // move into row to the right
        else if (next.type !== "row") {
            const [leftChild, rightChild] = next.children;

            let focus: Focus;
            switch (next.type) {
                case "frac": {
                    focus = util.zfrac(next, Dir.Left);
                    break;
                }
                case "subsup": {
                    const dir = next.children[0] ? Dir.Left : Dir.Right;
                    focus = util.zsubsup(next, dir);
                    break;
                }
                case "root": {
                    const dir = next.children[0] ? Dir.Left : Dir.Right;
                    focus = util.zroot(next, dir);
                    break;
                }
                case "limits":
                    focus = util.zlimits(next, Dir.Left);
                    break;
                default:
                    throw new UnreachableCaseError(next);
            }

            const breadcrumb: Breadcrumb = {
                row: util.delRight(zipper.row),
                focus: focus,
            };

            const focusedRow = leftChild || rightChild;
            if (!focusedRow) {
                throw new Error("subsup without subscript or superscript");
            }

            return {
                breadcrumbs: [...zipper.breadcrumbs, breadcrumb],
                row: util.startRow(focusedRow), // [] [1, 2, ...]
            };
        }

        // fallback behavior
        return zipper;
    }

    // Move out of the current row.
    if (zipper.breadcrumbs.length > 0) {
        const {focus, row: parentRow} = zipper.breadcrumbs[
            zipper.breadcrumbs.length - 1
        ];

        const exitedRow: types.Row = util.zrowToRow(zipper.row);

        const focusRight = (row: types.Row): Zipper => ({
            breadcrumbs: [
                ...zipper.breadcrumbs.slice(0, -1),
                {
                    row: parentRow,
                    focus: {
                        ...focus,
                        dir: Dir.Right,
                        other: exitedRow,
                    },
                },
            ],
            row: util.startRow(row),
        });

        const exitNode = (updatedNode: types.Node): Zipper => ({
            breadcrumbs: zipper.breadcrumbs.slice(0, -1),
            // place the subsup we exited on our left
            row: util.insertLeft(parentRow, updatedNode),
        });

        switch (focus.type) {
            case "zsubsup":
                return focus.dir === Dir.Left && focus.other
                    ? focusRight(focus.other)
                    : exitNode(util.subsup(focus, exitedRow));
            case "zfrac":
                return focus.dir === Dir.Left
                    ? focusRight(focus.other)
                    : exitNode(util.frac(focus, exitedRow));
            case "zroot":
                return focus.dir === Dir.Left
                    ? focusRight(focus.other)
                    : exitNode(util.root(focus, exitedRow));
            case "zlimits":
                return focus.dir === Dir.Left && focus.other
                    ? focusRight(focus.other)
                    : exitNode(util.limits(focus, exitedRow));
            default:
                throw new UnreachableCaseError(focus);
        }
    }

    return zipper;
};

function hasSelection(row: ZRow): row is ZRowWithSelection {
    return row.selection !== null;
}

const selectionRight = (zipper: Zipper): Zipper => {
    // INVARIANT: selections in crumbs can only exist from last crumb (top) back
    // to the first crumb (bottom), there can be no gaps either

    // Cases to handle:
    // - start a selection
    // - expand a selection (possibly moving out to a yet to be selected focus)
    // - contract a selection (possible moving in to an already selected focus)

    const rowsWithSelections: ZRowWithSelection[] = zipper.breadcrumbs
        .map((crumb) => crumb.row)
        .filter(hasSelection);
    if (zipper.row.selection) {
        rowsWithSelections.push(zipper.row);
    }

    if (rowsWithSelections.length === 0) {
        const {row} = zipper;

        // We haven't started selecting anything yet.
        if (row.right.length > 0) {
            // Create a new selection to the left and move left.
            return crumbMoveRight(startSelection(zipper, Dir.Right));
        } else {
            // Create an empty selection and them move outward.
            const index = zipper.breadcrumbs.length - 1;
            const crumb = zipper.breadcrumbs[index];
            const updatedCrumb = startSelection(crumb, Dir.Right);

            return {
                ...startSelection(zipper, Dir.Right),
                breadcrumbs: replaceItem(
                    zipper.breadcrumbs,
                    updatedCrumb,
                    index,
                ),
            };
        }
    } else if (rowsWithSelections.length === 1) {
        // Our selection is in the current row (top of zipper).

        const row = rowsWithSelections[0]; // same as zipper.row

        if (row.selection.dir === Dir.Right) {
            if (zipper.row.right.length > 0) {
                return crumbMoveRight(zipper);
            } else {
                const index = zipper.breadcrumbs.length - 1;
                const crumb = zipper.breadcrumbs[index];
                const updatedCrumb = startSelection(crumb, Dir.Right);

                // Move out to start a selection in the parent crumb.
                return {
                    ...zipper,
                    breadcrumbs: replaceItem(
                        zipper.breadcrumbs,
                        updatedCrumb,
                        index,
                    ),
                };
            }
        } else {
            if (row.selection.nodes.length > 0) {
                const result = crumbMoveRight(zipper);
                if (result.row.selection?.nodes.length === 0) {
                    // we're back at original cursor position, stop selecting
                    return stopSelection(result);
                } else {
                    return result;
                }
            } else {
                // This should never happen since we drop the selection if the
                // number of nodes reaches 0.
                // we're back at original cursor position, stop selecting
                // This might happen if we started our selection at the edge
                return stopSelection(zipper);
            }
        }
    } else {
        // Our selection is in the one of the breadcrumb rows.

        let index = zipper.breadcrumbs.length - rowsWithSelections.length + 1;
        const crumb = zipper.breadcrumbs[index];
        const row = rowsWithSelections[0]; // same as crumb.row

        if (row.selection.dir === Dir.Right) {
            if (row.right.length > 0) {
                const updatedCrumb = crumbMoveRight(crumb);
                return {
                    ...zipper,
                    breadcrumbs: replaceItem(
                        zipper.breadcrumbs,
                        updatedCrumb,
                        index,
                    ),
                };
            } else {
                // Move out to start a selection in the parent crumb.
                index = index - 1;

                // We've reached the start of the bottom crumb so there's
                // nowhere to go.
                if (index < 0) {
                    return zipper;
                }

                const crumb = zipper.breadcrumbs[index];
                const updatedCrumb = startSelection(crumb, Dir.Right);
                return {
                    ...zipper,
                    breadcrumbs: replaceItem(
                        zipper.breadcrumbs,
                        updatedCrumb,
                        index,
                    ),
                };
            }
        } else {
            if (row.selection.nodes.length > 0) {
                const updatedCrumb = crumbMoveRight(crumb);
                return {
                    ...zipper,
                    breadcrumbs: replaceItem(
                        zipper.breadcrumbs,
                        updatedCrumb,
                        index,
                    ),
                };
            } else {
                const updatedCrumb = stopSelection(crumb);
                const result: Zipper = {
                    ...zipper,
                    breadcrumbs: replaceItem(
                        zipper.breadcrumbs,
                        updatedCrumb,
                        index,
                    ),
                };

                // If there are no selections in any of the breadcrumbs and the
                // selection in the result.row is empty then clear the selection
                // there as well.
                if (
                    result.row.selection?.nodes.length === 0 &&
                    result.breadcrumbs.every(
                        (crumb) => crumb.row.selection === null,
                    )
                ) {
                    return stopSelection(result);
                }

                return result;
            }
        }
    }
};

export const moveRight = (zipper: Zipper, selecting?: boolean): Zipper => {
    return selecting ? selectionRight(zipper) : cursorRight(zipper);
};
