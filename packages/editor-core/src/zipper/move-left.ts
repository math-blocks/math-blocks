import {UnreachableCaseError} from "@math-blocks/core";

import {Zipper, Breadcrumb} from "./types";
import * as types from "../types";
import * as util from "./util";

export const moveLeft = (zipper: Zipper): Zipper => {
    // the only time we ever have to deal with zipper.path is when we get to
    // the end of zipper.row
    const {row: currentRow, path} = zipper;

    const {left, right} = currentRow;

    if (left.length > 0) {
        const prev = left[left.length - 1];

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

        // enter the denominator
        else if (prev.type === "frac") {
            const [numerator, denominator] = prev.children;
            const breadcrumb: Breadcrumb = {
                row: util.delLeft(currentRow),
                focus: {
                    id: prev.id,
                    type: "zfrac",
                    left: numerator,
                    right: undefined,
                },
            };
            return {
                path: [...path, breadcrumb],
                row: util.endRow(denominator), // [1, 2, ...] []
            };
        }

        // enter the superscript if it exists then fallback to the subscript
        else if (prev.type === "subsup") {
            const [subscript, superscript] = prev.children;
            let breadcrumb: Breadcrumb;
            let focusedRow: types.Row;
            if (superscript) {
                breadcrumb = {
                    row: util.delLeft(currentRow),
                    focus: {
                        id: prev.id,
                        type: "zsubsup",
                        left: subscript,
                        right: undefined, // superscript is focused
                    },
                };
                focusedRow = superscript;
            } else if (subscript) {
                breadcrumb = {
                    row: util.delLeft(currentRow),
                    focus: {
                        id: prev.id,
                        type: "zsubsup",
                        left: undefined, // subscript is focused
                        right: null,
                    },
                };
                focusedRow = subscript;
            } else {
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
        const {left, right} = focus;

        const exitedRow: types.Row = util.zrowToRow(currentRow);

        // move between branches of the focus
        if (left) {
            return {
                path: [
                    ...path.slice(0, -1),
                    {
                        row: parentRow,
                        focus: {
                            ...focus,
                            left: undefined, // focus
                            right: exitedRow,
                        },
                    },
                ],
                row: util.endRow(left),
            };
        }

        // exit the focus to the left
        else {
            let updatedNode;
            switch (focus.type) {
                case "zsubsup": {
                    const [newLeft, newRight] =
                        // left === null -> there is no left branch
                        left === null
                            ? [null, exitedRow]
                            : [exitedRow, right ?? null];
                    updatedNode = util.subsup(focus.id, newLeft, newRight);
                    break;
                }
                case "zfrac": {
                    updatedNode = util.frac(
                        focus.id,
                        exitedRow,
                        right as types.Row,
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
                // place the fraction we exited on our right
                row: util.insertRight(parentRow, updatedNode),
            };
        }
    }

    return zipper;
};
