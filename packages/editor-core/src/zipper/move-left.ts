import {UnreachableCaseError} from "@math-blocks/core";

import {Breadcrumb, Focus, Zipper} from "./types";
import * as types from "../types";
import * as util from "./util";

const cursorLeft = (zipper: Zipper): Zipper => {
    const {row: currentRow, path} = zipper;

    const {left, selection, right} = currentRow;

    if (
        left.length > 0 &&
        !(selection?.dir === "right" && right.length === 0)
    ) {
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

const selectionLeft = (zipper: Zipper): Zipper => {
    // Cases to handle:
    // - start a selection
    // - expand a selection (possibly moving out to a yet to be selected focus)
    // - contract a selection (possible moving in to an already selected focus)

    const {row: currentRow, path} = zipper;

    const {left, selection, right} = currentRow;

    if (
        left.length > 0 &&
        !(selection?.dir === "right" && right.length === 0)
    ) {
        const prev = left[left.length - 1];

        if (selection) {
            if (selection.dir === "left") {
                // widen the selection
                return {
                    ...zipper,
                    row: {
                        ...currentRow,
                        left: left.slice(0, -1),
                        selection: {
                            ...selection,
                            nodes: [prev, ...selection.nodes],
                        },
                    },
                };
            } else {
                // narrow the selection
                const newNodes = selection.nodes.slice(0, -1);
                return {
                    ...zipper,
                    row: {
                        ...currentRow,
                        selection:
                            newNodes.length > 0
                                ? {
                                      ...selection,
                                      nodes: newNodes,
                                  }
                                : null,
                        right: [
                            selection.nodes[selection.nodes.length - 1],
                            ...right,
                        ],
                    },
                };
            }
        } else {
            // start the selection
            return {
                ...zipper,
                row: {
                    ...currentRow,
                    left: left.slice(0, -1),
                    selection: {
                        dir: "left",
                        nodes: [prev],
                    },
                },
            };
        }

        // fallback behavior
        return zipper;
    }

    if (path.length > 0) {
        const {focus, row: parentRow} = path[path.length - 1];

        // TODO: handle if selection.dir === "right"
        // TODO: check if (left.length === 0) and if it is, go up a level

        const {left, selection, right} = parentRow;
        const prev = left[left.length - 1];

        if (selection?.dir === "right") {
            const newNodes = selection.nodes.slice(0, -1);
            return {
                row: currentRow,
                path: [
                    ...path.slice(0, -1),
                    {
                        focus: focus,
                        row: {
                            ...parentRow,
                            selection:
                                newNodes.length > 0
                                    ? {
                                          ...selection,
                                          nodes: newNodes,
                                      }
                                    : null,
                            right: [
                                selection.nodes[selection.nodes.length - 1],
                                ...right,
                            ],
                        },
                    },
                ],
            };
        }

        return {
            row: currentRow,
            path: [
                ...path.slice(0, -1),
                {
                    focus: focus,
                    row: {
                        ...parentRow,
                        left: left.slice(0, -1),
                        selection:
                            selection === null
                                ? {
                                      dir: "left",
                                      nodes: [prev],
                                  }
                                : {
                                      ...selection,
                                      nodes: [prev, ...selection.nodes],
                                  },
                    },
                },
            ],
        };
    }

    return zipper;
};

export const moveLeft = (zipper: Zipper, selecting?: boolean): Zipper => {
    return selecting ? selectionLeft(zipper) : cursorLeft(zipper);
};
