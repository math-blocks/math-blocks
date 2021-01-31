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
        const {left, right} = focus;

        const exitedRow: types.Row = util.zrowToRow(currentRow);

        // move between branches of the focus
        if (right) {
            return {
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
                row: util.startRow(right),
            };
        }

        // exit the focus to the right
        else {
            let updatedNode;
            switch (focus.type) {
                case "zsubsup": {
                    // right === null -> there is no superscript
                    updatedNode =
                        right === null
                            ? util.subsup(focus.id, exitedRow, null)
                            : util.subsup(focus.id, left ?? null, exitedRow);
                    break;
                }
                case "zfrac": {
                    updatedNode = util.frac(
                        focus.id,
                        left as types.Row,
                        exitedRow,
                    );
                    break;
                }
                case "zroot": {
                    updatedNode = util.root(focus.id, left || null, exitedRow);
                    break;
                }
                case "zlimits": // TODO
                    return zipper; // fallback
                default:
                    throw new UnreachableCaseError(focus);
            }
            return {
                path: [...path.slice(0, -1)],
                // place the subsup we exited on our left
                row: util.insertLeft(parentRow, updatedNode),
            };
        }
    }

    return zipper;
};
