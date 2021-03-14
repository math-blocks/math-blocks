import {getId} from "@math-blocks/core";

import {Dir} from "./enums";
import {rezipSelection} from "./util";
import type {Zipper, Focus} from "./types";

export const slash = (zipper: Zipper): Zipper => {
    zipper = rezipSelection(zipper);
    const {left, selection} = zipper.row;

    if (selection) {
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

    // We don't include unary +/- in the numerator.  This mimic's mathquill's
    // behavior.
    const splitChars = [
        "+",
        "\u2212", // \minus
        "\u00B1", // \pm
        "\u00B7", // \times
        "=",
        "<",
        ">",
        "\u2264", // \leq
        "\u2265", // \geq
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

        if (child.type === "limits") {
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
