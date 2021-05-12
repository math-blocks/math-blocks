import {getId} from "@math-blocks/core";

import * as util from "./util";
import type {Zipper} from "./types";

export const subsup = (zipper: Zipper, dir: 0 | 1): Zipper => {
    const {row, breadcrumbs} = zipper;

    if (row.right.length > 0) {
        const [next, ...rest] = row.right;

        if (next.type === "subsup") {
            const [sub, sup] = next.children;

            return {
                ...zipper,
                breadcrumbs: [
                    ...breadcrumbs,
                    {
                        row: {
                            ...row,
                            right: rest,
                        },
                        focus: util.zsubsup(next, dir),
                    },
                ],
                row:
                    dir === 0
                        ? sub
                            ? util.zrow(sub.id, [], sub.children)
                            : util.zrow(getId(), [], [])
                        : sup
                        ? util.zrow(sup.id, [], sup.children)
                        : util.zrow(getId(), [], []),
            };
        }
    }

    return {
        ...zipper,
        breadcrumbs: [
            ...zipper.breadcrumbs,
            {
                row: zipper.row,
                focus:
                    dir === 0
                        ? {
                              id: getId(),
                              type: "zsubsup",
                              left: [],
                              right: [null],
                          }
                        : {
                              id: getId(),
                              type: "zsubsup",
                              left: [null],
                              right: [],
                          },
            },
        ],
        row: util.zrow(getId(), [], []),
    };
};
