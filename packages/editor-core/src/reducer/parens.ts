import * as builders from "../builders";

import {Dir} from "./enums";
import {rezipSelection} from "./util";
import {
    isPending,
    indexOfLastUnmatchedOpener,
    indexOfFirstUnmatchedCloser,
} from "./parens-util";

import type {Zipper} from "./types";

export const parens = (zipper: Zipper, dir: Dir): Zipper => {
    zipper = rezipSelection(zipper);
    const {left, selection, right} = zipper.row;

    const leftParen = builders.glyph("(");
    const rightParen = builders.glyph(")");

    if (selection) {
        if (dir === Dir.Left) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left, leftParen],
                    right: [...selection.nodes, rightParen, ...right],
                    selection: null,
                },
            };
        } else {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left, leftParen, ...selection.nodes, rightParen],
                    selection: null,
                },
            };
        }
    }

    // TODO: iterate over all of the glyphs in the row to ensure that we're
    // removing the correct matching paren.
    // Get rid of matching pending paren when inserting a matching paren for real.
    if (dir === Dir.Left) {
        const index = indexOfLastUnmatchedOpener(left);

        if (isPending(left[index], "(")) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [
                        ...left.slice(0, index),
                        ...left.slice(index + 1),
                        builders.glyph("("),
                    ],
                },
            };
        }
    } else {
        const index = indexOfFirstUnmatchedCloser(right);

        if (isPending(right[index], ")")) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left, builders.glyph(")")],
                    right: [
                        ...right.slice(0, index),
                        ...right.slice(index + 1),
                    ],
                },
            };
        }
    }

    if (dir === Dir.Left) {
        rightParen.value.pending = true;

        const index = indexOfFirstUnmatchedCloser(right);

        const newRight =
            index !== -1
                ? [...right.slice(0, index), rightParen, ...right.slice(index)]
                : [...right, rightParen];

        return {
            ...zipper,
            row: {
                ...zipper.row,
                left: [...left, leftParen],
                right: newRight,
            },
        };
    } else {
        leftParen.value.pending = true;

        const index = indexOfLastUnmatchedOpener(left);

        const newLeft =
            index !== -1
                ? [
                      ...left.slice(0, index + 1),
                      leftParen,
                      ...left.slice(index + 1),
                      rightParen,
                  ]
                : [leftParen, ...left, rightParen];

        return {
            ...zipper,
            row: {
                ...zipper.row,
                left: newLeft,
            },
        };
    }
};
