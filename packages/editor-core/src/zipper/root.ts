import {getId} from "@math-blocks/core";

import * as builders from "../builders";
import * as util from "./util";
import {Zipper} from "./types";

export const root = (zipper: Zipper, withIndex: boolean): Zipper => {
    return {
        ...zipper,
        path: [
            ...zipper.path,
            {
                row: zipper.row,
                focus: withIndex
                    ? {
                          id: getId(),
                          type: "zroot",
                          dir: "left",
                          other: builders.row([]),
                      }
                    : {
                          id: getId(),
                          type: "zroot",
                          dir: "right",
                          other: null,
                      },
            },
        ],
        row: util.newZRow(),
    };
};
