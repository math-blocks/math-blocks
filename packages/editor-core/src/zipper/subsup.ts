import {getId} from "@math-blocks/core";

import * as util from "./util";
import {Zipper, ZRow} from "./types";

const newZRow = (): ZRow => ({
    id: getId(),
    type: "zrow",
    left: [],
    selection: null,
    right: [],
});

export const subsup = (zipper: Zipper, dir: "left" | "right"): Zipper => {
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
                        focus: {
                            id: next.id, // reuse the id of the subsup we're updating
                            type: "zsubsup",
                            dir: dir,
                            other: dir === "left" ? sup : sub,
                        },
                    },
                ],
                row:
                    dir === "left"
                        ? sub
                            ? util.startRow(sub)
                            : newZRow()
                        : sup
                        ? util.startRow(sup)
                        : newZRow(),
            };
        }
    }

    return {
        ...zipper,
        breadcrumbs: [
            ...zipper.breadcrumbs,
            {
                row: zipper.row,
                focus: {
                    id: getId(),
                    type: "zsubsup",
                    dir: dir,
                    other: null, // this is a new subsup so don't give it a sub
                },
            },
        ],
        row: newZRow(),
    };
};
