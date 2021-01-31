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

    return zipper;
};
