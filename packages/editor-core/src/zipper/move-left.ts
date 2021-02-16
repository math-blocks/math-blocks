import {UnreachableCaseError} from "@math-blocks/core";

import * as types from "../types";

import {Dir} from "./enums";
import type {Breadcrumb, Focus, Zipper, ZRow, ZRowWithSelection} from "./types";
import * as util from "./util";
import {crumbMoveLeft, startSelection, stopSelection} from "./selection-util";
import {replaceItem, splitArrayAt} from "./array-util";

const cursorLeft = (zipper: Zipper): Zipper => {
    const {left, selection, right} = zipper.row;

    // Exit the selection to the left
    if (selection) {
        const index = zipper.breadcrumbs.findIndex(
            (crumb) => crumb.row.selection !== null,
        );

        // The selection is completely within the `zipper.row`.
        if (index === -1) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    selection: null,
                    right: [...selection.nodes, ...right],
                },
            };
        }

        // The selection is in one of the breadcrumbs.
        const [restCrumbs, topCrumbs] = splitArrayAt(zipper.breadcrumbs, index);
        // We need to process these from top to bottom (reverse order)
        topCrumbs.reverse();

        // Collapse each crumb in `topCrumbs` into `row`.
        const row = topCrumbs.reduce((row, crumb): ZRow => {
            const unfocusedNode = util.focusToNode(
                crumb.focus,
                util.zrowToRow(row),
            );
            const selectionNodes =
                selection.dir === Dir.Right
                    ? [unfocusedNode, ...(crumb.row.selection?.nodes || [])]
                    : [...(crumb.row.selection?.nodes || []), unfocusedNode];
            return {
                ...crumb.row,
                selection: null,
                right: [...selectionNodes, ...crumb.row.right],
            };
        }, zipper.row);

        return {
            ...zipper,
            row: row,
            breadcrumbs: restCrumbs,
        };
    }

    // Move the cursor left within the current row.
    if (left.length > 0) {
        const prev = left[left.length - 1];

        // move left
        if (prev.type === "atom") {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: left.slice(0, -1),
                    right: [prev, ...right],
                },
            };
        }

        // Rows should only be used as children of non-rows
        // move into node to the left
        else if (prev.type !== "row") {
            const [leftChild, rightChild] = prev.children;

            let focus: Focus;
            switch (prev.type) {
                case "frac": {
                    focus = util.zfrac(prev, Dir.Right);
                    break;
                }
                case "subsup": {
                    const dir = prev.children[1] ? Dir.Right : Dir.Left;
                    focus = util.zsubsup(prev, dir);
                    break;
                }
                case "root": {
                    focus = util.zroot(prev, Dir.Right);
                    break;
                }
                case "limits": {
                    const dir = prev.children[1] ? Dir.Right : Dir.Left;
                    focus = util.zlimits(prev, dir);
                    break;
                }
                default: {
                    throw new UnreachableCaseError(prev);
                }
            }

            const breadcrumb: Breadcrumb = {
                row: util.delLeft(zipper.row),
                focus: focus,
            };

            const focusedRow = rightChild || leftChild;
            if (!focusedRow) {
                throw new Error("subsup without subscript or superscript");
            }

            return {
                breadcrumbs: [...zipper.breadcrumbs, breadcrumb],
                row: util.endRow(focusedRow), // [1, 2, ...] []
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

        const focusLeft = (row: types.Row): Zipper => ({
            breadcrumbs: [
                ...zipper.breadcrumbs.slice(0, -1),
                {
                    row: parentRow,
                    focus: {
                        ...focus,
                        dir: Dir.Left,
                        other: exitedRow,
                    },
                },
            ],
            row: util.endRow(row),
        });

        const exitNode = (updatedNode: types.Node): Zipper => ({
            breadcrumbs: zipper.breadcrumbs.slice(0, -1),
            // place the fraction we exited on our right
            row: util.insertRight(parentRow, updatedNode),
        });

        switch (focus.type) {
            case "zsubsup": {
                return focus.dir === Dir.Right && focus.other
                    ? focusLeft(focus.other)
                    : exitNode(util.subsup(focus, exitedRow));
            }
            case "zfrac": {
                return focus.dir === Dir.Right
                    ? focusLeft(focus.other)
                    : exitNode(util.frac(focus, exitedRow));
            }
            case "zroot": {
                return focus.dir === Dir.Right && focus.other
                    ? focusLeft(focus.other)
                    : exitNode(util.root(focus, exitedRow));
            }
            case "zlimits":
                return focus.dir === Dir.Right && focus.other
                    ? focusLeft(focus.other)
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

const selectionLeft = (zipper: Zipper): Zipper => {
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
        if (row.left.length > 0) {
            // Create a new selection to the left and move left.
            return crumbMoveLeft(startSelection(zipper, Dir.Left));
        } else {
            // Create an empty selection and them move outward.
            const index = zipper.breadcrumbs.length - 1;
            const crumb = zipper.breadcrumbs[index];
            const updatedCrumb = startSelection(crumb, Dir.Left);

            return {
                ...startSelection(zipper, Dir.Left),
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

        if (row.selection.dir === Dir.Left) {
            if (row.left.length > 0) {
                return crumbMoveLeft(zipper);
            } else {
                const index = zipper.breadcrumbs.length - 1;
                const crumb = zipper.breadcrumbs[index];
                const updatedCrumb = startSelection(crumb, Dir.Left);

                // move out to start a selection in the parent crumb
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
                const result = crumbMoveLeft(zipper);
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

        if (row.selection.dir === Dir.Left) {
            if (row.left.length > 0) {
                const updatedCrumb = crumbMoveLeft(crumb);
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
                const updatedCrumb = startSelection(crumb, Dir.Left);
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
                const updatedCrumb = crumbMoveLeft(crumb);
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

export const moveLeft = (zipper: Zipper, selecting?: boolean): Zipper => {
    return selecting ? selectionLeft(zipper) : cursorLeft(zipper);
};
