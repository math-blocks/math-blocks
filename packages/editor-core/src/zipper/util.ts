import {ZRow, ZFrac, ZSubSup, ZRoot} from "./types";
import * as types from "../types";

export const startRow = (row: types.Row): ZRow => {
    return {
        id: row.id,
        type: "zrow",
        left: [], // we're at the start because there are no nodes to the left
        right: row.children,
    };
};

export const endRow = (row: types.Row): ZRow => {
    return {
        id: row.id,
        type: "zrow",
        left: row.children,
        right: [], // we're at the end because there are no nodes to the right
    };
};

export const frac = (
    id: number,
    numerator: types.Row,
    denominator: types.Row,
): types.Frac => {
    return {
        id,
        type: "frac",
        children: [numerator, denominator],
    };
};

export const zfrac = (
    id: number,
    dir: "left" | "right",
    other: types.Row,
): ZFrac => {
    return {
        id,
        type: "zfrac",
        dir,
        other,
    };
};

export const subsup = (
    id: number,
    subscript: types.Row | null,
    superscript: types.Row | null,
): types.SubSup => {
    return {
        id,
        type: "subsup",
        children: [subscript, superscript],
    };
};

export const zsubsup = (
    id: number,
    dir: "left" | "right",
    other: types.Row | null,
): ZSubSup => {
    return {
        id,
        type: "zsubsup",
        dir,
        other,
    };
};

export const root = (
    id: number,
    index: types.Row | null,
    radicand: types.Row,
): types.Root => {
    return {
        id,
        type: "root",
        children: [index, radicand],
    };
};

function zroot(id: number, dir: "left", other: types.Row): ZRoot;
function zroot(id: number, dir: "right", other: types.Row | null): ZRoot;
function zroot(id: number, dir: any, other: any): ZRoot {
    if (dir === "left") {
        return {
            id,
            type: "zroot",
            dir: "left",
            other,
        };
    }
    return {
        type: "zroot",
        id,
        dir,
        other,
    };
}

export {zroot};

// export const zroot = (
//     id: number,
//     index?: types.Row | null,
//     radicand?: types.Row,
// ): ZRoot => {
//     return {
//         id,
//         type: "zroot",
//         left: index,
//         right: radicand,
//     };
// };

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
