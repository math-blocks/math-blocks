import {UnreachableCaseError} from "@math-blocks/core";

import {Breadcrumb, Focus, Zipper, ZRow} from "./types";
import * as types from "../types";
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
                selection.dir === "right"
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
                    focus = util.zfrac(prev, "right");
                    break;
                }
                case "subsup": {
                    const dir = prev.children[1] ? "right" : "left";
                    focus = util.zsubsup(prev, dir);
                    break;
                }
                case "root": {
                    focus = util.zroot(prev, "right");
                    break;
                }
                case "limits": {
                    const dir = prev.children[1] ? "right" : "left";
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
                        dir: "left",
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
                return focus.dir === "right" && focus.other
                    ? focusLeft(focus.other)
                    : exitNode(util.subsup(focus, exitedRow));
            }
            case "zfrac": {
                return focus.dir === "right"
                    ? focusLeft(focus.other)
                    : exitNode(util.frac(focus, exitedRow));
            }
            case "zroot": {
                return focus.dir === "right" && focus.other
                    ? focusLeft(focus.other)
                    : exitNode(util.root(focus, exitedRow));
            }
            case "zlimits":
                return focus.dir === "right" && focus.other
                    ? focusLeft(focus.other)
                    : exitNode(util.limits(focus, exitedRow));
            default:
                throw new UnreachableCaseError(focus);
        }
    }

    return zipper;
};

const selectionLeft = (zipper: Zipper): Zipper => {
    // INVARIANT: selections in crumbs can only exist from last crumb (top) back
    // to the first crumb (bottom), there can be no gaps either

    // Cases to handle:
    // - start a selection
    // - expand a selection (possibly moving out to a yet to be selected focus)
    // - contract a selection (possible moving in to an already selected focus)

    const rowsWithSelections = zipper.breadcrumbs
        .map((crumb) => crumb.row)
        .filter((row) => row.selection);
    if (zipper.row.selection) {
        rowsWithSelections.push(zipper.row);
    }
    rowsWithSelections.reverse();

    if (rowsWithSelections.length === 0) {
        const {row} = zipper;

        // We haven't started selecting anything yet.
        if (row.left.length > 0) {
            // Create a new selection to the left and move left.
            return crumbMoveLeft(startSelection(zipper, "left"));
        } else {
            // Create an empty selection and them move outward.
            const index = zipper.breadcrumbs.length - 1;
            const crumb = zipper.breadcrumbs[index];
            const updatedCrumb = startSelection(crumb, "left");

            return {
                ...startSelection(zipper, "left"),
                breadcrumbs: replaceItem(
                    zipper.breadcrumbs,
                    updatedCrumb,
                    index,
                ),
            };
        }
    } else if (rowsWithSelections.length === 1) {
        // our selection is in the current row (top of zipper)

        if (zipper.row.selection?.dir === "left") {
            if (zipper.row.left.length > 0) {
                return crumbMoveLeft(zipper);
            } else {
                const index = zipper.breadcrumbs.length - 1;
                const crumb = zipper.breadcrumbs[index];
                const updatedCrumb = startSelection(crumb, "left");

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
        } else if (zipper.row.selection?.dir === "right") {
            if (zipper.row.selection.nodes.length > 0) {
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
        } else {
            return zipper;
        }
    } else {
        // our selection is in the one of the breadcrumb rows

        let index = zipper.breadcrumbs.length - rowsWithSelections.length + 1;
        const crumb = zipper.breadcrumbs[index];
        const {row} = crumb;

        if (row.selection?.dir === "left") {
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
                // move out to start a selection in the parent crumb
                index = index - 1;
                if (index < 0) {
                    return zipper;
                }

                const crumb = zipper.breadcrumbs[index];
                const updatedCrumb = startSelection(crumb, "left");

                return {
                    ...zipper,
                    breadcrumbs: replaceItem(
                        zipper.breadcrumbs,
                        updatedCrumb,
                        index,
                    ),
                };
            }
        } else if (row.selection?.dir === "right") {
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
                const updatedCrumb: Breadcrumb = stopSelection(crumb);
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
                    result.breadcrumbs.every(
                        (crumb) => crumb.row.selection === null,
                    )
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

export const moveLeft = (zipper: Zipper, selecting?: boolean): Zipper => {
    return selecting ? selectionLeft(zipper) : cursorLeft(zipper);
};
