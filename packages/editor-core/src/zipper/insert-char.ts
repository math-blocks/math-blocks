import * as builders from "../builders";

import {canonicalizeSelection} from "./util";
import type {Zipper} from "./types";

// TODO: place cursor in lower limits
const LIMIT_CHARS = [
    "\u03a3", // \sum
    "\u03a0", // \prod
    "\u222B", // \int
    // TODO: handle \lim (need to make sure we exclude the upper limit)
];

export const insertChar = (zipper: Zipper, char: string): Zipper => {
    const {left, selection} = zipper.row;
    let newNode;
    if (LIMIT_CHARS.includes(char)) {
        newNode = builders.limits(builders.glyph(char), [], []);
    } else {
        newNode = builders.glyph(char);
    }

    if (selection) {
        const canonZipper = canonicalizeSelection(zipper);
        const {left, selection} = canonZipper.row;

        if (selection) {
            if (LIMIT_CHARS.includes(char)) {
                return {
                    ...canonZipper,
                    row: {
                        ...canonZipper.row,
                        selection: null,
                        left: [...left, newNode, ...selection.nodes],
                    },
                };
            } else {
                return {
                    ...canonZipper,
                    row: {
                        ...canonZipper.row,
                        selection: null,
                        left: [...left, newNode],
                    },
                };
            }
        }
    }

    return {
        ...zipper,
        row: {
            ...zipper.row,
            left: [...left, newNode],
        },
    };
};
