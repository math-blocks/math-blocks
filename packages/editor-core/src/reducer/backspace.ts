import {glyph} from "../builders";

import {Dir} from "./enums";
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

        // TODO: iterate over the whole row so that we're placing the matching
        // pending parent in the correct place, e.g.
        // 1 + [2 + 3] + 4 -> 1 + [(2 + 3] + 4 -> 1 + [(2 + 3)] + 4
        // If we're deleting a paren, then delete the matching pending paren
        // if there is one.
        // TODO: when deleting one paren, make the matching paren pending if it
        // wasn't already so.
        if (prev.type === "atom") {
            let index;

            if (prev.value.char === "(") {
                // Find the nearest ')' to the right of the cursor and check if
                // it's pending.
                index = indexOfFirstUnmatchedCloser(right);

                if (isPending(right[index], ")")) {
                    return {
                        ...zipper,
                        row: {
                            ...zipper.row,
                            left: left.slice(0, -1),
                            right: [
                                ...right.slice(0, index),
                                ...right.slice(index + 1),
                            ],
                        },
                    };
                }

                // left.slice(0, -1) deletes the '(' just before the cursor
                index = indexOfLastUnmatchedOpener(left.slice(0, -1));
                const newLeft =
                    index !== -1
                        ? // find nearest '(' to the left of the cursor and
                          // insert the new '(' after it.
                          [
                              ...left.slice(0, index + 1),
                              glyph("(", true),
                              ...left.slice(index + 1, -1),
                          ]
                        : [glyph("(", true), ...left.slice(0, -1)];

                return {
                    ...zipper,
                    row: {
                        ...zipper.row,
                        left: newLeft,
                    },
                };
            } else if (prev.value.char === ")") {
                // Find the nearest '(' to the left of the cursor and check if
                // it's pending.
                // We use left.slice(0, -1) to skip over the closing paren that
                // we might be deleting.
                index = indexOfLastUnmatchedOpener(left.slice(0, -1));
                console.log(`index = ${index}`);

                if (isPending(left[index], "(")) {
                    return {
                        ...zipper,
                        row: {
                            ...zipper.row,
                            left: [
                                ...left.slice(0, index),
                                ...left.slice(index + 1, -1),
                            ],
                        },
                    };
                }

                // Find nearest ')' to the right of the cursor and insert the
                // new ')' before it.
                index = indexOfFirstUnmatchedCloser(right);
                const newRight =
                    index !== -1
                        ? [
                              ...right.slice(0, index),
                              glyph(")", true),
                              ...right.slice(index),
                          ]
                        : [...right, glyph(")", true)];

                return {
                    ...zipper,
                    row: {
                        ...zipper.row,
                        left: left.slice(0, -1),
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
