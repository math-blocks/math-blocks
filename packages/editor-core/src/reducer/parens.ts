import * as builders from "../ast/builders";

import {moveRight} from "./move-right";

import type {Zipper, State} from "./types";

type Delimiters = "(" | ")" | "[" | "]" | "{" | "}";

const leftGlyphMap = {
    "(": "(",
    ")": "(",
    "{": "{",
    "}": "{",
    "[": "[",
    "]": "[",
};

const rightGlyphMap = {
    "(": ")",
    ")": ")",
    "{": "}",
    "}": "}",
    "[": "]",
    "]": "]",
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
            return moveRight({
                startZipper: newZipper,
                endZipper: newZipper,
                zipper: newZipper,
                selecting: false,
            });
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

        return {
            startZipper: newZipper,
            endZipper: newZipper,
            zipper: newZipper,
            selecting: false,
        };
    }

    if (leftParen.value.char === char) {
        // If we're inside a row inside of a "delimited" node, check if the
        // opening paren is pending, if it is, re-adjust the size of the
        // "delimited" node and make the opening paren non-pending
        const {breadcrumbs} = zipper;
        if (breadcrumbs.length > 0) {
            const last = breadcrumbs[breadcrumbs.length - 1];
            if (
                last.focus.type === "zdelimited" &&
                last.focus.leftDelim.value.pending
            ) {
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
                            // set last.focus.leftDelim.value.pending = false;
                            focus: {
                                ...last.focus,
                                leftDelim: {
                                    ...last.focus.leftDelim,
                                    value: {
                                        ...last.focus.leftDelim.value,
                                        pending: false,
                                    },
                                },
                            },
                        },
                    ],
                    row: {
                        ...zipper.row,
                        left: [],
                    },
                };

                return {
                    startZipper: newZipper,
                    endZipper: newZipper,
                    zipper: newZipper,
                    selecting: false,
                };
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
                        {
                            ...next,
                            leftDelim: {
                                ...next.leftDelim,
                                value: {
                                    ...next.leftDelim.value,
                                    pending: false,
                                },
                            },
                        },
                        ...right.slice(1),
                    ],
                },
            };

            return moveRight({
                startZipper: nonPending,
                endZipper: nonPending,
                zipper: nonPending,
                selecting: false,
            });
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

        return moveRight({
            startZipper: withParens,
            endZipper: withParens,
            zipper: withParens,
            selecting: false,
        });
    } else {
        // If we're inside a row inside of a "delimited" node, check if the
        // closing paren is pending, if it is, re-adjust the size of the
        // "delimited" node and make the closing paren non-pending.
        const {breadcrumbs} = zipper;
        if (breadcrumbs.length > 0) {
            const crumb = breadcrumbs[breadcrumbs.length - 1];
            if (
                crumb.focus.type === "zdelimited" &&
                crumb.focus.rightDelim.value.pending
            ) {
                // Move everything to the right of the cursor outside the
                // "delimited" node.
                const newZipper: Zipper = {
                    ...zipper,
                    breadcrumbs: [
                        ...breadcrumbs.slice(0, -1),
                        {
                            ...crumb,
                            row: {
                                ...crumb.row,
                                // update last.row.right
                                right: [
                                    ...zipper.row.right,
                                    ...crumb.row.right,
                                ],
                            },
                            // set last.focus.leftDelim.value.pending = false;
                            focus: {
                                ...crumb.focus,
                                rightDelim: {
                                    ...crumb.focus.rightDelim,
                                    value: {
                                        ...crumb.focus.rightDelim.value,
                                        pending: false,
                                    },
                                },
                            },
                        },
                    ],
                    row: {
                        ...zipper.row,
                        right: [],
                    },
                };

                return moveRight({
                    startZipper: newZipper,
                    endZipper: newZipper,
                    zipper: newZipper,
                    selecting: false,
                });
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
                        {
                            ...prev,
                            rightDelim: {
                                ...prev.rightDelim,
                                value: {
                                    ...prev.rightDelim.value,
                                    pending: false,
                                },
                            },
                        },
                    ],
                },
            };

            // We're already to the right of the rightDelim so no move is
            // necessary.
            return {
                startZipper: nonPending,
                endZipper: nonPending,
                zipper: nonPending,
                selecting: false,
            };
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

        return {
            startZipper: newZipper,
            endZipper: newZipper,
            zipper: newZipper,
            selecting: false,
        };
    }
};
