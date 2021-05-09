import {UnreachableCaseError} from "@math-blocks/core";

import * as types from "../types";

import {SelectionDir} from "./enums";
import type {
    ZRow,
    ZFrac,
    ZSubSup,
    ZRoot,
    ZLimits,
    ZDelimited,
    Zipper,
    Focus,
} from "./types";

export const frac = (focus: ZFrac, replacement: types.Row): types.Frac => {
    if (focus.dir === 0) {
        return {
            id: focus.id,
            type: "frac",
            children: [replacement, focus.other],
        };
    } else {
        return {
            id: focus.id,
            type: "frac",
            children: [focus.other, replacement],
        };
    }
};

export const zfrac = (node: types.Frac, dir: 0 | 1): ZFrac => {
    return {
        id: node.id,
        type: "zfrac",
        dir,
        other: node.children[1 - dir],
    };
};

export const subsup = (
    focus: ZSubSup,
    replacement: types.Row,
): types.SubSup => {
    if (focus.dir === 0) {
        return {
            id: focus.id,
            type: "subsup",
            children: [replacement, focus.other],
        };
    } else {
        return {
            id: focus.id,
            type: "subsup",
            children: [focus.other, replacement],
        };
    }
};

export const zsubsup = (node: types.SubSup, dir: 0 | 1): ZSubSup => {
    return {
        id: node.id,
        type: "zsubsup",
        dir,
        other: node.children[1 - dir],
    };
};

export const root = (focus: ZRoot, replacement: types.Row): types.Root => {
    if (focus.dir === 0) {
        return {
            id: focus.id,
            type: "root",
            children: [replacement, focus.other],
        };
    } else {
        return {
            id: focus.id,
            type: "root",
            children: [focus.other, replacement],
        };
    }
};

export const zroot = (node: types.Root, dir: 0 | 1): ZRoot => {
    if (dir === 0) {
        return {
            id: node.id,
            type: "zroot",
            dir,
            other: node.children[1],
        };
    } else if (dir === 1) {
        return {
            id: node.id,
            type: "zroot",
            dir,
            other: node.children[0],
        };
    } else {
        throw new Error("dir cannot be Dir.None for zlimits");
    }
};

export const limits = (
    focus: ZLimits,
    replacement: types.Row,
): types.Limits => {
    if (focus.dir === 0) {
        return {
            id: focus.id,
            type: "limits",
            children: [replacement, focus.other],
            inner: focus.inner,
        };
    } else {
        return {
            id: focus.id,
            type: "limits",
            children: [focus.other, replacement],
            inner: focus.inner,
        };
    }
};

export const zlimits = (node: types.Limits, dir: 0 | 1): ZLimits => {
    if (dir === 0) {
        return {
            id: node.id,
            type: "zlimits",
            dir,
            other: node.children[1],
            inner: node.inner,
        };
    } else if (dir === 1) {
        return {
            id: node.id,
            type: "zlimits",
            dir,
            other: node.children[0],
            inner: node.inner,
        };
    } else {
        throw new Error("dir cannot be Dir.None for zlimits");
    }
};

export const delimited = (
    focus: ZDelimited,
    replacement: types.Row,
): types.Delimited => {
    return {
        id: focus.id,
        type: "delimited",
        children: [replacement],
        leftDelim: focus.leftDelim,
        rightDelim: focus.rightDelim,
    };
};

export const zdelimited = (node: types.Delimited): ZDelimited => {
    return {
        id: node.id,
        type: "zdelimited",
        dir: 0,
        other: null,
        leftDelim: node.leftDelim,
        rightDelim: node.rightDelim,
    };
};

export const focusToNode = (
    focus: Focus,
    replacement: types.Row,
): types.Node => {
    switch (focus.type) {
        case "zfrac":
            return frac(focus, replacement);
        case "zsubsup":
            return subsup(focus, replacement);
        case "zlimits":
            return limits(focus, replacement);
        case "zroot":
            return root(focus, replacement);
        case "zdelimited":
            return delimited(focus, replacement);
        default: {
            throw new UnreachableCaseError(focus);
        }
    }
};

export const insertRight = <
    T extends {left: readonly types.Node[]; right: readonly types.Node[]}
>(
    zrow: T,
    node: types.Node,
): T => {
    return {
        ...zrow,
        right: [node, ...zrow.right],
    };
};

export const insertLeft = <
    T extends {left: readonly types.Node[]; right: readonly types.Node[]}
>(
    zrow: T,
    node: types.Node,
): T => {
    return {
        ...zrow,
        left: [...zrow.left, node],
    };
};

/**
 * Removes the first item in zrow.right.
 * @param zrow {ZRow}
 */
export const delRight = <
    T extends {left: readonly types.Node[]; right: readonly types.Node[]}
>(
    zrow: T,
): T => {
    return {
        ...zrow,
        right: zrow.right.slice(1),
    };
};

/**
 * Removes the last item in zrow.left.
 * @param zrow {ZRow}
 */
export const delLeft = <
    T extends {left: readonly types.Node[]; right: readonly types.Node[]}
>(
    zrow: T,
): T => {
    return {
        ...zrow,
        left: zrow.left.slice(0, -1),
    };
};

export const zrowToRow = (zrow: ZRow): types.Row => {
    return {
        id: zrow.id,
        type: "row",
        children: [
            ...zrow.left,
            ...(zrow.selection?.nodes || []),
            ...zrow.right,
        ],
    };
};

export const zrow = (
    id: number,
    left: readonly types.Node[],
    right: readonly types.Node[],
): ZRow => ({
    id: id,
    type: "zrow",
    left,
    selection: null,
    right,
});

/**
 * Rezips a zipper with a selection until the selection is completely contained
 * within the zipper.row.
 *
 * If this is already the case or the zipper contains no selection, then the
 * original zipper is returned.
 */
export const rezipSelection = (zipper: Zipper): Zipper => {
    const {breadcrumbs, row} = zipper;

    if (breadcrumbs.length === 0) {
        return zipper;
    }

    const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
    const restCrumbs = breadcrumbs.slice(0, -1);

    const node = focusToNode(lastCrumb.focus, zrowToRow(row));

    if (lastCrumb.row.selection) {
        const newSelectionNodes =
            lastCrumb.row.selection.dir === SelectionDir.Left
                ? [...lastCrumb.row.selection.nodes, node]
                : [node, ...lastCrumb.row.selection.nodes];

        const newRow: ZRow = {
            ...lastCrumb.row,
            selection: {
                ...lastCrumb.row.selection,
                nodes: newSelectionNodes,
            },
        };

        const newZipper: Zipper = {
            row: newRow,
            breadcrumbs: restCrumbs,
        };

        return rezipSelection(newZipper);
    }

    // If there's no selection do nothing
    return zipper;
};
