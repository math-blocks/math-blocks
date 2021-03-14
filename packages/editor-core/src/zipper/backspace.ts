import {Dir} from "./enums";
import {rezipSelection} from "./util";
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
            if (prev.value.char === "(") {
                const last = right[right.length - 1];
                if (
                    last.type === "atom" &&
                    last.value.char === ")" &&
                    last.value.pending
                ) {
                    return {
                        ...zipper,
                        row: {
                            ...zipper.row,
                            left: left.slice(0, -1),
                            right: right.slice(0, -1),
                        },
                    };
                }
            } else if (prev.value.char === ")") {
                const first = left[0];
                if (
                    first.type === "atom" &&
                    first.value.char === "(" &&
                    first.value.pending
                ) {
                    return {
                        ...zipper,
                        row: {
                            ...zipper.row,
                            left: left.slice(1, -1),
                        },
                    };
                }
            }
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
