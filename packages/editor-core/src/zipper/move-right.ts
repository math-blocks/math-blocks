import {UnreachableCaseError} from "@math-blocks/core";

import {Breadcrumb, Focus, Zipper} from "./types";
import * as types from "../types";
import * as util from "./util";

export const moveRight = (zipper: Zipper): Zipper => {
    // the only time we ever have to deal with zipper.path is when we get to
    // the end of zipper.row
    const {row: currentRow, path} = zipper;

    const {left, right} = currentRow;

    if (right.length > 0) {
        const next = right[0]; // right.head

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
        else if (next.type !== "row") {
            const [leftChild, rightChild] = next.children;

            let focus: Focus;
            switch (next.type) {
                case "frac": {
                    focus = util.zfrac(next.id, undefined, next.children[1]);
                    break;
                }
                case "subsup": {
                    focus = leftChild
                        ? util.zsubsup(next.id, undefined, rightChild)
                        : util.zsubsup(next.id, null, undefined);
                    break;
                }
                case "root": {
                    focus = leftChild
                        ? util.zroot(next.id, undefined, next.children[1])
                        : util.zroot(next.id, null, undefined);
                    break;
                }
                default: {
                    throw new Error(`${next.type} case not handled`);
                }
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
                        left: exitedRow,
                        right: undefined, // focused
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
            case "zsubsup": {
                if (focus.right) {
                    return focusRight(focus.right);
                }
                return exitNode(
                    // right === null -> there is no superscript
                    focus.right === null
                        ? util.subsup(focus.id, exitedRow, null)
                        : util.subsup(focus.id, focus.left || null, exitedRow),
                );
            }
            case "zfrac": {
                if (focus.right) {
                    return focusRight(focus.right);
                }
                return exitNode(
                    util.frac(focus.id, focus.left as types.Row, exitedRow),
                );
            }
            case "zroot": {
                if (focus.right) {
                    return focusRight(focus.right);
                }
                return exitNode(
                    util.root(focus.id, focus.left || null, exitedRow),
                );
            }
            case "zlimits":
                if (focus.right) {
                    return focusRight(focus.right);
                }
                // TODO
                return zipper; // fallback
            default:
                throw new UnreachableCaseError(focus);
        }
    }

    return zipper;
};
