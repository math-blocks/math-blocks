import {UnreachableCaseError} from "@math-blocks/core";
import type {FontData, MathValueRecord} from "@math-blocks/opentype";

import {fontSizeForContext} from "./utils";
import type {Context} from "./types";

export type Dist = number;

export type Dim = {
    width: Dist;
    depth: Dist;
    height: Dist;
};

type Style = {
    color?: string;
    cancel?: number; // The ID of the cancel notation
};

type Common = {
    id?: number;
    style: Style;
};

export type HBox = {
    type: "Box";
    kind: "hbox";
    shift: Dist;
    // TODO: tighten this up by modeling the possible types of content
    // - no cursor, no selection
    // - cursor
    // - selection
    content: readonly (readonly Node[])[];
    fontSize: number;
} & Common &
    Dim;

export type VBox = {
    type: "Box";
    kind: "vbox";
    shift: Dist;
    content: readonly Node[];
    fontSize: number;
} & Common &
    Dim;

type Box = HBox | VBox;

export type Glyph = {
    type: "Glyph";
    char?: string;
    glyphID: number; // This is specific to the Font in FontData
    size: number;
    fontData: FontData;
    pending?: boolean;
} & Common;

export type Kern = {
    type: "Kern";
    size: Dist;
    // Used for hitboxes at the start/end of a numerator or denominator
    flag?: "start" | "end";
} & Common;

export type HRule = {
    type: "HRule";
    thickness: number;
    width: number;
} & Common;

export type Node = Box | Glyph | Kern | HRule;

export const makeHBox = (
    dim: Dim,
    content: readonly (readonly Node[])[],
    context: Context,
): HBox => {
    return {
        type: "Box",
        kind: "hbox",
        ...dim,
        shift: 0,
        content,
        fontSize: fontSizeForContext(context),
        style: {},
    };
};

export const rebox = (box: HBox, before: Kern, after: Kern): HBox => {
    if (box.content.length === 1) {
        return {
            ...box,
            width: box.width + before.size + after.size,
            content: [[before, ...box.content[0], after]],
        };
    } else if (box.content.length === 2) {
        return {
            ...box,
            width: box.width + before.size + after.size,
            content: [
                [before, ...box.content[0]],
                [...box.content[1], after],
            ],
        };
    } else if (box.content.length === 3) {
        return {
            ...box,
            width: box.width + before.size + after.size,
            content: [
                [before, ...box.content[0]],
                box.content[1],
                [...box.content[2], after],
            ],
        };
    } else {
        throw new Error(
            `box.content.length = ${box.content.length} which is invalid`,
        );
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
        case "Box":
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
        case "Box":
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
        case "Box":
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

const vwidth = (node: Node): number => {
    switch (node.type) {
        case "Box":
            return node.width + node.shift;
        case "Glyph":
            return getCharAdvance(node);
        case "Kern":
            return 0;
        case "HRule":
            return node.width;
        default:
            throw new UnreachableCaseError(node);
    }
};

export const vsize = (node: Node): number => {
    switch (node.type) {
        case "Box":
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const vlistWidth = (nodes: readonly Node[]): number => max(nodes.map(vwidth));
const vlistVsize = (nodes: readonly Node[]): number => sum(nodes.map(vsize));

export const hpackNat = (
    nl: readonly (readonly Node[])[],
    context: Context,
): HBox => {
    const dim = {
        width: sum(nl.map(hlistWidth)),
        height: max(nl.map(hlistHeight)),
        depth: max(nl.map(hlistDepth)),
    };
    return makeHBox(dim, nl, context);
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
        type: "Box",
        kind: "vbox",
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
