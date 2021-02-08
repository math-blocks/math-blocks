import {Zipper} from "./types";

export const backspace = (zipper: Zipper): Zipper => {
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

    const {path} = zipper;

    if (path.length === 0) {
        return zipper;
    }

    const parent = path[path.length - 1];

    const {focus, row} = parent;

    const children = focus.other ? focus.other.children : [];

    if (focus.dir === "left") {
        return {
            path: path.slice(0, -1),
            row: {
                ...row,
                right: [...zipper.row.right, ...children, ...row.right],
            },
        };
    } else {
        return {
            path: path.slice(0, -1),
            row: {
                ...row,
                left: [...row.left, ...children],
                right: [...zipper.row.right, ...row.right],
            },
        };
    }
};
