import {getId} from "@math-blocks/core";

import {ZRow, ZFrac, ZSubSup, ZRoot, ZLimits} from "./types";
import * as types from "../types";

export const startRow = (row: types.Row): ZRow => {
    return {
        id: row.id,
        type: "zrow",
        left: [], // we're at the start because there are no nodes to the left
        selection: null,
        right: row.children,
    };
};

export const endRow = (row: types.Row): ZRow => {
    return {
        id: row.id,
        type: "zrow",
        left: row.children,
        selection: null,
        right: [], // we're at the end because there are no nodes to the right
    };
};

export const frac = (focus: ZFrac, replacement: types.Row): types.Frac => {
    if (focus.dir === "left") {
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

export const zfrac = (node: types.Frac, dir: "left" | "right"): ZFrac => {
    return {
        id: node.id,
        type: "zfrac",
        dir,
        other: dir === "left" ? node.children[1] : node.children[0],
    };
};

export const subsup = (
    focus: ZSubSup,
    replacement: types.Row,
): types.SubSup => {
    if (focus.dir === "left") {
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

export const zsubsup = (node: types.SubSup, dir: "left" | "right"): ZSubSup => {
    return {
        id: node.id,
        type: "zsubsup",
        dir,
        other: dir === "left" ? node.children[1] : node.children[0],
    };
};

export const root = (focus: ZRoot, replacement: types.Row): types.Root => {
    if (focus.dir === "left") {
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

export const zroot = (node: types.Root, dir: "left" | "right"): ZRoot => {
    if (dir === "left") {
        return {
            id: node.id,
            type: "zroot",
            dir,
            other: node.children[1],
        };
    } else {
        return {
            id: node.id,
            type: "zroot",
            dir,
            other: node.children[0],
        };
    }
};

export const limits = (
    focus: ZLimits,
    replacement: types.Row,
): types.Limits => {
    if (focus.dir === "left") {
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

export const zlimits = (node: types.Limits, dir: "left" | "right"): ZLimits => {
    if (dir === "left") {
        return {
            id: node.id,
            type: "zlimits",
            dir,
            other: node.children[1],
            inner: node.inner,
        };
    } else {
        return {
            id: node.id,
            type: "zlimits",
            dir,
            other: node.children[0],
            inner: node.inner,
        };
    }
};

export const insertRight = <
    T extends {left: types.Node[]; right: types.Node[]}
>(
    zrow: T,
    node: types.Node,
): T => {
    return {
        ...zrow,
        right: [node, ...zrow.right],
    };
};

export const insertLeft = <T extends {left: types.Node[]; right: types.Node[]}>(
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
export const delRight = <T extends {left: types.Node[]; right: types.Node[]}>(
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
export const delLeft = <T extends {left: types.Node[]; right: types.Node[]}>(
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
        children: [...zrow.left, ...zrow.right],
    };
};

export const newZRow = (): ZRow => ({
    id: getId(),
    type: "zrow",
    left: [],
    selection: null,
    right: [],
});
