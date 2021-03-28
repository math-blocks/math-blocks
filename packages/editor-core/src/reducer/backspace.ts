import {glyph} from "../builders";

import {Dir} from "./enums";
import {insertAfterIndex, insertBeforeIndex, deleteIndex} from "./array-util";
import {rezipSelection} from "./util";
import {moveLeft} from "./move-left";
import {
    isPending,
    indexOfLastUnmatchedOpener,
    indexOfFirstUnmatchedCloser,
} from "./parens-util";

import type {Zipper} from "./types";

export const backspace = (zipper: Zipper): Zipper => {
    zipper = rezipSelection(zipper);
    const {selection} = zipper.row;

    if (selection) {
        return {
            ...zipper,
            row: {
                ...zipper.row,
                selection: null,
            },
        };
    }

    if (zipper.row.left.length > 0) {
        const {left, right} = zipper.row;
        const prev = left[left.length - 1];

        // Iterate over the whole row so that we're placing the matching
        // pending parent in the correct place, e.g.
        // 1 + [2 + 3] + 4 -> 1 + [(2 + 3] + 4 -> 1 + [(2 + 3)] + 4
        // If we're deleting a paren, then delete the matching pending paren
        // if there is one.
        // when deleting one paren, make the matching paren pending if it
        // wasn't already so.
        if (prev.type === "atom") {
            let index;

            if (prev.value.char === "(") {
                // Find the nearest ')' to the right of the cursor and check if
                // it's pending.
                index = indexOfFirstUnmatchedCloser(right);
                const leftWithoutPrevChar = left.slice(0, -1);

                if (isPending(right[index], ")")) {
                    return {
                        ...zipper,
                        row: {
                            ...zipper.row,
                            left: leftWithoutPrevChar,
                            right: deleteIndex(right, index),
                        },
                    };
                }

                index = indexOfLastUnmatchedOpener(leftWithoutPrevChar);
                const pendingOpenParen = glyph("(", true);
                const newLeft =
                    index !== -1
                        ? insertAfterIndex(
                              leftWithoutPrevChar,
                              pendingOpenParen,
                              index,
                          )
                        : [pendingOpenParen, ...leftWithoutPrevChar];

                return {
                    ...zipper,
                    row: {
                        ...zipper.row,
                        left: newLeft,
                    },
                };
            } else if (prev.value.char === ")") {
                const leftWithoutPrevChar = left.slice(0, -1);
                // Find the nearest '(' to the left of the cursor and check if
                // it's pending.
                index = indexOfLastUnmatchedOpener(leftWithoutPrevChar);

                if (isPending(left[index], "(")) {
                    return {
                        ...zipper,
                        row: {
                            ...zipper.row,
                            left: deleteIndex(leftWithoutPrevChar, index),
                        },
                    };
                }

                // Find nearest ')' to the right of the cursor and insert the
                // new ')' before it.
                index = indexOfFirstUnmatchedCloser(right);
                const pendingCloseParen = glyph(")", true);
                const newRight =
                    index !== -1
                        ? insertBeforeIndex(right, pendingCloseParen, index)
                        : [...right, pendingCloseParen];

                return {
                    ...zipper,
                    row: {
                        ...zipper.row,
                        left: leftWithoutPrevChar,
                        right: newRight,
                    },
                };
            }
        } else {
            return moveLeft(zipper);
        }

        return {
            ...zipper,
            row: {
                ...zipper.row,
                left: zipper.row.left.slice(0, -1),
            },
        };
    }

    const {breadcrumbs} = zipper;

    if (breadcrumbs.length === 0) {
        return zipper;
    }

    const parent = breadcrumbs[breadcrumbs.length - 1];

    const {focus, row} = parent;

    const children = focus.other ? focus.other.children : [];

    if (focus.dir === Dir.Left) {
        return {
            breadcrumbs: breadcrumbs.slice(0, -1),
            row: {
                ...row,
                right: [...zipper.row.right, ...children, ...row.right],
            },
        };
    } else {
        if (focus.type === "zsubsup" && focus.other) {
            return {
                breadcrumbs: breadcrumbs.slice(0, -1),
                row: {
                    ...row,
                    left: [
                        ...row.left,
                        {
                            id: focus.id,
                            type: "subsup",
                            children: [focus.other, null],
                        },
                    ],
                    right: [...zipper.row.right, ...row.right],
                },
            };
        }

        return {
            breadcrumbs: breadcrumbs.slice(0, -1),
            row: {
                ...row,
                left: [...row.left, ...children],
                right: [...zipper.row.right, ...row.right],
            },
        };
    }
};
