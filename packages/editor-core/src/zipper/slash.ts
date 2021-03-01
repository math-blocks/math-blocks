import {getId} from "@math-blocks/core";

import {Dir} from "./enums";
import {splitArrayAt} from "./array-util";
import {zipperToRow} from "./convert";
import type {Zipper, Focus} from "./types";

export const slash = (zipper: Zipper): Zipper => {
    const {left, selection} = zipper.row;

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

    // We don't include unary +/- in the numerator.  This mimic's mathquill's
    // behavior.
    const splitChars = [
        "+",
        "\u2212",
        "\u00B7",
        "=",
        "<",
        ">",
        "\u2264",
        "\u2265",
    ];

    let index = left.length - 1;
    let parenCount = 0;
    while (index >= 0) {
        const child = left[index];
        if (child.type === "atom" && child.value.char === ")") {
            parenCount++;
        }
        if (child.type === "atom" && child.value.char === "(") {
            parenCount--;
        }
        if (parenCount < 0) {
            break;
        }

        if (
            child.type === "atom" &&
            parenCount === 0 &&
            splitChars.includes(child.value.char)
        ) {
            break;
        }
        index--;
    }

    const focus: Focus = {
        type: "zfrac",
        id: getId(),
        dir: Dir.Right,
        other: {
            id: getId(),
            type: "row",
            children: left.slice(index + 1),
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
                row: {
                    ...zipper.row,
                    left: left.slice(0, index + 1),
                },
                focus,
            },
        ],
    };
};
