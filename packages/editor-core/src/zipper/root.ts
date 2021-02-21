import {getId} from "@math-blocks/core";

import * as builders from "../builders";

import * as util from "./util";
import {Dir} from "./enums";
import {splitArrayAt} from "./array-util";
import {zipperToRow} from "./convert";
import type {Zipper, ZRow, Focus} from "./types";

export const root = (zipper: Zipper, withIndex: boolean): Zipper => {
    const {selection} = zipper.row;

    const focus: Focus = withIndex
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
          };

    if (selection) {
        const index = zipper.breadcrumbs.findIndex(
            (crumb) => crumb.row.selection !== null,
        );

        // Cursor is at the same level of the top-most selection
        if (index === -1) {
            const radicand: ZRow = {
                id: getId(),
                type: "zrow",
                left: selection.nodes,
                selection: null,
                right: [],
            };

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

        // TODO: figure out how to transform this case to the look the same as
        // the `index === -1` case.
        // Cursor started deeper than the top-most selection
        const [restCrumbs, topCrumbs] = splitArrayAt(zipper.breadcrumbs, index);

        const radicand = zipperToRow({
            row: zipper.row,
            breadcrumbs: [
                {
                    ...topCrumbs[0],
                    row: {
                        // Drop the left/right branches of the top crumb
                        ...topCrumbs[0].row,
                        left: [],
                        right: [],
                    },
                },
                ...topCrumbs.slice(1),
            ],
        });

        return {
            ...zipper,
            row: {
                id: getId(), // We can't reuse the id from zipper.row since this is a new node
                type: "zrow",
                left: radicand.children,
                selection: null,
                right: [],
            },
            breadcrumbs: [
                ...restCrumbs,
                {
                    // Drop the selection of the top crumb
                    row: {
                        ...topCrumbs[0].row,
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
        row: util.newZRow(),
    };
};
