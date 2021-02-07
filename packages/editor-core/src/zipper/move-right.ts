import {UnreachableCaseError} from "@math-blocks/core";

import {Breadcrumb, Focus, Zipper} from "./types";
import * as types from "../types";
import * as util from "./util";

export const moveRight = (zipper: Zipper, selecting: boolean): Zipper => {
    // the only time we ever have to deal with zipper.path is when we get to
    // the end of zipper.row
    const {row: currentRow, path} = zipper;

    const {left, selection, right} = currentRow;

    if (right.length > 0) {
        const next = right[0]; // right.head

        // widen selection to the right
        if (selecting) {
            return {
                ...zipper,
                row: {
                    ...currentRow,
                    selection: [...selection, next],
                    right: right.slice(1),
                },
            };
        }

        // exit the selection to the right
        if (selection.length > 0) {
            return {
                ...zipper,
                row: {
                    ...currentRow,
                    left: [...left, ...selection],
                    selection: [],
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
    if (!selecting && selection.length > 0) {
        return {
            ...zipper,
            row: {
                ...currentRow,
                left: [...left, ...selection],
                selection: [],
            },
        };
    }

    return zipper;
};
