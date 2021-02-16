import {getId} from "@math-blocks/core";

import * as builders from "../builders";
import * as util from "./util";
import {Dir, Zipper} from "./types";

export const root = (zipper: Zipper, withIndex: boolean): Zipper => {
    return {
        ...zipper,
        breadcrumbs: [
            ...zipper.breadcrumbs,
            {
                row: zipper.row,
                focus: withIndex
                    ? {
                          id: getId(),
                          type: "zroot",
                          dir: Dir.Left,
                          other: builders.row([]),
                      }
                    : {
                          id: getId(),
                          type: "zroot",
                          dir: Dir.Right,
                          other: null,
                      },
            },
        ],
        row: util.newZRow(),
    };
};
