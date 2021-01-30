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
                        right: undefined,
                    },
                };
                focusedRow = superscript;
            } else if (subscript) {
                breadcrumb = {
                    row: util.delLeft(currentRow),
                    focus: {
                        id: prev.id,
                        type: "zsubsup",
                        left: undefined,
                        right: superscript,
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

        const exitedRow: types.Row = util.zrowToRow(currentRow);

        switch (focus.type) {
            case "zfrac": {
                const {left: numerator, right: denominator} = focus;

                // move from the denominator to the numerator
                if (numerator !== undefined) {
                    return {
                        path: [
                            ...path.slice(0, -1),
                            {
                                row: parentRow,
                                focus: {
                                    ...focus,
                                    left: undefined,
                                    right: exitedRow,
                                },
                            },
                        ],
                        row: util.endRow(numerator),
                    };
                }

                // exit the fraction to the left
                else if (denominator !== undefined) {
                    const numerator = exitedRow;
                    return {
                        path: [...path.slice(0, -1)],
                        // place the fraction we exited on our right
                        row: util.insertRight(
                            parentRow,
                            util.frac(focus.id, numerator, denominator),
                        ),
                    };
                }

                // we should never be able to get here... but how to prove that
                // to typescript is another question

                return zipper;
            }

            case "zsubsup": {
                const {left: subscript, right: superscript} = focus;

                // move into the subscript
                if (subscript) {
                    return {
                        path: [
                            ...path.slice(0, -1),
                            {
                                row: parentRow,
                                focus: {
                                    ...focus,
                                    left: undefined,
                                    right: exitedRow,
                                },
                            },
                        ],
                        row: util.endRow(subscript),
                    };
                }

                // exit the subsup to the left
                else {
                    return {
                        path: [...path.slice(0, -1)],
                        // place the fraction we exited on our right
                        row: util.insertRight(
                            parentRow,
                            util.subsup(
                                focus.id,
                                // subscript === null -> there is no subscript
                                subscript === null ? null : exitedRow,
                                subscript === null
                                    ? exitedRow
                                    : superscript ?? null,
                            ),
                        ),
                    };
                }
            }

            default: {
                return zipper;
            }
        }
    }

    return zipper;
};
