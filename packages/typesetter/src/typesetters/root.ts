import * as Layout from "../layout";

import {RadicalDegreeAlgorithm} from "../enums";
import {
    multiplierForContext,
    fontSizeForContext,
    makeDelimiter,
} from "../utils";

import type {Context} from "../types";

export const typesetRoot = (
    // TODO: rename all uses of radical `index` to `degree` to match this
    degree: Layout.HBox | null,
    radicand: Layout.HBox,
    context: Context,
): Layout.HBox => {
    const multiplier = multiplierForContext(context);

    // Give the radicand a minimal width in case it's empty
    radicand.width = Math.max(radicand.width, 30 * multiplier);

    const thresholdOptions = {
        value: "sum" as const,
        strict: true,
    };

    const surd = Layout.makeStaticHBox(
        [makeDelimiter("\u221A", radicand, thresholdOptions, context)],
        context,
    );

    const fontSize = fontSizeForContext(context);
    const {font} = context.fontData;
    const {constants} = context.fontData.font.math;
    const thickness =
        (fontSize * constants.radicalRuleThickness.value) /
        font.head.unitsPerEm;
    const endPadding = thickness; // Add extra space at the end of the radicand
    const stroke = Layout.makeHRule(thickness, radicand.width + endPadding);

    const radicalWithRule = Layout.makeVBox(
        radicand.width,
        radicand,
        [Layout.makeKern(6), stroke],
        [],
        context,
    );

    // Compute the shift to align the top of the surd with the radical rule
    const shift = surd.height - radicalWithRule.height;

    surd.shift = shift;

    let root;
    if (degree) {
        const afterDegreeKern = Layout.makeKern(
            (fontSize * constants.radicalKernAfterDegree.value) /
                font.head.unitsPerEm,
        );

        // TODO: take into account constants.radicalKernBeforeDegree
        const beforeDegreeKern = Layout.makeKern(
            Math.max(0, -afterDegreeKern.size - degree.width),
        );

        // This follows the instructions from 3.3.3.3 describing the alphabetic
        // baseline of the index.
        // https://mathml-refresh.github.io/mathml-core/#root-with-index
        //
        // NOTE: This doesn't account for an index with a large descender, but
        // neither does TeX's layout algorithm.  Most of the the time the index
        // is a single number or `n`, neither of whcih have a descender.
        const degreeBottomRaisePercent =
            constants.radicalDegreeBottomRaisePercent / 100;

        // We default to MathML/Word beahavior since that's what most fonts
        // seem to use.
        const algorithm =
            context.radicalDegreeAlgorithm ?? RadicalDegreeAlgorithm.MathML;

        switch (algorithm) {
            case RadicalDegreeAlgorithm.OpenType:
                degree.shift =
                    shift - // match shift of surdHBox
                    // The OpenType spec says `radicalDegreeBottomRaisePercent` is
                    // with respect to the ascender of the radical glyph.
                    degreeBottomRaisePercent * surd.height;
                break;
            case RadicalDegreeAlgorithm.MathML:
                degree.shift =
                    shift + // match shift of surdHBox
                    surd.depth - // align the index to the bottom of surdHBox
                    // The MathML Core spec says `radicalDegreeBottomRaisePercent`
                    // is with respect to the height of the radical glyph.
                    degreeBottomRaisePercent * Layout.vsize(surd);
                break;
        }

        root = Layout.makeStaticHBox(
            [beforeDegreeKern, degree, afterDegreeKern, surd, radicalWithRule],
            context,
        );
    } else {
        root = Layout.makeStaticHBox([surd, radicalWithRule], context);
    }

    root.width += endPadding;

    return root;
};
