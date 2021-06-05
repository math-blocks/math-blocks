import {UnreachableCaseError} from "@math-blocks/core";

import * as types from "../ast/types";

import type {Breadcrumb, Focus, Zipper, State} from "./types";
import * as util from "./util";

const cursorLeft = (zipper: Zipper, startZipper?: Zipper): Zipper => {
    const {left, selection, right} = zipper.row;

    // Exit the selection to the left
    if (selection.length > 0) {
        return {
            ...zipper,
            row: {
                ...zipper.row,
                selection: [],
                right: [...selection, ...right],
            },
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
                    focus = util.zfrac(prev, 1);
                    break;
                }
                case "subsup": {
                    const index = prev.children[1] ? 1 : 0;
                    focus = util.zsubsup(prev, index);
                    break;
                }
                case "root": {
                    focus = util.zroot(prev, 1);
                    break;
                }
                case "limits": {
                    const index = prev.children[1] ? 1 : 0;
                    focus = util.zlimits(prev, index);
                    break;
                }
                case "delimited": {
                    focus = util.zdelimited(prev);
                    break;
                }
                default: {
                    throw new UnreachableCaseError(prev);
                }
            }

            const breadcrumb: Breadcrumb = {
                row: {
                    type: "bcrow",
                    id: zipper.row.id,
                    // The node that was removed from `left` here is the node
                    // that we're navigating into.
                    left: left.slice(0, -1),
                    right: right,
                    style: zipper.row.style,
                },
                focus: focus,
            };

            const focusedRow = rightChild || leftChild;
            if (!focusedRow) {
                throw new Error("subsup without subscript or superscript");
            }

            return {
                breadcrumbs: [...zipper.breadcrumbs, breadcrumb],
                row: util.zrow(
                    focusedRow.id,
                    focusedRow.children,
                    [],
                    focusedRow.style,
                ),
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

        const exitNode = (updatedNode: types.Node): Zipper => ({
            breadcrumbs: zipper.breadcrumbs.slice(0, -1),
            // place the fraction we exited on our right
            row: {
                type: "zrow",
                id: parentRow.id,
                left: parentRow.left,
                selection: [],
                right: [updatedNode, ...parentRow.right],
                style: parentRow.style,
            },
        });

        if (focus.type === "zdelimited") {
            return exitNode(util.delimited(focus, exitedRow));
        }

        const focusLeft = (row: types.Row): Zipper => ({
            breadcrumbs: [
                ...zipper.breadcrumbs.slice(0, -1),
                {
                    row: parentRow,
                    focus: {
                        ...focus,
                        left: [],
                        right: [exitedRow],
                    },
                },
            ],
            row: util.zrow(row.id, row.children, [], row.style),
        });

        return focus.left[0]
            ? focusLeft(focus.left[0])
            : exitNode(util.focusToNode(focus, exitedRow));
    }

    return zipper;
};

const selectionLeft = (startZipper: Zipper, endZipper: Zipper): Zipper => {
    // Case 1: We're at the start of the row
    if (endZipper.row.left.length === 0) {
        // leave the node if we can
        if (endZipper.breadcrumbs.length > 0) {
            const {focus, row: parentRow} = endZipper.breadcrumbs[
                endZipper.breadcrumbs.length - 1
            ];

            const exitedRow: types.Row = util.zrowToRow(endZipper.row);

            const exitNode = (updatedNode: types.Node): Zipper => ({
                breadcrumbs: endZipper.breadcrumbs.slice(0, -1),
                // place the fraction we exited on our right
                row: {
                    type: "zrow",
                    id: parentRow.id,
                    left: parentRow.left,
                    selection: [],
                    right: [updatedNode, ...parentRow.right],
                    style: parentRow.style,
                },
            });

            return exitNode(util.focusToNode(focus, exitedRow));
        }

        // If there are no breadcrumbs we're at the topmost row so there's
        // nowhere to go.
        return endZipper;
    }

    const prevNode = endZipper.row.left[endZipper.row.left.length - 1];

    // Case 2: Enter the next node if the startZipper is focused on it
    let canEnterPrevNode = true;

    // If there are more breadcrumbs in the startZipper...
    if (endZipper.breadcrumbs.length < startZipper.breadcrumbs.length) {
        // ...and all of the breadcrums in the endZipper have a match in
        // startZipper...
        canEnterPrevNode = endZipper.breadcrumbs.every((endCrumb, i) => {
            const startCrumb = startZipper.breadcrumbs[i];
            return (
                startCrumb.focus.id === endCrumb.focus.id &&
                startCrumb.focus.left.length === endCrumb.focus.left.length &&
                startCrumb.focus.right.length === endCrumb.focus.right.length
            );
        });

        if (canEnterPrevNode) {
            const nextCrumb =
                startZipper.breadcrumbs[endZipper.breadcrumbs.length];

            // ...and the focus of the next crumb in startZipper matches the node
            // we're trying to enter...
            if (nextCrumb.focus.id === prevNode.id) {
                const child: types.Row =
                    // @ts-expect-error: TODO - type check this
                    prevNode.children[nextCrumb.focus.left.length];

                const result = {
                    ...endZipper,
                    // ...then enter the node using the next crumb...
                    breadcrumbs: [...endZipper.breadcrumbs, nextCrumb],
                    // ...and move the cursor to the end of the row.
                    row: util.zrow(child.id, child.children, [], child.style),
                };

                return result;
            }
        }
    }

    return {
        ...endZipper,
        row: {
            ...endZipper.row,
            left: endZipper.row.left.slice(0, -1),
            right: [prevNode, ...endZipper.row.right],
        },
    };
};

export const moveLeft = (state: State): State => {
    if (state.endZipper) {
        return {
            ...state,
            endZipper: selectionLeft(state.startZipper, state.endZipper),
        };
    } else {
        return {
            ...state,
            startZipper: cursorLeft(state.startZipper),
        };
    }
};
