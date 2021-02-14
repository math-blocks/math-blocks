import {UnreachableCaseError} from "@math-blocks/core";

import {Breadcrumb, Focus, Zipper, ZRow} from "./types";
import * as types from "../types";
import * as util from "./util";

const replaceItem = <T>(
    items: T[] | TwoOrMore<T>,
    newItem: T,
    index: number,
): T[] => {
    return [...items.slice(0, index), newItem, ...items.slice(index + 1)];
};

const cursorRight = (zipper: Zipper): Zipper => {
    const {row: currentRow, path} = zipper;

    const {left, selection, right} = currentRow;

    // TODO: handle dropping a selection

    if (right.length > 0) {
        const next = right[0]; // right.head

        // exit the selection to the right
        if (selection && selection.nodes.length > 0) {
            return {
                ...zipper,
                row: {
                    ...currentRow,
                    left: [...left, ...selection.nodes],
                    selection: null,
                },
            };
        }

        // move right
        if (next.type === "atom") {
            return {
                ...zipper,
                row: {
                    ...currentRow,
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
                row: util.delRight(currentRow),
                focus: focus,
            };

            const focusedRow = leftChild || rightChild;
            if (!focusedRow) {
                throw new Error("subsup without subscript or superscript");
            }

            return {
                path: [...path, breadcrumb],
                row: util.startRow(focusedRow), // [] [1, 2, ...]
            };
        }

        // fallback behavior
        return zipper;
    }

    if (path.length > 0) {
        const {focus, row: parentRow} = path[path.length - 1];

        const exitedRow: types.Row = util.zrowToRow(currentRow);

        const focusRight = (row: types.Row): Zipper => ({
            path: [
                ...path.slice(0, -1),
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
            path: [...path.slice(0, -1)],
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

    // TODO: dedupe with above
    // exit the selection to the right
    if (selection && selection.nodes.length > 0) {
        return {
            ...zipper,
            row: {
                ...currentRow,
                left: [...left, ...selection.nodes],
                selection: null,
            },
        };
    }

    return zipper;
};

const startSelection = <T extends {row: ZRow}>(
    crumb: T,
    dir: "left" | "right",
): T => {
    return {
        ...crumb,
        row: {
            ...crumb.row,
            selection: {
                dir: dir,
                nodes: [],
            },
        },
    };
};

const crumbMoveRight = <T extends {row: ZRow}>(crumb: T): T => {
    const {row} = crumb;
    const {left, selection, right} = row;
    // TODO: bounds check
    const next = right[0];

    if (!selection) {
        return crumb;
    }

    if (selection.dir === "right") {
        return {
            ...crumb,
            row: {
                ...row,
                selection: {
                    ...selection,
                    nodes: [...selection.nodes, next],
                },
                right: right.slice(1),
            },
        };
    } else {
        // TODO: bounds check
        const prev = selection.nodes[0];

        return {
            ...crumb,
            row: {
                ...row,
                left: [...left, prev],
                selection: {
                    ...selection,
                    nodes: selection.nodes.slice(1),
                },
            },
        };
    }
};

const selectionRight = (zipper: Zipper): Zipper => {
    // INVARIANT: selections in crumbs can only exist from last crumb (top) back
    // to the first crumb (bottom), there can be no gaps either

    // Cases to handle:
    // - start a selection
    // - expand a selection (possibly moving out to a yet to be selected focus)
    // - contract a selection (possible moving in to an already selected focus)

    const {row: currentRow, path} = zipper;

    const rowsWithSelections = path
        .map((crumb) => crumb.row)
        .filter((row) => row.selection);
    if (currentRow.selection) {
        rowsWithSelections.push(currentRow);
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
                path: replaceItem(path, updatedCrumb, index),
            };
        }
    } else if (rowsWithSelections.length === 1) {
        // our selection is in the current row (top of zipper)

        if (currentRow.selection?.dir === "right") {
            if (currentRow.right.length > 0) {
                return crumbMoveRight(zipper);
            } else {
                const index = zipper.path.length - 1;
                const crumb = zipper.path[index];
                const updatedCrumb = startSelection(crumb, "right");

                // move out to start a selection in the parent crumb
                return {
                    ...zipper,
                    path: replaceItem(path, updatedCrumb, index),
                };
            }
        } else if (currentRow.selection?.dir === "left") {
            if (currentRow.selection.nodes.length > 0) {
                const result = crumbMoveRight(zipper);
                if (result.row.selection?.nodes.length === 0) {
                    // we're back at original cursor position, stop selecting
                    return {
                        ...result,
                        row: {
                            ...result.row,
                            selection: null,
                        },
                    };
                } else {
                    return result;
                }
            } else {
                // This should never happen since we drop the selection if the
                // number of nodes reaches 0.
                // we're back at original cursor position, stop selecting
                return {
                    ...zipper,
                    row: {
                        ...currentRow,
                        selection: null,
                    },
                };
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
                    path: replaceItem(path, updatedCrumb, index),
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
                    path: replaceItem(path, updatedCrumb, index),
                };
            }
        } else if (row.selection?.dir === "left") {
            if (row.selection.nodes.length > 0) {
                const updatedCrumb = crumbMoveRight(crumb);
                return {
                    ...zipper,
                    path: replaceItem(path, updatedCrumb, index),
                };
            } else {
                const updatedCrumb: Breadcrumb = {
                    ...crumb,
                    row: {
                        ...crumb.row,
                        selection: null,
                    },
                };

                return {
                    ...zipper,
                    path: replaceItem(path, updatedCrumb, index),
                };
            }
        } else {
            return zipper;
        }
    }
};

export const moveRight = (zipper: Zipper, selecting?: boolean): Zipper => {
    return selecting ? selectionRight(zipper) : cursorRight(zipper);
};
