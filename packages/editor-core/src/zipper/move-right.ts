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
                        left: subscript,
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

        // We're exiting currentRow so convert it back to a regular Row.
        const exitedRow: types.Row = util.zrowToRow(currentRow);

        switch (focus.type) {
            case "zfrac": {
                const {left: numerator, right: denominator} = focus;

                // move from the numerator into the denonimator
                if (denominator !== undefined) {
                    return {
                        path: [
                            ...path.slice(0, -1),
                            {
                                row: parentRow,
                                focus: {
                                    ...focus,
                                    left: exitedRow,
                                    right: undefined,
                                },
                            },
                        ],
                        row: util.startRow(denominator),
                    };
                }

                // exit the fraction to the right
                else if (numerator !== undefined) {
                    const denominator = exitedRow;
                    return {
                        path: [...path.slice(0, -1)],
                        // place the fraction we exited on our left
                        row: util.insertLeft(
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

                // move into the superscript
                if (superscript) {
                    return {
                        path: [
                            ...path.slice(0, -1),
                            {
                                row: parentRow,
                                focus: {
                                    ...focus,
                                    left: exitedRow,
                                    right: undefined,
                                },
                            },
                        ],
                        row: util.startRow(superscript),
                    };
                }

                // exit the subsup to the right
                else {
                    return {
                        path: [...path.slice(0, -1)],
                        // place the subsup we exited on our left
                        row: util.insertLeft(
                            parentRow,
                            util.subsup(
                                focus.id,
                                // superscript === null -> there is no superscript
                                superscript === null
                                    ? exitedRow
                                    : subscript ?? null,
                                superscript === null ? null : exitedRow,
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
