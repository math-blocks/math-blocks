import {UnreachableCaseError} from "@math-blocks/core";

import {Zipper, Breadcrumb} from "./types";
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

        // enter the numerator
        else if (next.type === "frac") {
            const [numerator, denominator] = next.children;
            const breadcrumb: Breadcrumb = {
                row: util.delRight(currentRow),
                focus: {
                    id: next.id,
                    type: "zfrac",
                    left: undefined,
                    right: denominator,
                },
            };
            return {
                path: [...path, breadcrumb],
                row: util.startRow(numerator), // [] [1, 2, ...]
            };
        }

        // enter the subscript if it exists then fallback to the superscript
        else if (next.type === "subsup") {
            const [subscript, superscript] = next.children;
            let breadcrumb: Breadcrumb;
            let focusedRow: types.Row;
            if (subscript) {
                breadcrumb = {
                    row: util.delRight(currentRow),
                    focus: {
                        id: next.id,
                        type: "zsubsup",
                        left: undefined, // subscript is focused
                        right: superscript,
                    },
                };
                focusedRow = subscript;
            } else if (superscript) {
                breadcrumb = {
                    row: util.delRight(currentRow),
                    focus: {
                        id: next.id,
                        type: "zsubsup",
                        left: null,
                        right: undefined, // superscript is focused
                    },
                };
                focusedRow = superscript;
            } else {
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
                    const [newLeft, newRight] =
                        // right === null -> there is no right branch
                        right === null
                            ? [exitedRow, null]
                            : [left ?? null, exitedRow];
                    updatedNode = util.subsup(focus.id, newLeft, newRight);
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
                case "zroot": // TODO
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
