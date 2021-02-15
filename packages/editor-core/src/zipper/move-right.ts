import {UnreachableCaseError} from "@math-blocks/core";

import {Breadcrumb, Focus, Zipper, ZRow} from "./types";
import * as types from "../types";
import * as util from "./util";
import {crumbMoveRight, startSelection, stopSelection} from "./selection-util";
import {replaceItem, splitArrayAt} from "./array-util";

const cursorRight = (zipper: Zipper): Zipper => {
    const {left, selection, right} = zipper.row;

    // Exit the selection to the right
    if (selection) {
        const index = zipper.path.findIndex(
            (crumb) => crumb.row.selection !== null,
        );

        // The selection is completely within the `zipper.row`.
        if (index === -1) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left, ...selection.nodes],
                    selection: null,
                },
            };
        }

        // The selection is in one of the breadcrumbs.
        const [restCrumbs, topCrumbs] = splitArrayAt(zipper.path, index);
        // We need to process these from top to bottom (reverse order)
        topCrumbs.reverse();

        // Collapse each crumb in `topCrumbs` into `row`.
        const row = topCrumbs.reduce((row, crumb): ZRow => {
            const unfocusedNode = util.focusToNode(
                crumb.focus,
                util.zrowToRow(row),
            );
            const selectionNodes =
                selection.dir === "right"
                    ? [unfocusedNode, ...(crumb.row.selection?.nodes || [])]
                    : [...(crumb.row.selection?.nodes || []), unfocusedNode];
            return {
                ...crumb.row,
                left: [...crumb.row.left, ...selectionNodes],
                selection: null,
            };
        }, zipper.row);

        return {
            ...zipper,
            row: row,
            path: restCrumbs,
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
                    focus = util.zfrac(next, "left");
                    break;
                }
                case "subsup": {
                    const dir = next.children[0] ? "left" : "right";
                    focus = util.zsubsup(next, dir);
                    break;
                }
                case "root": {
                    const dir = next.children[0] ? "left" : "right";
                    focus = util.zroot(next, dir);
                    break;
                }
                case "limits":
                    focus = util.zlimits(next, "left");
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
                path: [...zipper.path, breadcrumb],
                row: util.startRow(focusedRow), // [] [1, 2, ...]
            };
        }

        // fallback behavior
        return zipper;
    }

    // Move out of the current row.
    if (zipper.path.length > 0) {
        const {focus, row: parentRow} = zipper.path[zipper.path.length - 1];

        const exitedRow: types.Row = util.zrowToRow(zipper.row);

        const focusRight = (row: types.Row): Zipper => ({
            path: [
                ...zipper.path.slice(0, -1),
                {
                    row: parentRow,
                    focus: {
                        ...focus,
                        dir: "right",
                        other: exitedRow,
                    },
                },
            ],
            row: util.startRow(row),
        });

        const exitNode = (updatedNode: types.Node): Zipper => ({
            path: zipper.path.slice(0, -1),
            // place the subsup we exited on our left
            row: util.insertLeft(parentRow, updatedNode),
        });

        switch (focus.type) {
            case "zsubsup":
                return focus.dir === "left" && focus.other
                    ? focusRight(focus.other)
                    : exitNode(util.subsup(focus, exitedRow));
            case "zfrac":
                return focus.dir === "left"
                    ? focusRight(focus.other)
                    : exitNode(util.frac(focus, exitedRow));
            case "zroot":
                return focus.dir === "left"
                    ? focusRight(focus.other)
                    : exitNode(util.root(focus, exitedRow));
            case "zlimits":
                return focus.dir === "left" && focus.other
                    ? focusRight(focus.other)
                    : exitNode(util.limits(focus, exitedRow));
            default:
                throw new UnreachableCaseError(focus);
        }
    }

    return zipper;
};

const selectionRight = (zipper: Zipper): Zipper => {
    // INVARIANT: selections in crumbs can only exist from last crumb (top) back
    // to the first crumb (bottom), there can be no gaps either

    // Cases to handle:
    // - start a selection
    // - expand a selection (possibly moving out to a yet to be selected focus)
    // - contract a selection (possible moving in to an already selected focus)

    const rowsWithSelections = zipper.path
        .map((crumb) => crumb.row)
        .filter((row) => row.selection);
    if (zipper.row.selection) {
        rowsWithSelections.push(zipper.row);
    }
    rowsWithSelections.reverse();

    if (rowsWithSelections.length === 0) {
        const {row} = zipper;

        // We haven't started selecting anything yet.
        if (row.right.length > 0) {
            // Create a new selection to the left and move left.
            return crumbMoveRight(startSelection(zipper, "right"));
        } else {
            // Create an empty selection and them move outward.
            const index = zipper.path.length - 1;
            const crumb = zipper.path[index];
            const updatedCrumb = startSelection(crumb, "right");

            return {
                ...startSelection(zipper, "right"),
                path: replaceItem(zipper.path, updatedCrumb, index),
            };
        }
    } else if (rowsWithSelections.length === 1) {
        // our selection is in the current row (top of zipper)

        if (zipper.row.selection?.dir === "right") {
            if (zipper.row.right.length > 0) {
                return crumbMoveRight(zipper);
            } else {
                const index = zipper.path.length - 1;
                const crumb = zipper.path[index];
                const updatedCrumb = startSelection(crumb, "right");

                // move out to start a selection in the parent crumb
                return {
                    ...zipper,
                    path: replaceItem(zipper.path, updatedCrumb, index),
                };
            }
        } else if (zipper.row.selection?.dir === "left") {
            if (zipper.row.selection.nodes.length > 0) {
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
        } else {
            return zipper;
        }
    } else {
        // our selection is in the one of the breadcrumb rows

        const index = zipper.path.length - rowsWithSelections.length + 1;
        const crumb = zipper.path[index];
        const {row} = crumb;

        if (row.selection?.dir === "right") {
            if (row.right.length > 0) {
                const updatedCrumb = crumbMoveRight(crumb);
                return {
                    ...zipper,
                    path: replaceItem(zipper.path, updatedCrumb, index),
                };
            } else {
                // move out to start a selection in the parent crumb
                const index = zipper.path.length - rowsWithSelections.length;
                if (index < 0) {
                    return zipper;
                }

                const crumb = zipper.path[index];
                const updatedCrumb = startSelection(crumb, "right");

                return {
                    ...zipper,
                    path: replaceItem(zipper.path, updatedCrumb, index),
                };
            }
        } else if (row.selection?.dir === "left") {
            if (row.selection.nodes.length > 0) {
                const updatedCrumb = crumbMoveRight(crumb);
                return {
                    ...zipper,
                    path: replaceItem(zipper.path, updatedCrumb, index),
                };
            } else {
                const updatedCrumb: Breadcrumb = stopSelection(crumb);
                const result = {
                    ...zipper,
                    path: replaceItem(zipper.path, updatedCrumb, index),
                };
                // If there are no selections in any of the breadcrumbs and the
                // selection in the result.row is empty then clear the selection
                // there as well.
                if (
                    result.path.every((crumb) => crumb.row.selection === null)
                ) {
                    if (result.row.selection?.nodes.length === 0) {
                        return stopSelection(result);
                    }
                }
                return result;
            }
        } else {
            return zipper;
        }
    }
};

export const moveRight = (zipper: Zipper, selecting?: boolean): Zipper => {
    return selecting ? selectionRight(zipper) : cursorRight(zipper);
};
