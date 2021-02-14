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

const cursorLeft = (zipper: Zipper): Zipper => {
    const {row: currentRow, path} = zipper;

    const {left, selection, right} = currentRow;

    // TODO: handle dropping a selection

    if (left.length > 0) {
        const prev = left[left.length - 1];

        // exit the selection to the left
        if (selection && selection.nodes.length > 0) {
            return {
                ...zipper,
                row: {
                    ...currentRow,
                    selection: null,
                    right: [...selection.nodes, ...right],
                },
            };
        }

        // move left
        if (prev.type === "atom") {
            return {
                ...zipper,
                row: {
                    ...currentRow,
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
                row: util.delLeft(currentRow),
                focus: focus,
            };

            const focusedRow = rightChild || leftChild;
            if (!focusedRow) {
                throw new Error("subsup without subscript or superscript");
            }

            return {
                path: [...path, breadcrumb],
                row: util.endRow(focusedRow), // [1, 2, ...] []
            };
        }

        // fallback behavior
        return zipper;
    }

    if (path.length > 0) {
        const {focus, row: parentRow} = path[path.length - 1];

        const exitedRow: types.Row = util.zrowToRow(currentRow);

        const focusLeft = (row: types.Row): Zipper => ({
            path: [
                ...path.slice(0, -1),
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
            path: [...path.slice(0, -1)],
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

    // TODO: dedupe with above
    // exit the selection to the left
    if (selection && selection.nodes.length > 0) {
        return {
            ...zipper,
            row: {
                ...currentRow,
                selection: null,
                right: [...selection.nodes, ...right],
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

const crumbMoveLeft = <T extends {row: ZRow}>(crumb: T): T => {
    const {row} = crumb;
    const {left, selection, right} = row;
    // TODO: bounds check
    const prev = left[left.length - 1];

    if (!selection) {
        return crumb;
    }

    if (selection.dir === "left") {
        return {
            ...crumb,
            row: {
                ...row,
                left: left.slice(0, -1),
                selection: {
                    ...selection,
                    nodes: [prev, ...selection.nodes],
                },
            },
        };
    } else {
        // TODO: bounds check
        const next = selection.nodes[selection.nodes.length - 1];

        return {
            ...crumb,
            row: {
                ...row,
                selection: {
                    ...selection,
                    nodes: selection.nodes.slice(0, -1),
                },
                right: [next, ...right],
            },
        };
    }
};

const selectionLeft = (zipper: Zipper): Zipper => {
    // Cases to handle:
    // - start a selection
    // - expand a selection (possibly moving out to a yet to be selected focus)
    // - contract a selection (possible moving in to an already selected focus)

    const {row: currentRow, path} = zipper;

    // TODO: determine which row we're currently selecting in
    // - we can do this by look at each row (breadcrumbs + zipper.row) to see
    //   which have non-empty selection arrays
    // - once we know which row we're selecting in, we can take the appropriate
    //   action

    // INVARIANT: selections in crumbs can only exist from last crumb (top) back
    // to the first crumb (bottom), there can be no gaps either

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
        if (row.left.length > 0) {
            // Create a new selection to the left and move left.
            return crumbMoveLeft(startSelection(zipper, "left"));
        } else {
            // Create an empty selection and them move outward.
            const index = zipper.path.length - 1;
            const crumb = zipper.path[index];
            const updatedCrumb = startSelection(crumb, "left");

            return {
                ...startSelection(zipper, "left"),
                path: replaceItem(path, updatedCrumb, index),
            };
        }
    } else if (rowsWithSelections.length === 1) {
        // our selection is in the current row (top of zipper)

        if (currentRow.selection?.dir === "left") {
            if (currentRow.left.length > 0) {
                return crumbMoveLeft(zipper);
            } else {
                const index = zipper.path.length - 1;
                const crumb = zipper.path[index];
                const updatedCrumb = startSelection(crumb, "left");

                // move out to start a selection in the parent crumb
                return {
                    ...zipper,
                    path: replaceItem(path, updatedCrumb, index),
                };
            }
        } else if (currentRow.selection?.dir === "right") {
            if (currentRow.selection.nodes.length > 0) {
                const result = crumbMoveLeft(zipper);
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

        // TODO: check the direction of the selection
        let index = zipper.path.length - rowsWithSelections.length + 1;
        const crumb = zipper.path[index];
        const {row} = crumb;

        if (row.selection?.dir === "left") {
            if (row.left.length > 0) {
                const updatedCrumb = crumbMoveLeft(crumb);
                return {
                    ...zipper,
                    path: replaceItem(path, updatedCrumb, index),
                };
            } else {
                // move out to start a selection in the parent crumb
                index = index - 1;
                if (index < 0) {
                    return zipper;
                }

                const crumb = zipper.path[index];
                const updatedCrumb = startSelection(crumb, "left");

                return {
                    ...zipper,
                    path: replaceItem(path, updatedCrumb, index),
                };
            }
        } else if (row.selection?.dir === "right") {
            if (row.selection.nodes.length > 0) {
                const updatedCrumb = crumbMoveLeft(crumb);
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

export const moveLeft = (zipper: Zipper, selecting?: boolean): Zipper => {
    return selecting ? selectionLeft(zipper) : cursorLeft(zipper);
};
