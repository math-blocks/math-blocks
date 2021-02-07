import * as builders from "../builders";

import {Zipper} from "./types";

export const parens = (zipper: Zipper, dir: "left" | "right"): Zipper => {
    const leftParen = builders.glyph("(");
    const rightParen = builders.glyph(")");

    const {left, right} = zipper.row;

    // TODO: iterate over all of the glyphs in the row to ensure that we're
    // removing the correct matching paren.
    // Get rid of matching pending paren when inserting a matching paren for real.
    if (dir === "right") {
        const last = right[right.length - 1];
        if (
            last &&
            last.type === "atom" &&
            last.value.char === ")" &&
            last.value.pending
        ) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left, rightParen],
                    right: right.slice(0, -1),
                },
            };
        }
    } else {
        const first = left[0];
        if (
            first &&
            first.type === "atom" &&
            first.value.char === "(" &&
            first.value.pending
        ) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left.slice(1), leftParen],
                },
            };
        }
    }

    if (dir === "left") {
        rightParen.value.pending = true;
    } else {
        leftParen.value.pending = true;
    }

    return {
        ...zipper,
        row:
            dir === "left"
                ? {
                      ...zipper.row,
                      left: [...left, leftParen],
                      right: [...right, rightParen],
                  }
                : {
                      ...zipper.row,
                      left: [leftParen, ...left, rightParen],
                  },
    };
};
