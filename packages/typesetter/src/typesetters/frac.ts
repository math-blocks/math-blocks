import * as Editor from "@math-blocks/editor-core";

import * as Layout from "../layout";
import {multiplierForContext, fontSizeForContext} from "../utils";
import {MathStyle} from "../enums";

import type {Context} from "../types";

const makeList = (
    size: Layout.Dist,
    box: Layout.Box,
): readonly Layout.Node[] => [Layout.makeKern(size), box];

export const typesetFrac = (
    typesetChildren: readonly (Layout.Box | null)[],
    node: Editor.types.Frac | Editor.ZFrac,
    context: Context,
): Layout.Box => {
    let [numBox, denBox] = typesetChildren;
    if (!numBox || !denBox) {
        throw new Error("The numerator and denominator must both be defined");
    }

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
            Math.max(Layout.getWidth(numBox), Layout.getWidth(denBox)), // TODO: calculate this based on current font size
            30 * multiplier, // empty numerator/denominator width
        ) +
        2 * endPadding;

    // center the numerator
    if (Layout.getWidth(numBox) < width) {
        const kernSize = (width - Layout.getWidth(numBox)) / 2;
        numBox = Layout.rebox(
            numBox,
            Layout.makeKern(kernSize, "start"),
            Layout.makeKern(kernSize, "end"),
        );
    }

    // center the denominator
    if (Layout.getWidth(denBox) < width) {
        const kernSize = (width - Layout.getWidth(denBox)) / 2;
        denBox = Layout.rebox(
            denBox,
            Layout.makeKern(kernSize, "start"),
            Layout.makeKern(kernSize, "end"),
        );
    }

    const upList = makeList(minNumGap, numBox);
    const dnList = makeList(minDenGap, denBox);
    const stroke = Layout.hpackNat(
        [[Layout.makeHRule(thickness, width)]],
        context,
    );

    const fracBox = Layout.makeVBox(width, stroke, upList, dnList, context);
    fracBox.shift = -shift;

    fracBox.id = node.id;
    fracBox.style = node.style;

    return fracBox;
};