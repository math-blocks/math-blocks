import * as builders from "../ast/builders";
import * as types from "../ast/types";

import {moveRight} from "./move-right";

import type {Zipper, State, ZDelimited} from "./types";

type Delimiters = "(" | ")" | "[" | "]" | "{" | "}" | "|";

const leftGlyphMap = {
    "(": "(",
    ")": "(",
    "{": "{",
    "}": "{",
    "[": "[",
    "]": "[",
    "|": "|",
};

const rightGlyphMap = {
    "(": ")",
    ")": ")",
    "{": "}",
    "}": "}",
    "[": "]",
    "]": "]",
    "|": "|",
};

const makePermanent = <T extends ZDelimited | types.Delimited>(
    focusOrNode: T,
    delim: "leftDelim" | "rightDelim",
): T => {
    const atom = focusOrNode[delim];
    return {
        ...focusOrNode,
        [delim]: {
            ...atom,
            value: {
                ...atom.value,
                pending: false,
            },
        },
    };
};

const maybeFinishLeft = (zipper: Zipper): Zipper | null => {
    const {breadcrumbs} = zipper;
    const last = breadcrumbs[breadcrumbs.length - 1];

    if (
        !last ||
        last.focus.type !== "zdelimited" ||
        !last.focus.leftDelim.value.pending
    ) {
        return null;
    }

    // Move everything to the left of the cursor outside the
    // "delimited" node.
    const newZipper: Zipper = {
        ...zipper,
        breadcrumbs: [
            ...breadcrumbs.slice(0, -1),
            {
                ...last,
                row: {
                    ...last.row,
                    // update last.row.left
                    left: [...last.row.left, ...zipper.row.left],
                },
                focus: makePermanent(last.focus, "leftDelim"),
            },
        ],
        row: {
            ...zipper.row,
            left: [],
        },
    };
    return newZipper;
};

const stateFromZipper = (zipper: Zipper): State => {
    return {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
    };
};

const maybeFinishRight = (zipper: Zipper): Zipper | null => {
    const {breadcrumbs} = zipper;
    const last = breadcrumbs[breadcrumbs.length - 1];

    if (
        !last ||
        last.focus.type !== "zdelimited" ||
        !last.focus.rightDelim.value.pending
    ) {
        return null;
    }

    // Move everything to the right of the cursor outside the
    // "delimited" node.
    const newZipper: Zipper = {
        ...zipper,
        breadcrumbs: [
            ...breadcrumbs.slice(0, -1),
            {
                ...last,
                row: {
                    ...last.row,
                    // update last.row.right
                    right: [...zipper.row.right, ...last.row.right],
                },
                focus: makePermanent(last.focus, "rightDelim"),
            },
        ],
        row: {
            ...zipper.row,
            right: [],
        },
    };
    return newZipper;
};

export const parens = (state: State, char: Delimiters): State => {
    const zipper = state.zipper;
    const {left, selection, right} = zipper.row;

    const leftParen = builders.glyph(leftGlyphMap[char]);
    const rightParen = builders.glyph(rightGlyphMap[char]);

    if (selection.length > 0) {
        if (leftParen.value.char === char) {
            const newZipper: Zipper = {
                ...zipper,
                row: {
                    ...zipper.row,
                    right: [
                        builders.delimited(selection, leftParen, rightParen),
                        ...right,
                    ],
                    selection: [],
                },
            };

            // This places the cursor inside the the new `delimited` node to
            // the left of all nodes inside of it.
            return moveRight(stateFromZipper(newZipper));
        }

        const newZipper: Zipper = {
            ...zipper,
            row: {
                ...zipper.row,
                left: [
                    ...left,
                    builders.delimited(selection, leftParen, rightParen),
                ],
                selection: [],
            },
        };

        return stateFromZipper(newZipper);
    }

    if (leftParen.value.char === char) {
        // If we're inside a row inside of a "delimited" node, check if the
        // opening paren is pending, if it is, re-adjust the size of the
        // "delimited" node and make the opening paren non-pending
        const {breadcrumbs} = zipper;
        if (breadcrumbs.length > 0) {
            // "|" is a special case.  The left and right delims are the same
            // so we always are either creating a new delimited node to the
            // right or finishing an existing one on the right.
            const newZipper =
                maybeFinishLeft(zipper) ||
                (char === "|" && maybeFinishRight(zipper));

            if (newZipper) {
                const state = stateFromZipper(newZipper);
                return char === "|" ? moveRight(state) : state;
            }
        }

        // If we're immediately to the left of a "delimited" node where then
        // leftDelim is pending.  Make the delim non-pending and move into
        // the "delimited" node.
        const next = right[0];
        if (next?.type === "delimited" && next.leftDelim.value.pending) {
            const nonPending: Zipper = {
                ...zipper,
                row: {
                    ...zipper.row,
                    right: [
                        makePermanent(next, "leftDelim"),
                        ...right.slice(1),
                    ],
                },
            };

            return moveRight(stateFromZipper(nonPending));
        }

        rightParen.value.pending = true;

        // Create a new "delimited" node
        const withParens: Zipper = {
            ...zipper,
            row: {
                ...zipper.row,
                right: [builders.delimited(right, leftParen, rightParen)],
            },
        };

        return moveRight(stateFromZipper(withParens));
    } else {
        // If we're inside a row inside of a "delimited" node, check if the
        // closing paren is pending, if it is, re-adjust the size of the
        // "delimited" node and make the closing paren non-pending.
        const {breadcrumbs} = zipper;
        if (breadcrumbs.length > 0) {
            const newZipper = maybeFinishRight(zipper);

            if (newZipper) {
                return moveRight(stateFromZipper(newZipper));
            }
        }

        // If we're immediately to the right of a "delimited" node where then
        // rightDelim is pending.  Make the delim non-pending and move into
        // the "delimited" node.
        const prev = left[left.length - 1];
        if (prev?.type === "delimited" && prev.rightDelim.value.pending) {
            const nonPending: Zipper = {
                ...zipper,
                row: {
                    ...zipper.row,
                    left: [
                        ...left.slice(0, -1),
                        makePermanent(prev, "rightDelim"),
                    ],
                },
            };

            // We're already to the right of the rightDelim so no move is
            // necessary.
            return stateFromZipper(nonPending);
        }

        leftParen.value.pending = true;

        // put everything to the left inside a Delimited node
        const newZipper: Zipper = {
            ...zipper,
            row: {
                ...zipper.row,
                left: [builders.delimited(left, leftParen, rightParen)],
            },
        };

        return stateFromZipper(newZipper);
    }
};
