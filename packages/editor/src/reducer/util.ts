import {UnreachableCaseError} from "@math-blocks/core";

import * as types from "../char/types";
import {NodeType} from "../shared-types";

import type {
    ZRow,
    ZFrac,
    ZSubSup,
    ZRoot,
    ZLimits,
    ZDelimited,
    Focus,
    ZTable,
    Zipper,
    State,
} from "./types";

export const frac = (
    focus: ZFrac,
    replacement: types.CharRow,
): types.CharFrac => {
    return {
        id: focus.id,
        type: NodeType.Frac,
        children: [
            ...focus.left,
            replacement,
            ...focus.right,
        ] as readonly (types.CharRow | null)[] as readonly [
            types.CharRow,
            types.CharRow,
        ],
        style: focus.style,
    };
};

export const zfrac = (node: types.CharFrac, index: 0 | 1): ZFrac => {
    return index === 0
        ? {
              id: node.id,
              type: "zfrac",
              left: [],
              right: [node.children[1]],
              style: node.style,
          }
        : {
              id: node.id,
              type: "zfrac",
              left: [node.children[0]],
              right: [],
              style: node.style,
          };
};

export const subsup = (
    focus: ZSubSup,
    replacement: types.CharRow,
): types.CharSubSup => {
    return {
        id: focus.id,
        type: NodeType.SubSup,
        children: [
            ...focus.left,
            replacement,
            ...focus.right,
        ] as readonly (types.CharRow | null)[] as readonly [
            types.CharRow | null,
            types.CharRow | null,
        ],
        style: focus.style,
    };
};

export const zsubsup = (node: types.CharSubSup, index: 0 | 1): ZSubSup => {
    return index === 0
        ? {
              id: node.id,
              type: "zsubsup",
              left: [],
              right: [node.children[1]],
              style: node.style,
          }
        : {
              id: node.id,
              type: "zsubsup",
              left: [node.children[0]],
              right: [],
              style: node.style,
          };
};

export const root = (
    focus: ZRoot,
    replacement: types.CharRow,
): types.CharRoot => {
    return {
        id: focus.id,
        type: NodeType.Root,
        children: [
            ...focus.left,
            replacement,
            ...focus.right,
        ] as readonly (types.CharRow | null)[] as readonly [
            types.CharRow | null,
            types.CharRow,
        ],
        style: focus.style,
    };
};

export const zroot = (node: types.CharRoot, index: 0 | 1): ZRoot => {
    return index === 0
        ? {
              id: node.id,
              type: "zroot",
              left: [],
              right: [node.children[1]],
              style: node.style,
          }
        : {
              id: node.id,
              type: "zroot",
              left: [node.children[0]],
              right: [],
              style: node.style,
          };
};

export const limits = (
    focus: ZLimits,
    replacement: types.CharRow,
): types.CharLimits => {
    return {
        id: focus.id,
        type: NodeType.Limits,
        inner: focus.inner,
        children: [
            ...focus.left,
            replacement,
            ...focus.right,
        ] as readonly (types.CharRow | null)[] as readonly [
            types.CharRow,
            types.CharRow | null,
        ],
        style: focus.style,
    };
};

export const zlimits = (node: types.CharLimits, index: 0 | 1): ZLimits => {
    return index === 0
        ? {
              id: node.id,
              type: "zlimits",
              left: [],
              right: [node.children[1]],
              inner: node.inner,
              style: node.style,
          }
        : {
              id: node.id,
              type: "zlimits",
              left: [node.children[0]],
              right: [],
              inner: node.inner,
              style: node.style,
          };
};

export const table = (
    focus: ZTable,
    replacement: types.CharRow,
): types.CharTable => {
    return {
        id: focus.id,
        type: NodeType.Table,
        subtype: focus.subtype,
        rowCount: focus.rowCount,
        colCount: focus.colCount,
        rowStyles: focus.rowStyles,
        colStyles: focus.colStyles,
        delimiters: focus.delimiters,
        children: [...focus.left, replacement, ...focus.right],
        style: focus.style,
    };
};

export const ztable = (node: types.CharTable, index: number): ZTable => {
    return {
        id: node.id,
        type: "ztable",
        subtype: node.subtype,
        rowCount: node.rowCount,
        colCount: node.colCount,
        rowStyles: node.rowStyles,
        colStyles: node.colStyles,
        delimiters: node.delimiters,
        left: node.children.slice(0, index),
        right: node.children.slice(index + 1),
        style: node.style,
    };
};

export const delimited = (
    focus: ZDelimited,
    replacement: types.CharRow,
): types.CharDelimited => {
    return {
        id: focus.id,
        type: NodeType.Delimited,
        children: [replacement], // focus.left and focus.right are always empty arrays
        leftDelim: focus.leftDelim,
        rightDelim: focus.rightDelim,
        style: focus.style,
    };
};

export const zdelimited = (node: types.CharDelimited): ZDelimited => {
    return {
        id: node.id,
        type: "zdelimited",
        left: [],
        right: [],
        leftDelim: node.leftDelim,
        rightDelim: node.rightDelim,
        style: node.style,
    };
};

export const focusToNode = (
    focus: Focus,
    replacement: types.CharRow,
): types.CharNode => {
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
        case "ztable":
            return table(focus, replacement);
        default: {
            throw new UnreachableCaseError(focus);
        }
    }
};

export const nodeToFocus = (
    node:
        | types.CharFrac
        | types.CharSubSup
        | types.CharRoot
        | types.CharLimits
        | types.CharDelimited
        | types.CharTable,
    index: number,
): Focus => {
    switch (node.type) {
        case NodeType.Frac:
            if (index !== 0 && index !== 1) {
                throw new Error("index outside of range [0, 1]");
            }
            return zfrac(node, index);
        case NodeType.SubSup:
            if (index !== 0 && index !== 1) {
                throw new Error("index outside of range [0, 1]");
            }
            return zsubsup(node, index);
        case NodeType.Root:
            if (index !== 0 && index !== 1) {
                throw new Error("index outside of range [0, 1]");
            }
            return zroot(node, index);
        case NodeType.Limits:
            if (index !== 0 && index !== 1) {
                throw new Error("index outside of range [0, 1]");
            }
            return zlimits(node, index);
        case NodeType.Delimited:
            return zdelimited(node);
        case NodeType.Table:
            return ztable(node, index);
        default:
            throw new UnreachableCaseError(node);
    }
};

export const insertRight = <
    T extends {
        readonly left: readonly types.CharNode[];
        readonly right: readonly types.CharNode[];
    },
>(
    zrow: T,
    node: types.CharNode,
): T => {
    return {
        ...zrow,
        right: [node, ...zrow.right],
    };
};

export const zrowToRow = (zrow: ZRow): types.CharRow => {
    return {
        id: zrow.id,
        type: NodeType.Row,
        children: [...zrow.left, ...zrow.selection, ...zrow.right],
        style: zrow.style,
    };
};

export const zrow = (
    id: number,
    left: readonly types.CharNode[],
    right: readonly types.CharNode[],
    style?: types.Style,
): ZRow => ({
    id: id,
    type: "zrow",
    left,
    selection: [],
    right,
    style: style ?? {},
});

export const zipperToState = (zipper: Zipper): State => {
    return {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
    };
};
