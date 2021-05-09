import {getId} from "@math-blocks/core";

import {rezipSelection, zrow} from "./util";
import type {Zipper, Focus} from "./types";

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

export const slash = (zipper: Zipper): Zipper => {
    zipper = rezipSelection(zipper);
    const {left, selection} = zipper.row;

    if (selection) {
        const focus: Focus = {
            type: "zfrac",
            id: getId(),
            dir: 1,
            other: {
                id: getId(),
                type: "row",
                children: selection.nodes,
            },
        };

        return {
            ...zipper,
            row: zrow(getId(), [], []),
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
        dir: 1,
        other: {
            id: getId(),
            type: "row",
            children: left.slice(index + 1),
        },
    };

    return {
        ...zipper,
        row: zrow(getId(), [], []),
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
