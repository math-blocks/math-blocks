import {Zipper} from "./types";

export const backspace = (zipper: Zipper): Zipper => {
    if (zipper.row.left.length > 0) {
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
