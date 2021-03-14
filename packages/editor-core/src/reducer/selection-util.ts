import {Dir} from "./enums";
import type {ZRow} from "./types";

export const startSelection = <T extends {row: ZRow}>(
    crumb: T,
    dir: Dir,
): T => {
    return {
        ...crumb,
        row: {
            ...crumb.row,
            selection: {
                dir: dir,
                nodes: [],
            },
        },
    };
};

export const stopSelection = <T extends {row: ZRow}>(crumb: T): T => {
    return {
        ...crumb,
        row: {
            ...crumb.row,
            selection: null,
        },
    };
};

export const crumbMoveLeft = <T extends {row: ZRow}>(crumb: T): T => {
    const {row} = crumb;
    const {left, selection, right} = row;
    // TODO: bounds check
    const prev = left[left.length - 1];

    if (!selection) {
        return crumb;
    }

    if (selection.dir === Dir.Left) {
        return {
            ...crumb,
            row: {
                ...row,
                left: left.slice(0, -1),
                selection: {
                    ...selection,
                    nodes: [prev, ...selection.nodes],
                },
            },
        };
    } else {
        // TODO: bounds check
        const next = selection.nodes[selection.nodes.length - 1];

        return {
            ...crumb,
            row: {
                ...row,
                selection: {
                    ...selection,
                    nodes: selection.nodes.slice(0, -1),
                },
                right: [next, ...right],
            },
        };
    }
};

export const crumbMoveRight = <T extends {row: ZRow}>(crumb: T): T => {
    const {row} = crumb;
    const {left, selection, right} = row;
    // TODO: bounds check
    const next = right[0];

    if (!selection) {
        return crumb;
    }

    if (selection.dir === Dir.Right) {
        return {
            ...crumb,
            row: {
                ...row,
                selection: {
                    ...selection,
                    nodes: [...selection.nodes, next],
                },
                right: right.slice(1),
            },
        };
    } else {
        // TODO: bounds check
        const prev = selection.nodes[0];

        return {
            ...crumb,
            row: {
                ...row,
                left: [...left, prev],
                selection: {
                    ...selection,
                    nodes: selection.nodes.slice(1),
                },
            },
        };
    }
};
