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
        // move into row to the right
        else if (next.type !== "row") {
            const [leftChild, rightChild] = next.children;

            let focus: Focus;
            switch (next.type) {
                case "frac": {
                    focus = util.zfrac(next.id, "left", next.children[1]);
                    break;
                }
                case "subsup": {
                    focus = next.children[0]
                        ? util.zsubsup(next.id, "left", next.children[1])
                        : util.zsubsup(next.id, "right", next.children[0]);
                    break;
                }
                case "root": {
                    focus = next.children[0]
                        ? util.zroot(next.id, "left", next.children[1])
                        : util.zroot(next.id, "right", next.children[0]);
                    break;
                }
                case "limits":
                    focus = util.zlimits(
                        next.id,
                        "left",
                        next.children[1],
                        next.inner,
                    );
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
                if (focus.dir === "left") {
                    return focus.other
                        ? focusRight(focus.other)
                        : exitNode(
                              util.subsup(focus.id, exitedRow, focus.other),
                          );
                }
                return exitNode(util.subsup(focus.id, focus.other, exitedRow));
            case "zfrac":
                if (focus.dir === "left") {
                    return focusRight(focus.other);
                }
                return exitNode(util.frac(focus.id, focus.other, exitedRow));
            case "zroot":
                if (focus.dir === "left") {
                    return focusRight(focus.other);
                }
                return exitNode(util.root(focus.id, focus.other, exitedRow));
            case "zlimits":
                if (focus.dir === "left") {
                    return focus.other
                        ? focusRight(focus.other)
                        : exitNode(
                              util.limits(
                                  focus.id,
                                  exitedRow,
                                  focus.other,
                                  focus.inner,
                              ),
                          );
                }
                return exitNode(
                    util.limits(focus.id, focus.other, exitedRow, focus.inner),
                );
            default:
                throw new UnreachableCaseError(focus);
        }
    }

    return zipper;
};
