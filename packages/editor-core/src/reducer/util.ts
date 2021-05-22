import {UnreachableCaseError} from "@math-blocks/core";

import * as types from "../types";

import type {
    ZRow,
    ZFrac,
    ZSubSup,
    ZRoot,
    ZLimits,
    ZDelimited,
    Focus,
} from "./types";

export const frac = (focus: ZFrac, replacement: types.Row): types.Frac => {
    return {
        id: focus.id,
        type: "frac",
        children: [...focus.left, replacement, ...focus.right] as [
            types.Row,
            types.Row,
        ],
    };
};

export const zfrac = (node: types.Frac, index: 0 | 1): ZFrac => {
    return index === 0
        ? {
              id: node.id,
              type: "zfrac",
              left: [],
              right: [node.children[1]],
          }
        : {
              id: node.id,
              type: "zfrac",
              left: [node.children[0]],
              right: [],
          };
};

export const subsup = (
    focus: ZSubSup,
    replacement: types.Row,
): types.SubSup => {
    return {
        id: focus.id,
        type: "subsup",
        children: [...focus.left, replacement, ...focus.right] as [
            types.Row | null,
            types.Row | null,
        ],
    };
};

export const zsubsup = (node: types.SubSup, index: 0 | 1): ZSubSup => {
    return index === 0
        ? {
              id: node.id,
              type: "zsubsup",
              left: [],
              right: [node.children[1]],
          }
        : {
              id: node.id,
              type: "zsubsup",
              left: [node.children[0]],
              right: [],
          };
};

export const root = (focus: ZRoot, replacement: types.Row): types.Root => {
    return {
        id: focus.id,
        type: "root",
        children: [...focus.left, replacement, ...focus.right] as [
            types.Row | null,
            types.Row,
        ],
    };
};

export const zroot = (node: types.Root, index: 0 | 1): ZRoot => {
    return index === 0
        ? {
              id: node.id,
              type: "zroot",
              left: [],
              right: [node.children[1]],
          }
        : {
              id: node.id,
              type: "zroot",
              left: [node.children[0]],
              right: [],
          };
};

export const limits = (
    focus: ZLimits,
    replacement: types.Row,
): types.Limits => {
    return {
        id: focus.id,
        type: "limits",
        inner: focus.inner,
        children: [...focus.left, replacement, ...focus.right] as [
            types.Row,
            types.Row | null,
        ],
    };
};

export const zlimits = (node: types.Limits, index: 0 | 1): ZLimits => {
    return index === 0
        ? {
              id: node.id,
              type: "zlimits",
              left: [],
              right: [node.children[1]],
              inner: node.inner,
          }
        : {
              id: node.id,
              type: "zlimits",
              left: [node.children[0]],
              right: [],
              inner: node.inner,
          };
};

export const delimited = (
    focus: ZDelimited,
    replacement: types.Row,
): types.Delimited => {
    return {
        id: focus.id,
        type: "delimited",
        children: [replacement], // focus.left and focus.right are always empty arrays
        leftDelim: focus.leftDelim,
        rightDelim: focus.rightDelim,
    };
};

export const zdelimited = (node: types.Delimited): ZDelimited => {
    return {
        id: node.id,
        type: "zdelimited",
        left: [],
        right: [],
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

export const zrowToRow = (zrow: ZRow): types.Row => {
    return {
        id: zrow.id,
        type: "row",
        children: [...zrow.left, ...zrow.selection, ...zrow.right],
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
    selection: [],
    right,
});
