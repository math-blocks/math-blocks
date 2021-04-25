import * as Editor from "@math-blocks/editor-core";
import {UnreachableCaseError} from "@math-blocks/core";
import type {FontData, MathValueRecord} from "@math-blocks/opentype";

import {multiplierForContext, fontSizeForContext} from "./utils";
import type {Context} from "./types";
import {MathStyle} from "./enums";

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
    fontSize: number;
} & Common &
    Dim;

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
    context: Context,
): Box => {
    return {
        type: "Box",
        kind,
        ...dim,
        shift: 0,
        content,
        fontSize: fontSizeForContext(context),
    };
};

export const makeKern = (size: Dist): Kern => ({
    type: "Kern",
    size,
});

export const makeHRule = (thickness: number, width: number): HRule => ({
    type: "HRule",
    thickness,
    width,
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
): Box => {
    const dim = {
        width: sum(nl.map(hlistWidth)),
        height: max(nl.map(hlistHeight)),
        depth: max(nl.map(hlistDepth)),
    };
    return makeBox("hbox", dim, nl, context);
};

export const makeVBox = (
    width: Dist,
    node: Node,
    upList: readonly Node[],
    dnList: readonly Node[],
    context: Context,
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
    return makeBox("vbox", dim, [nodeList], context);
};

const makeList = (size: Dist, box: Box): readonly Node[] => [
    makeKern(size),
    box,
];

// TODO: compute width from numBox and denBox
export const makeFract = (numBox: Box, denBox: Box, context: Context): Box => {
    const {mathStyle} = context;
    const {constants} = context.fontData.font.math;

    const fontSize = fontSizeForContext(context);
    const thickness = (fontSize * constants.fractionRuleThickness.value) / 1000;
    const shift = (fontSize * constants.axisHeight.value) / 1000;

    // If useDisplayStyle is false then we need to reduce the font size of
    // numerators and denominators
    const useDisplayStyle = mathStyle === MathStyle.Display;

    const minDenGap = useDisplayStyle
        ? (fontSize * constants.fractionDenomDisplayStyleGapMin.value) / 1000
        : (fontSize * constants.fractionDenominatorGapMin.value) / 1000;

    const minNumGap = useDisplayStyle
        ? (fontSize * constants.fractionNumDisplayStyleGapMin.value) / 1000
        : (fontSize * constants.fractionNumeratorGapMin.value) / 1000;

    // TODO: fix this code once we have debugging outlines in place, right now
    // gap between the fraction bar and the numerator/denominator is too big
    // when the font has been scaled.
    // Check context.renderMode === RenderMode.Static when doing so.

    // const numeratorShift = useDisplayStyle
    //     ? (fontSize * constants.fractionNumeratorDisplayStyleShiftUp) / 1000
    //     : (fontSize * constants.fractionNumeratorShiftUp) / 1000;

    // const denominatorShift = useDisplayStyle
    //     ? (fontSize * constants.fractionDenominatorDisplayStyleShiftDown) / 1000
    //     : (fontSize * constants.fractionDenominatorShiftDown) / 1000;

    // const numGap = Math.max(numeratorShift - numBox.depth - shift, minNumGap);
    // const denGap = Math.max(
    //     shift + denominatorShift - denBox.height,
    //     minDenGap,
    // );

    const multiplier = multiplierForContext(context);
    const endPadding = thickness; // add extra space around the numerator and denominator
    const width =
        Math.max(
            Math.max(getWidth(numBox), getWidth(denBox)), // TODO: calculate this based on current font size
            30 * multiplier, // empty numerator/denominator width
        ) +
        2 * endPadding;
    const stroke = hpackNat([[makeHRule(thickness, width)]], context);

    const upList = makeList(minNumGap, numBox);
    const dnList = makeList(minDenGap, denBox);

    const fracBox = makeVBox(width, stroke, upList, dnList, context);
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

const getConstantValue = (
    constant: MathValueRecord,
    context: Context,
): number => {
    const {font} = context.fontData;
    const fontSize = fontSizeForContext(context);

    return (constant.value * fontSize) / font.head.unitsPerEm;
};

export const makeSubSup = (
    subBox: Box | null,
    supBox: Box | null,
    context: Context,
    prevEditNode?: Editor.types.Node | Editor.Focus,
    prevLayoutNode?: Node,
): Box => {
    if (!supBox && !subBox) {
        throw new Error("at least one of supBox and subBox must be defined");
    }

    const {font} = context.fontData;

    const width = Math.max(
        supBox ? getWidth(supBox) : 0,
        subBox ? getWidth(subBox) : 0,
    );

    // Some atoms gets wrapped in a box to add padding to them so we need to
    // filter them out.  Anything else that's in a box is some sort of compound
    // layout structure (frac, delimited, etc.) and should have its subscript
    // and/or superscript positioned based on the size of the box.
    if (prevEditNode?.type !== "atom" && prevLayoutNode?.type === "Box") {
        const {
            superscriptBaselineDropMax,
            subscriptBaselineDropMin,
        } = font.math.constants;

        const baselineDropMax = getConstantValue(
            superscriptBaselineDropMax,
            context,
        );
        const baselineDropMin = getConstantValue(
            subscriptBaselineDropMin,
            context,
        );

        const upList = [];
        const dnList = [];

        if (supBox) {
            const shift = prevLayoutNode.height;
            const kernShift = shift - baselineDropMax;

            upList.push(makeKern(kernShift));
            upList.push(supBox);
        }

        if (subBox) {
            const shift = prevLayoutNode.depth;
            const kernSize = shift - baselineDropMin;

            dnList.push(makeKern(kernSize));
            dnList.push(subBox);
        }

        const referenceNode = makeKern(0); // empty reference node
        const subsupBox = makeVBox(
            width,
            referenceNode,
            upList,
            dnList,
            context,
        );

        return subsupBox;
    }

    const {
        subscriptTopMax,
        superscriptBottomMin,
        subscriptShiftDown,
        superscriptShiftUp,
        subSuperscriptGapMin,
        superscriptBottomMaxWithSubscript,
    } = font.math.constants;

    const bottomMin = getConstantValue(superscriptBottomMin, context);
    const shiftUp = getConstantValue(superscriptShiftUp, context);
    const topMax = getConstantValue(subscriptTopMax, context);
    const shiftDown = getConstantValue(subscriptShiftDown, context);

    const upList = [];

    if (supBox) {
        // compute shift in baseline of superscript
        const shift = Math.max(shiftUp, supBox.depth + bottomMin);

        // -supBox.depth is to align the baseline of the superscript with the
        // baseline of the base.
        // TODO: replace the up/dn list that makeVBox uses with something else
        // that doesn't require this correction
        const kernShift = -supBox.depth + shift;

        upList.push(makeKern(kernShift));
        upList.push(supBox);
    }

    const dnList = [];

    if (subBox) {
        // compute shift in baseline of subscript
        let shift = Math.max(shiftDown, subBox.height - topMax);

        if (supBox) {
            const supBoxShift = Math.max(shiftUp, supBox.depth + bottomMin);

            const supBottom = supBoxShift - supBox.depth;
            const subTop = subBox.height - shift;

            const gap = supBottom - subTop;
            const gapMin = getConstantValue(subSuperscriptGapMin, context);

            if (gap < gapMin) {
                if (upList[0].type === "Kern" && upList[1].type === "Box") {
                    // shift the superscript up to increase the gap
                    const correction = gapMin - gap;
                    upList[0].size += correction;

                    // We can't use upList[0].size in the calculation since it
                    // includes the initial -supBox.depth to align baselines.
                    const supBottom =
                        supBoxShift + correction - upList[1].depth;
                    const supBottomMax = getConstantValue(
                        superscriptBottomMaxWithSubscript,
                        context,
                    );

                    if (supBottom > supBottomMax) {
                        // shift both down to maintain to gap
                        const correcion = supBottom - supBottomMax;
                        upList[0].size -= correcion;
                        shift += correcion; // down is positive for dnList
                    }
                }
            }
        }

        // We start with -subBox.height to align the subscript's baseline with
        // the baseline of the base it's attached to
        // TODO: replace the up/dn list that makeVBox uses with something else
        // that doesn't require this correction
        const kernSize = -subBox.height + shift;

        dnList.push(makeKern(kernSize));
        dnList.push(subBox);
    }

    const referenceNode = makeKern(0); // empty reference node
    const subsupBox = makeVBox(width, referenceNode, upList, dnList, context);

    return subsupBox;
};
