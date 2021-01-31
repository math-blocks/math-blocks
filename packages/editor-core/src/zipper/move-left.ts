import {UnreachableCaseError} from "@math-blocks/core";

import {Breadcrumb, Focus, Zipper} from "./types";
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

        // Rows should only be used as children of non-rows
        else if (prev.type !== "row") {
            const [leftChild, rightChild] = prev.children;

            let focus: Focus;
            switch (prev.type) {
                case "frac": {
                    focus = util.zfrac(prev.id, prev.children[0], undefined);
                    break;
                }
                case "subsup": {
                    focus = rightChild
                        ? util.zsubsup(prev.id, leftChild, undefined)
                        : util.zsubsup(prev.id, undefined, null);
                    break;
                }
                case "root": {
                    focus = util.zroot(prev.id, leftChild, undefined);
                    break;
                }
                default: {
                    throw new Error(`${prev.type} case not handled`);
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
                    // left === null -> there is no subscript
                    updatedNode =
                        left === null
                            ? util.subsup(focus.id, null, exitedRow)
                            : util.subsup(focus.id, exitedRow, right ?? null);
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
                case "zroot": {
                    const [newLeft, newRight] =
                        left === null
                            ? [null, exitedRow]
                            : [exitedRow, right as types.Row];
                    updatedNode = util.root(focus.id, newLeft, newRight);
                    break;
                }
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
