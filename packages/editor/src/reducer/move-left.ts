import * as types from "../char/types";

import * as util from "./util";
import {selectionZipperFromZippers} from "./convert";
import {getAllowed} from "./vertical-work/util";

import type {Breadcrumb, Focus, Zipper, State} from "./types";

export const cursorLeft = (zipper: Zipper): Zipper => {
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
        if (prev.type === "char") {
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
            // const index = prev.children.findLastIndex(item => item != null);
            let index = prev.children.length - 1;
            for (; index > -1; index--) {
                if (prev.children[index] != null) {
                    break;
                }
            }
            if (prev.type === "table" && prev.subtype === "matrix") {
                index = prev.colCount * Math.ceil(prev.rowCount / 2) - 1;
            }
            const focus: Focus = util.nodeToFocus(prev, index);

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

            const focusedRow = prev.children[index];
            if (!focusedRow) {
                throw new Error("no non-null row to navigate into");
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
        const {focus, row: parentRow} =
            zipper.breadcrumbs[zipper.breadcrumbs.length - 1];

        // Prevent moving left from the first column when showing work vertically
        if (focus.type === "ztable" && focus.subtype === "algebra") {
            const index = focus.left.length;
            const col = index % focus.colCount;
            if (col === 0) {
                return zipper;
            }
        }

        const exitedRow: types.CharRow = util.zrowToRow(zipper.row);
        const allowed = getAllowed(zipper, focus);
        const cursorIndex = focus.left.length;
        const allowedLeft = allowed.slice(0, cursorIndex);

        const exitFocus = (): Zipper => {
            return {
                breadcrumbs: zipper.breadcrumbs.slice(0, -1),
                // place the fraction we exited on our right
                row: {
                    type: "zrow",
                    id: parentRow.id,
                    left: parentRow.left,
                    selection: [],
                    right: [
                        // Place the exited node to the right of the cursor in
                        // the parent row.
                        util.focusToNode(focus, exitedRow),
                        ...parentRow.right,
                    ],
                    style: parentRow.style,
                },
            };
        };

        // const prevIndex = focus.left.findLastIndex((item) => item != null);
        let prevIndex = focus.left.length - 1;
        for (; prevIndex > -1; prevIndex--) {
            if (allowedLeft[prevIndex]) {
                break;
            }
        }
        const prev = focus.left[prevIndex];

        if (focus.type === "ztable" && focus.subtype === "algebra") {
            // Don't allow people to wrap around from one row to the previous
            // when showing work vertically.
            const index = focus.left.length;
            const col = index % focus.colCount;
            if (col === 0) {
                return zipper;
            }
        }

        if (focus.type === "ztable" && focus.subtype === "matrix") {
            const index = focus.left.length;
            const col = index % focus.colCount;
            if (col === 0) {
                // Exit the current focus since there aren't any rows within the node
                // to the left.
                return exitFocus();
            }
        }

        if (prev == null) {
            // Exit the current focus since there aren't any rows within the node
            // to the left.
            return exitFocus();
        }

        // Navigate to the prev row within the node.
        const leftOfPrev = focus.left.slice(0, prevIndex);
        const rightOfPrev = focus.left.slice(prevIndex + 1);
        return {
            breadcrumbs: [
                ...zipper.breadcrumbs.slice(0, -1),
                {
                    row: parentRow,
                    focus: {
                        ...focus,
                        left: leftOfPrev,
                        right: [
                            ...rightOfPrev, // we skipped over these (all null)
                            exitedRow,
                            ...focus.right,
                        ],
                    } as Focus,
                },
            ],
            row: util.zrow(prev.id, prev.children, [], prev.style),
        };
    }

    return zipper;
};

const selectionLeft = (startZipper: Zipper, endZipper: Zipper): Zipper => {
    // Case 1: We're at the start of the row
    if (endZipper.row.left.length === 0) {
        // leave the node if we can
        if (endZipper.breadcrumbs.length > 0) {
            const {focus, row: parentRow} =
                endZipper.breadcrumbs[endZipper.breadcrumbs.length - 1];

            const exitedRow: types.CharRow = util.zrowToRow(endZipper.row);

            const exitNode = (updatedNode: types.CharNode): Zipper => ({
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
                const child: types.CharRow =
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
    if (state.selecting) {
        const newEndZipper = selectionLeft(state.startZipper, state.endZipper);
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
        const newZipper = cursorLeft(state.zipper);
        return {
            ...state,
            startZipper: newZipper,
            endZipper: newZipper,
            zipper: newZipper,
        };
    }
};
