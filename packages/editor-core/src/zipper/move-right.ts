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
                    children: [undefined, denominator],
                },
            };
            return {
                path: [...path, breadcrumb],
                row: util.startRow(numerator), // [] [1, 2, ...]
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
                const [numerator, denominator] = focus.children;

                // move from the numerator into the denonimator
                if (denominator !== undefined) {
                    return {
                        path: [
                            ...path.slice(0, -1),
                            {
                                row: parentRow,
                                focus: {
                                    ...focus,
                                    children: [exitedRow, undefined],
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
            default: {
                return zipper;
            }
        }
    }

    return zipper;
};
