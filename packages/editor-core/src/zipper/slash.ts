import {getId} from "@math-blocks/core";

import {Dir} from "./enums";
import {splitArrayAt} from "./array-util";
import {zipperToRow} from "./convert";
import type {Zipper, Focus} from "./types";

export const slash = (zipper: Zipper): Zipper => {
    const {selection} = zipper.row;

    if (selection) {
        const index = zipper.breadcrumbs.findIndex(
            (crumb) => crumb.row.selection !== null,
        );

        // Cursor is at the same level of the top-most selection
        if (index === -1) {
            const focus: Focus = {
                type: "zfrac",
                id: getId(),
                dir: Dir.Right,
                other: {
                    id: getId(),
                    type: "row",
                    children: selection.nodes,
                },
            };

            return {
                ...zipper,
                row: {
                    type: "zrow",
                    id: getId(),
                    left: [],
                    selection: null,
                    right: [],
                },
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

        // Cursor started deeper than the top-most selection
        const [restCrumbs, topCrumbs] = splitArrayAt(zipper.breadcrumbs, index);

        const numerator = zipperToRow({
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

        const focus: Focus = {
            type: "zfrac",
            id: getId(),
            dir: Dir.Right,
            other: numerator,
        };

        return {
            ...zipper,
            row: {
                id: getId(), // We can't reuse the id from zipper.row since this is a new node
                type: "zrow",
                left: [],
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

    const focus: Focus = {
        type: "zfrac",
        id: getId(),
        dir: Dir.Right,
        other: {
            id: getId(),
            type: "row",
            children: [], // TODO: populate this with nodes from zipper.row.left
        },
    };

    return {
        ...zipper,
        row: {
            id: getId(),
            type: "zrow",
            left: [],
            selection: null,
            right: [],
        },
        breadcrumbs: [
            ...zipper.breadcrumbs,
            {
                row: zipper.row,
                focus,
            },
        ],
    };
};
