import * as builders from "../builders";

import {rezipSelection} from "./util";
import type {Zipper} from "./types";

// TODO: place cursor in lower limits
const LIMIT_CHARS = [
    "\u03a3", // \sum
    "\u03a0", // \prod
    "\u222B", // \int
    // TODO: handle \lim (need to make sure we exclude the upper limit)
];

export const insertChar = (zipper: Zipper, char: string): Zipper => {
    zipper = rezipSelection(zipper);
    const {left, selection} = zipper.row;
    let newNode;
    if (LIMIT_CHARS.includes(char)) {
        newNode = builders.limits(builders.glyph(char), [], []);
    } else {
        newNode = builders.glyph(char);
    }

    if (selection) {
        // When inserting limits, we move the current selection to the right
        // of the new node.
        const newLeft = LIMIT_CHARS.includes(char)
            ? [...left, newNode, ...selection.nodes]
            : [...left, newNode];

        return {
            ...zipper,
            row: {
                ...zipper.row,
                selection: null,
                left: newLeft,
            },
        };
    }

    return {
        ...zipper,
        row: {
            ...zipper.row,
            left: [...left, newNode],
        },
    };
};