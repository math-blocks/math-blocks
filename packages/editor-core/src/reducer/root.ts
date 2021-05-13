import {getId} from "@math-blocks/core";

import * as builders from "../builders";

import * as util from "./util";
import type {Zipper, Focus} from "./types";

export const root = (zipper: Zipper, withIndex: boolean): Zipper => {
    zipper = util.rezipSelection(zipper);
    const {selection} = zipper.row;

    const focus: Focus = withIndex
        ? {
              id: getId(),
              type: "zroot",
              left: [],
              right: [builders.row([])],
          }
        : {
              id: getId(),
              type: "zroot",
              left: [null],
              right: [],
          };

    if (selection) {
        const radicand = util.zrow(getId(), selection.nodes, []);

        return {
            ...zipper,
            row: radicand,
            breadcrumbs: [
                ...zipper.breadcrumbs,
                {
                    row: {
                        ...zipper.row,
                        selection: null,
                    },
                    focus,
                },
            ],
        };
    }

    return {
        ...zipper,
        breadcrumbs: [
            ...zipper.breadcrumbs,
            {
                row: zipper.row,
                focus,
            },
        ],
        row: util.zrow(getId(), [], []),
    };
};
