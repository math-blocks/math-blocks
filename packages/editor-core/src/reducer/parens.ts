import * as builders from "../builders";

import {Dir} from "./enums";
import {rezipSelection} from "./util";
import {moveRight} from "./move-right";

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

    if (dir === Dir.Left) {
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
                return {
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
            }
        }

        // If we're immediately to the left of a "delimted" node where then
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

            return moveRight(nonPending);
        }

        // Create a new "delimited" node
        const withParens: Zipper = {
            ...zipper,
            row: {
                ...zipper.row,
                right: [
                    builders.delimited(
                        right,
                        builders.glyph("("),
                        builders.glyph(")", true),
                    ),
                ],
            },
        };

        return moveRight(withParens);
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

                return moveRight(newZipper);
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
            return nonPending;
        }

        // put everything to the left inside a Delimited node
        return {
            ...zipper,
            row: {
                ...zipper.row,
                left: [
                    builders.delimited(
                        left,
                        builders.glyph("(", true),
                        builders.glyph(")"),
                    ),
                ],
            },
        };
    }
};
