import {getId} from "@math-blocks/core";

import {zrow} from "./util";
import type {Zipper, Focus, State} from "./types";

// TODO: dedupe with isOperator in typeset.ts
const isOperator = (char: string): boolean => {
    // We don't include unary +/- in the numerator.  This mimic's mathquill's
    // behavior.
    const operators = [
        "+",
        "\u2212", // \minus
        "\u00B1", // \pm
        "\u00B7", // \times
        "=",
        "<",
        ">",
        "\u2260", // \neq
        "\u2265", // \geq
        "\u2264", // \leq
    ];

    if (operators.includes(char)) {
        return true;
    }

    const charCode = char.charCodeAt(0);

    // Arrows
    if (charCode >= 0x2190 && charCode <= 0x21ff) {
        return true;
    }

    return false;
};

export const slash = (state: State): State => {
    // TODO: change this to const {zipper} = state.zipper; once we've added it
    const zipper = state.zipper;
    const {left, selection} = zipper.row;

    if (selection.length > 0) {
        const focus: Focus = {
            type: "zfrac",
            id: getId(),
            left: [
                {
                    id: getId(),
                    type: "row",
                    children: selection,
                    style: {},
                },
            ],
            right: [],
            style: {},
        };

        const newZipper: Zipper = {
            ...zipper,
            row: zrow(getId(), [], []),
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
                    focus,
                },
            ],
        };

        return {
            startZipper: newZipper,
            endZipper: newZipper,
            zipper: newZipper,
            selecting: false,
        };
    }

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
            isOperator(child.value.char)
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
        left: [
            {
                id: getId(),
                type: "row",
                children: left.slice(index + 1),
                style: {},
            },
        ],
        right: [],
        style: {},
    };

    const newZipper: Zipper = {
        ...zipper,
        row: zrow(getId(), [], []),
        breadcrumbs: [
            ...zipper.breadcrumbs,
            {
                row: {
                    type: "bcrow",
                    id: zipper.row.id,
                    left: left.slice(0, index + 1),
                    right: zipper.row.right,
                    style: zipper.row.style,
                },
                focus,
            },
        ],
    };

    return {
        startZipper: newZipper,
        endZipper: newZipper,
        zipper: newZipper,
        selecting: false,
    };
};
