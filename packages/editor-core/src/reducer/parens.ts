import * as builders from "../builders";

import {Dir} from "./enums";
import {deleteIndex, insertAfterIndex, insertBeforeIndex} from "./array-util";
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

    const openParen = builders.glyph("(");
    const closeParen = builders.glyph(")");

    if (selection) {
        if (dir === Dir.Left) {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left, openParen],
                    right: [...selection.nodes, closeParen, ...right],
                    selection: null,
                },
            };
        } else {
            return {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [...left, openParen, ...selection.nodes, closeParen],
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
                    left: [...deleteIndex(left, index), builders.glyph("(")],
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
                    right: deleteIndex(right, index),
                },
            };
        }
    }

    if (dir === Dir.Left) {
        closeParen.value.pending = true;

        const index = indexOfFirstUnmatchedCloser(right);

        const newRight =
            index !== -1
                ? insertBeforeIndex(right, closeParen, index)
                : [...right, closeParen];

        return {
            ...zipper,
            row: {
                ...zipper.row,
                left: [...left, openParen],
                right: newRight,
            },
        };
    } else {
        openParen.value.pending = true;

        const index = indexOfLastUnmatchedOpener(left);

        const newLeft =
            index !== -1
                ? [...insertAfterIndex(left, openParen, index), closeParen]
                : [openParen, ...left, closeParen];

        return {
            ...zipper,
            row: {
                ...zipper.row,
                left: newLeft,
            },
        };
    }
};
