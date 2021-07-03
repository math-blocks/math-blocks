import {UnreachableCaseError} from "@math-blocks/core";
import type {FontData, MathValueRecord} from "@math-blocks/opentype";

import {fontSizeForContext} from "./utils";
import type {Context} from "./types";

export type Dist = number;

export type Dim = Readonly<{
    readonly width: Dist;
    readonly depth: Dist;
    readonly height: Dist;
}>;

type Style = {
    readonly color?: string;
    readonly cancel?: number; // The ID of the cancel notation
};

type Common = {
    readonly id?: number;
    readonly style: Style;
};

export type Content =
    | {
          readonly type: "static";
          readonly nodes: readonly Node[];
      }
    | {
          readonly type: "cursor";
          readonly left: readonly Node[];
          readonly right: readonly Node[];
      }
    | {
          readonly type: "selection";
          readonly left: readonly Node[];
          readonly selection: readonly Node[];
          readonly right: readonly Node[];
      };

export type HBox = {
    readonly type: "HBox";
    readonly shift: Dist;
    readonly content: Content;
    readonly fontSize: number;
} & Common &
    Dim;

export type VBox = {
    readonly type: "VBox";
    readonly shift: Dist;
    readonly content: readonly Node[];
    readonly fontSize: number;
} & Common &
    Dim;

export type Glyph = {
    readonly type: "Glyph";
    readonly char?: string;
    readonly glyphID: number; // This is specific to the Font in FontData
    readonly size: number;
    readonly fontData: FontData;
    readonly pending?: boolean;
} & Common;

export type Kern = {
    readonly type: "Kern";
    readonly size: Dist;
    // Used for hitboxes at the start/end of a numerator or denominator
    readonly flag?: "start" | "end";
} & Common;

export type HRule = {
    readonly type: "HRule";
    readonly thickness: number;
    readonly width: number;
} & Common;

export type Node = HBox | VBox | Glyph | Kern | HRule;

const makeHBox = (dim: Dim, content: Content, context: Context): HBox => {
    return {
        type: "HBox",
        ...dim,
        shift: 0,
        content,
        fontSize: fontSizeForContext(context),
        style: {},
    };
};

export const rebox = (box: HBox, before: Kern, after: Kern): HBox => {
    if (box.content.type === "static") {
        return {
            ...box,
            width: before.size + box.width + after.size,
            content: {
                ...box.content,
                nodes: [before, ...box.content.nodes, after],
            },
        };
    } else {
        return {
            ...box,
            width: before.size + box.width + after.size,
            content: {
                ...box.content,
                left: [before, ...box.content.left],
                right: [...box.content.right, after],
            },
        };
    }
};

export const makeKern = (size: Dist, flag?: "start" | "end"): Kern => ({
    type: "Kern",
    size,
    flag,
    style: {},
});

export const makeHRule = (thickness: number, width: number): HRule => ({
    type: "HRule",
    thickness,
    width,
    style: {},
});

export const makeGlyph = (
    char: string,
    glyphID: number,
    context: Context,
): Glyph => {
    return {
        type: "Glyph",
        char,
        glyphID,
        size: fontSizeForContext(context),
        fontData: context.fontData,
        style: {},
    };
};

export const getCharAdvance = (glyph: Glyph): number => {
    const {font} = glyph.fontData;
    const metrics = font.getGlyphMetrics(glyph.glyphID);
    const unitsPerEm = font.head.unitsPerEm;
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.advance * glyph.size) / unitsPerEm;
};

export const getCharBearingX = (glyph: Glyph): number => {
    const {font} = glyph.fontData;
    const metrics = font.getGlyphMetrics(glyph.glyphID);
    const unitsPerEm = font.head.unitsPerEm;
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.bearingX * glyph.size) / unitsPerEm;
};

export const getCharWidth = (glyph: Glyph): number => {
    const {font} = glyph.fontData;
    const metrics = font.getGlyphMetrics(glyph.glyphID);
    const unitsPerEm = font.head.unitsPerEm;
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.width * glyph.size) / unitsPerEm;
};

export const getCharHeight = (glyph: Glyph): number => {
    const {font} = glyph.fontData;
    const metrics = font.getGlyphMetrics(glyph.glyphID);
    const unitsPerEm = font.head.unitsPerEm;
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.bearingY * glyph.size) / unitsPerEm;
};

export const getCharDepth = (glyph: Glyph): number => {
    const {font} = glyph.fontData;
    const metrics = font.getGlyphMetrics(glyph.glyphID);
    const unitsPerEm = font.head.unitsPerEm;
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return ((metrics.height - metrics.bearingY) * glyph.size) / unitsPerEm;
};

export const getWidth = (node: Node): number => {
    switch (node.type) {
        case "HBox":
            return node.width;
        case "VBox":
            return node.width;
        case "Glyph":
            return getCharAdvance(node);
        case "Kern":
            return node.size;
        case "HRule":
            return node.width;
        default:
            throw new UnreachableCaseError(node);
    }
};

export const getHeight = (node: Node): number => {
    switch (node.type) {
        case "HBox":
            return node.height - node.shift;
        case "VBox":
            return node.height - node.shift;
        case "Glyph":
            return getCharHeight(node);
        case "Kern":
            return 0;
        case "HRule":
            return node.thickness / 2;
        default:
            throw new UnreachableCaseError(node);
    }
};

export const getDepth = (node: Node): number => {
    switch (node.type) {
        case "HBox":
            return node.depth + node.shift;
        case "VBox":
            return node.depth + node.shift;
        case "Glyph":
            return getCharDepth(node);
        case "Kern":
            return 0;
        case "HRule":
            return node.thickness / 2;
        default:
            throw new UnreachableCaseError(node);
    }
};

export const vsize = (node: Node): number => {
    switch (node.type) {
        case "HBox":
            return node.height + node.depth;
        case "VBox":
            return node.height + node.depth;
        case "Glyph":
            return getCharHeight(node) + getCharDepth(node);
        case "Kern":
            return node.size;
        case "HRule":
            return node.thickness;
        default:
            throw new UnreachableCaseError(node);
    }
};

const add = (a: number, b: number): number => a + b;
const zero = 0;
const sum = (values: readonly number[]): number => values.reduce(add, zero);
const max = (values: readonly number[]): number => Math.max(...values);

export const hlistWidth = (nodes: readonly Node[]): number =>
    sum(nodes.map(getWidth));
const hlistHeight = (nodes: readonly Node[]): number =>
    max(nodes.map(getHeight));
const hlistDepth = (nodes: readonly Node[]): number => max(nodes.map(getDepth));
const vlistVsize = (nodes: readonly Node[]): number => sum(nodes.map(vsize));

export const makeStaticHBox = (
    nodes: readonly Node[],
    context: Context,
): HBox => {
    const dim = {
        width: hlistWidth(nodes),
        height: hlistHeight(nodes),
        depth: hlistDepth(nodes),
    };
    const content: Content = {
        type: "static",
        nodes,
    };
    return makeHBox(dim, content, context);
};

export const makeCursorHBox = (
    left: readonly Node[],
    right: readonly Node[],
    context: Context,
): HBox => {
    const dim = {
        width: hlistWidth(left) + hlistWidth(right),
        height: Math.max(hlistHeight(left), hlistHeight(right)),
        depth: Math.max(hlistDepth(left), hlistDepth(right)),
    };
    const content: Content = {
        type: "cursor",
        left,
        right,
    };
    return makeHBox(dim, content, context);
};

export const makeSelectionHBox = (
    left: readonly Node[],
    selection: readonly Node[],
    right: readonly Node[],
    context: Context,
): HBox => {
    const dim = {
        width: hlistWidth(left) + hlistWidth(selection) + hlistWidth(right),
        height: Math.max(
            hlistHeight(left),
            hlistHeight(selection),
            hlistHeight(right),
        ),
        depth: Math.max(
            hlistDepth(left),
            hlistDepth(selection),
            hlistDepth(right),
        ),
    };
    const content: Content = {
        type: "selection",
        left,
        selection,
        right,
    };
    return makeHBox(dim, content, context);
};

export const makeVBox = (
    width: Dist,
    node: Node,
    upList: readonly Node[],
    dnList: readonly Node[],
    context: Context,
): VBox => {
    const dim = {
        width,
        depth:
            dnList.length > 0
                ? vlistVsize(dnList) + getDepth(node)
                : getDepth(node),
        height:
            upList.length > 0
                ? vlistVsize(upList) + getHeight(node)
                : getHeight(node),
    };
    const upListCopy = [...upList];
    // TODO: get rid of the need to reverse the uplist
    const nodeList = [...upListCopy.reverse(), node, ...dnList];

    return {
        type: "VBox",
        ...dim,
        shift: 0,
        content: nodeList,
        fontSize: fontSizeForContext(context),
        style: {},
    };
};

export const getConstantValue = (
    constant: MathValueRecord,
    context: Context,
): number => {
    const {font} = context.fontData;
    const fontSize = fontSizeForContext(context);

    return (constant.value * fontSize) / font.head.unitsPerEm;
};
