import * as types from "../ast/types";

import * as util from "./util";
import {selectionZipperFromZippers} from "./convert";
import {getAllowed} from "./vertical-work/util";

import type {Breadcrumb, Focus, Zipper, State} from "./types";

export const cursorRight = (zipper: Zipper): Zipper => {
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
            const index = next.children.findIndex((item) => item != null);
            const focus: Focus = util.nodeToFocus(next, index);

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

            const focusedRow = next.children[index];
            if (!focusedRow) {
                throw new Error("no non-null row to navigate into");
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
        const {focus, row: parentRow} =
            zipper.breadcrumbs[zipper.breadcrumbs.length - 1];

        // Prevent moving right from the last column when showing work vertically
        if (focus.type === "ztable" && focus.subtype === "algebra") {
            const index = focus.left.length;
            const col = index % focus.colCount;
            if (col === focus.colCount - 1) {
                return zipper;
            }
        }

        const exitedRow: types.Row = util.zrowToRow(zipper.row);

        const allowed = getAllowed(zipper, focus);
        const cursorIndex = focus.left.length;
        const allowedRight = allowed.slice(cursorIndex + 1);
        const nextIndex = focus.right.findIndex(
            (_, index) => allowedRight[index],
        );
        const next = focus.right[nextIndex];

        if (next == null) {
            // Don't allow people to exit the table when showing work vertically
            if (focus.type === "ztable" && focus.subtype === "algebra") {
                return zipper;
            }

            // Exit the current focus since there are now rows within the node
            // to the right.
            return {
                breadcrumbs: zipper.breadcrumbs.slice(0, -1),
                row: {
                    type: "zrow",
                    id: parentRow.id,
                    left: [
                        ...parentRow.left,
                        // Place the exited node to the left of the cursor in
                        // the parent row.
                        util.focusToNode(focus, exitedRow),
                    ],
                    selection: [],
                    right: parentRow.right,
                    style: parentRow.style,
                },
            };
        }

        // Navigate to the next row within the node.
        const leftOfNext = focus.right.slice(0, nextIndex);
        const rightOfNext = focus.right.slice(nextIndex + 1);
        return {
            breadcrumbs: [
                ...zipper.breadcrumbs.slice(0, -1),
                {
                    row: parentRow,
                    focus: {
                        ...focus,
                        left: [
                            ...focus.left,
                            exitedRow,
                            ...leftOfNext, // we skipped over these (all null)
                        ],
                        right: rightOfNext,
                    } as Focus,
                },
            ],
            row: util.zrow(next.id, [], next.children, next.style),
        };
    }

    return zipper;
};

const selectionRight = (startZipper: Zipper, endZipper: Zipper): Zipper => {
    // Case 1: We're at the end of the row
    if (endZipper.row.right.length === 0) {
        // leave the node if we can
        if (endZipper.breadcrumbs.length > 0) {
            const {focus, row: parentRow} =
                endZipper.breadcrumbs[endZipper.breadcrumbs.length - 1];

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

export const moveRight = (state: State): State => {
    if (state.selecting) {
        const newEndZipper = selectionRight(state.startZipper, state.endZipper);
        const selectionZipper = selectionZipperFromZippers(
            state.startZipper,
            newEndZipper,
        );
        if (!selectionZipper) {
            throw new Error("Unable to create selection zipper");
        }
        return {
            ...state,
            endZipper: newEndZipper,
            zipper: selectionZipper,
        };
    } else {
        const newZipper = cursorRight(state.zipper);
        return {
            ...state,
            startZipper: newZipper,
            endZipper: newZipper,
            zipper: newZipper,
        };
    }
};
