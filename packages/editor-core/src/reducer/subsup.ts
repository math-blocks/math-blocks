import {getId} from "@math-blocks/core";

import {zrow, zsubsup} from "./util";
import type {Zipper} from "./types";

/**
 * Add a new subscript or superscript or navigate into an existing one.
 *
 * @param {Zipper} zipper
 * @param {0 | 1} index 0 = subscript, 1 = superscript
 */
export const subsup = (zipper: Zipper, index: 0 | 1): Zipper => {
    const {row, breadcrumbs} = zipper;

    // The selection will be inserted at the start of the new/existing
    // subscript/superscript.
    const selection = zipper.row.selection;

    // If there's something to the right of the cursor...
    if (row.right.length > 0) {
        const [next, ...rest] = row.right;

        // ...check if it's a subsup and...
        if (next.type === "subsup") {
            const [sub, sup] = next.children;

            return {
                ...zipper,
                breadcrumbs: [
                    ...breadcrumbs,
                    {
                        row: {
                            type: "bcrow",
                            id: row.id,
                            left: row.left,
                            right: rest,
                            style: row.style,
                        },
                        focus: zsubsup(next, index),
                    },
                ],
                row:
                    index === 0
                        ? sub
                            ? // ...navigate into the existing subscript
                              zrow(sub.id, selection, sub.children)
                            : // ...add a subscript to the existing subsup
                              zrow(getId(), selection, [])
                        : sup
                        ? // ...navigate into the existing superscript
                          zrow(sup.id, selection, sup.children)
                        : // ...add a superscript to the existing subsup
                          zrow(getId(), selection, []),
            };
        }
    }

    return {
        ...zipper,
        breadcrumbs: [
            ...zipper.breadcrumbs,
            {
                row: {
                    type: "bcrow",
                    id: zipper.row.id,
                    left: zipper.row.left,
                    right: zipper.row.right,
                    style: zipper.row.style,
                },
                focus:
                    index === 0
                        ? {
                              id: getId(),
                              type: "zsubsup",
                              left: [],
                              right: [null],
                              style: {},
                          }
                        : {
                              id: getId(),
                              type: "zsubsup",
                              left: [null],
                              right: [],
                              style: {},
                          },
            },
        ],
        row: zrow(getId(), selection, []),
    };
};
