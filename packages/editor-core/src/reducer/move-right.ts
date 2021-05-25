import {UnreachableCaseError} from "@math-blocks/core";

import * as types from "../types";

import type {Breadcrumb, Focus, Zipper} from "./types";
import * as util from "./util";

const cursorRight = (zipper: Zipper): Zipper => {
    const {left, selection, right} = zipper.row;

    // Exit the selection to the right
    if (selection.length > 0) {
        return {
            ...zipper,
            row: {
                ...zipper.row,
                left: [...left, ...selection],
                selection: [],
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
                    focus = util.zfrac(next, 0);
                    break;
                }
                case "subsup": {
                    const index = next.children[0] ? 0 : 1;
                    focus = util.zsubsup(next, index);
                    break;
                }
                case "root": {
                    const index = next.children[0] ? 0 : 1;
                    focus = util.zroot(next, index);
                    break;
                }
                case "limits":
                    focus = util.zlimits(next, 0);
                    break;
                case "delimited": {
                    focus = util.zdelimited(next);
                    break;
                }
                default:
                    throw new UnreachableCaseError(next);
            }

            const breadcrumb: Breadcrumb = {
                row: {
                    type: "bcrow",
                    id: zipper.row.id,
                    left: left,
                    // The node that was removed from right here is the node
                    // that we're navigating into.
                    right: right.slice(1),
                    style: zipper.row.style,
                },
                focus: focus,
            };

            const focusedRow = leftChild || rightChild;
            if (!focusedRow) {
                throw new Error("subsup without subscript or superscript");
            }

            return {
                breadcrumbs: [...zipper.breadcrumbs, breadcrumb],
                row: util.zrow(
                    focusedRow.id,
                    [],
                    focusedRow.children,
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
            // place the subsup we exited on our left
            row: {
                type: "zrow",
                id: parentRow.id,
                left: [...parentRow.left, updatedNode],
                selection: [],
                right: parentRow.right,
                style: parentRow.style,
            },
        });

        if (focus.type === "zdelimited") {
            return exitNode(util.delimited(focus, exitedRow));
        }

        const focusRight = (row: types.Row): Zipper => ({
            breadcrumbs: [
                ...zipper.breadcrumbs.slice(0, -1),
                {
                    row: parentRow,
                    focus: {
                        ...focus,
                        left: [exitedRow],
                        right: [],
                    },
                },
            ],
            row: util.zrow(row.id, [], row.children, row.style),
        });

        return focus.right[0]
            ? focusRight(focus.right[0])
            : exitNode(util.focusToNode(focus, exitedRow));
    }

    return zipper;
};

const selectionRight = (startZipper: Zipper, endZipper: Zipper): Zipper => {
    // Case 1: We're at the end of the row
    if (endZipper.row.right.length === 0) {
        // leave the node if we can
        if (endZipper.breadcrumbs.length > 0) {
            const {focus, row: parentRow} = endZipper.breadcrumbs[
                endZipper.breadcrumbs.length - 1
            ];

            const exitNode = (updatedNode: types.Node): Zipper => ({
                breadcrumbs: endZipper.breadcrumbs.slice(0, -1),
                // place the subsup we exited on our left
                row: {
                    type: "zrow",
                    id: parentRow.id,
                    left: [...parentRow.left, updatedNode],
                    selection: [],
                    right: parentRow.right,
                    style: parentRow.style,
                },
            });

            const exitedRow: types.Row = util.zrowToRow(endZipper.row);

            return exitNode(util.focusToNode(focus, exitedRow));
        }

        // If there are no breadcrumbs we're at the topmost row so there's
        // nowhere to go.
        return endZipper;
    }

    const nextNode = endZipper.row.right[0];

    // Case 2: Enter the next node if the startZipper is focused on it
    let canEnterNextNode = true;

    // If there are more breadcrumbs in the startZipper...
    if (endZipper.breadcrumbs.length < startZipper.breadcrumbs.length) {
        // ...and all of the breadcrums in the endZipper have a match in
        // startZipper...
        canEnterNextNode = endZipper.breadcrumbs.every((endCrumb, i) => {
            const startCrumb = startZipper.breadcrumbs[i];
            return (
                startCrumb.focus.id === endCrumb.focus.id &&
                startCrumb.focus.left.length === endCrumb.focus.left.length &&
                startCrumb.focus.right.length === endCrumb.focus.right.length
            );
        });

        if (canEnterNextNode) {
            const nextCrumb =
                startZipper.breadcrumbs[endZipper.breadcrumbs.length];

            // ...and the focus of the next crumb in startZipper matches the node
            // we're trying to enter...
            if (nextCrumb.focus.id === nextNode.id) {
                const child: types.Row =
                    // @ts-expect-error: TODO - type check this
                    nextNode.children[nextCrumb.focus.left.length];

                return {
                    ...endZipper,
                    // ...then enter the node using the next crumb...
                    breadcrumbs: [...endZipper.breadcrumbs, nextCrumb],
                    // ...and move the cursor to the start of the row.
                    row: util.zrow(child.id, [], child.children, child.style),
                };
            }
        }
    }

    // Case 3: Simple move to the right
    return {
        ...endZipper,
        row: {
            ...endZipper.row,
            left: [...endZipper.row.left, nextNode],
            right: endZipper.row.right.slice(1),
        },
    };
};

export const moveRight = (startZipper: Zipper, endZipper?: Zipper): Zipper => {
    return endZipper
        ? selectionRight(startZipper, endZipper)
        : cursorRight(startZipper);
};
