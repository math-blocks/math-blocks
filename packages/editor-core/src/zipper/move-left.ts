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

        const focusLeft = (row: types.Row): Zipper => ({
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
            row: util.endRow(row),
        });

        const exitNode = (updatedNode: types.Node): Zipper => ({
            path: [...path.slice(0, -1)],
            // place the fraction we exited on our right
            row: util.insertRight(parentRow, updatedNode),
        });

        switch (focus.type) {
            case "zsubsup": {
                if (focus.left) {
                    return focusLeft(focus.left);
                }
                // left === null -> there is no subscript
                return exitNode(
                    left === null
                        ? util.subsup(focus.id, null, exitedRow)
                        : util.subsup(focus.id, exitedRow, right || null),
                );
            }
            case "zfrac": {
                if (focus.left) {
                    return focusLeft(focus.left);
                }
                return exitNode(
                    util.frac(focus.id, exitedRow, right as types.Row),
                );
            }
            case "zroot": {
                if (focus.left) {
                    return focusLeft(focus.left);
                }
                return exitNode(
                    left === null
                        ? util.root(focus.id, null, exitedRow)
                        : util.root(focus.id, exitedRow, right as types.Row),
                );
            }
            case "zlimits":
                if (focus.left) {
                    return focusLeft(focus.left);
                }
                // TODO
                return zipper; // fallback
            default:
                throw new UnreachableCaseError(focus);
        }
    }

    return zipper;
};
