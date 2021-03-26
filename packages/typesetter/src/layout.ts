import {UnreachableCaseError} from "@math-blocks/core";
import type {FontMetrics, MathConstants} from "@math-blocks/metrics";

import type {Context} from "./types";

type Dist = number;

type Dim = {
    width: Dist;
    depth: Dist;
    height: Dist;
};

type BoxKind = "hbox" | "vbox";

type Common = {
    id?: number;
    color?: string;
};

export type Box = {
    type: "Box";
    kind: BoxKind;
    shift: Dist;
    content: readonly (readonly Node[])[];
} & Common &
    Dim;

export type Glyph = {
    type: "Glyph";
    char: string;
    size: number;
    metrics: FontMetrics;
    pending?: boolean;
} & Common;

export type Kern = {
    type: "Kern";
    size: Dist;
} & Common;

export type HRule = {
    type: "HRule";
    thickness: number;
    width: number;
} & Common;

export type Node = Box | Glyph | Kern | HRule;

export const makeBox = (
    kind: BoxKind,
    dim: Dim,
    content: readonly (readonly Node[])[],
): Box => ({
    type: "Box",
    kind,
    ...dim,
    shift: 0,
    content,
});

export const makeKern = (size: Dist): Kern => ({
    type: "Kern",
    size,
});

export const makeHRule = (thickness: number, width: number): HRule => ({
    type: "HRule",
    thickness,
    width,
});

export const makeGlyph = (char: string, context: Context): Glyph => {
    const {fontData, baseFontSize, multiplier} = context;
    const {fontMetrics} = fontData;
    const fontSize = multiplier * baseFontSize;

    return {
        type: "Glyph",
        char,
        size: fontSize,
        metrics: fontMetrics,
    };
};

export const getCharAdvance = (glyph: Glyph): number => {
    const charCode = glyph.char.codePointAt(0);
    const fontMetrics = glyph.metrics;
    const metrics = fontMetrics.getGlyphMetrics(charCode);
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.advance * glyph.size) / fontMetrics.unitsPerEm;
};

export const getCharBearingX = (glyph: Glyph): number => {
    const charCode = glyph.char.codePointAt(0);
    const fontMetrics = glyph.metrics;
    const metrics = fontMetrics.getGlyphMetrics(charCode);
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.bearingX * glyph.size) / fontMetrics.unitsPerEm;
};

export const getCharWidth = (glyph: Glyph): number => {
    const charCode = glyph.char.codePointAt(0);
    const fontMetrics = glyph.metrics;
    const metrics = fontMetrics.getGlyphMetrics(charCode);
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.width * glyph.size) / fontMetrics.unitsPerEm;
};

export const getCharHeight = (glyph: Glyph): number => {
    const charCode = glyph.char.codePointAt(0);
    const fontMetrics = glyph.metrics;
    const metrics = fontMetrics.getGlyphMetrics(charCode);
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.bearingY * glyph.size) / fontMetrics.unitsPerEm;
};

export const getCharDepth = (glyph: Glyph): number => {
    const charCode = glyph.char.codePointAt(0);
    const fontMetrics = glyph.metrics;
    const metrics = fontMetrics.getGlyphMetrics(charCode);
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (
        ((metrics.height - metrics.bearingY) * glyph.size) /
        fontMetrics.unitsPerEm
    );
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

export const hpackNat = (nl: readonly (readonly Node[])[]): Box => {
    const dim = {
        width: sum(nl.map(hlistWidth)),
        height: max(nl.map(hlistHeight)),
        depth: max(nl.map(hlistDepth)),
    };
    return makeBox("hbox", dim, nl);
};

export const makeVBox = (
    width: Dist,
    node: Node,
    upList: readonly Node[],
    dnList: readonly Node[],
): Box => {
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
    return makeBox("vbox", dim, [nodeList]);
};

const makeList = (size: Dist, box: Box): readonly Node[] => [
    makeKern(size),
    box,
];

// TODO: compute width from numBox and denBox
export const makeFract = (
    numBox: Box,
    denBox: Box,
    context: Context,
    constants: MathConstants,
): Box => {
    const {baseFontSize, multiplier} = context;
    const fontSize = multiplier * baseFontSize;
    const thickness = (fontSize * constants.fractionRuleThickness) / 1000;
    const shift = (fontSize * constants.axisHeight) / 1000;

    // If useDisplayStyle is false then we need to reduce the font size of
    // numerators and denominators
    const useDisplayStyle = true;

    const numeratorShift = useDisplayStyle
        ? (fontSize * constants.fractionNumeratorDisplayStyleShiftUp) / 1000
        : (fontSize * constants.fractionNumeratorShiftUp) / 1000;

    const denominatorShift = useDisplayStyle
        ? (fontSize * constants.fractionDenominatorDisplayStyleShiftDown) / 1000
        : (fontSize * constants.fractionDenominatorShiftDown) / 1000;

    const minDenGap = useDisplayStyle
        ? (fontSize * constants.fractionDenomDisplayStyleGapMin) / 1000
        : (fontSize * constants.fractionDenominatorGapMin) / 1000;

    const minNumGap = useDisplayStyle
        ? (fontSize * constants.fractionNumDisplayStyleGapMin) / 1000
        : (fontSize * constants.fractionNumeratorGapMin) / 1000;

    const width = Math.max(
        Math.max(getWidth(numBox), getWidth(denBox)), // TODO: calculate this based on current font size
        30 * multiplier, // empty numerator/denominator width
    );
    const stroke = hpackNat([[makeHRule(thickness, width - thickness)]]);

    const numGap = Math.max(numeratorShift - numBox.depth - shift, minNumGap);
    const denGap = Math.max(
        shift + denominatorShift - denBox.height,
        minDenGap,
    );

    const upList = makeList(numGap, numBox);
    const dnList = makeList(denGap, denBox);

    const fracBox = makeVBox(width, stroke, upList, dnList);
    fracBox.shift = -shift;

    // center the numerator
    if (getWidth(numBox) < width) {
        numBox.shift = (width - getWidth(numBox)) / 2;
    }

    // center the denominator
    if (getWidth(denBox) < width) {
        denBox.shift = (width - getWidth(denBox)) / 2;
    }

    return fracBox;
};

export const makeSubSup = (
    multiplier: number,
    subBox?: Box,
    supBox?: Box,
): Box => {
    if (!supBox && !subBox) {
        throw new Error("at least one of supBox and subBox must be defined");
    }

    const width = Math.max(
        supBox ? getWidth(supBox) : 0,
        subBox ? getWidth(subBox) : 0,
    );
    const upList = supBox ? makeList(10 * multiplier, supBox) : [];
    // TODO: make the shift depend on the height of the subscript
    const dnList = subBox ? makeList(0 * multiplier, subBox) : [];
    // we can't have a non-zero kern b/c it has no height/depth
    const gap = makeKern(0);

    const subsupBox = makeVBox(width, gap, upList, dnList);
    // TODO: calculate this based on current font size
    subsupBox.shift = -10 * multiplier;
    return subsupBox;
};
