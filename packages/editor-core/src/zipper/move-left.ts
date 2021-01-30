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
                row: {
                    ...currentRow,
                    left: left.slice(0, -1), // left - prev
                },
                focus: {
                    id: prev.id,
                    type: "zfrac",
                    children: [numerator, undefined],
                },
            };
            return {
                path: [...path, breadcrumb],
                row: util.endRow(denominator), // [1, 2, ...] []
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
                const [numerator, denominator] = focus.children;

                // move from the denominator to the numerator
                if (numerator !== undefined) {
                    return {
                        path: [
                            ...path.slice(0, -1),
                            {
                                row: parentRow,
                                focus: {
                                    ...focus,
                                    children: [undefined, exitedRow],
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
            default: {
                return zipper;
            }
        }
    }

    return zipper;
};
