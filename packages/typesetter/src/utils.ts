import {MathStyle} from "./enums";
import {constants} from "./math-constants";
import * as Layout from "./layout";

import type {Context} from "./types";

// TODO: in the future pass in constants as an arg as well
// TODO: return the font size instead of the multiplier
export const multiplierForMathStyle = (mathStyle: MathStyle): number => {
    switch (mathStyle) {
        case MathStyle.Display:
        case MathStyle.Text:
            return 1.0;
        case MathStyle.Script:
            return constants.scriptPercentScaleDown / 100;
        case MathStyle.ScriptScript:
            return constants.scriptScriptPercentScaleDown / 100;
    }
};

type ThresholdOptions = {
    value: "both" | "sum";
    strict: boolean;
};

const getDelimiter = (
    char: string,
    box: Layout.Box,
    thresholdOptions: ThresholdOptions,
    context: Context,
): number => {
    const {font} = context.fontData;

    const glyphID = font.getGlyphID(char);
    const construction = font.math.variants.getVertGlyphConstruction(glyphID);

    if (!construction) {
        return glyphID;
    }

    const {baseFontSize, mathStyle} = context;
    const multiplier = multiplierForMathStyle(mathStyle);
    const fontSize = multiplier * baseFontSize;

    for (const record of construction.mathGlyphVariantRecords) {
        const glyphMetrics = font.getGlyphMetrics(record.variantGlyph);
        const height =
            (glyphMetrics.bearingY * fontSize) / font.head.unitsPerEm;
        const depth =
            ((glyphMetrics.height - glyphMetrics.bearingY) * fontSize) /
            font.head.unitsPerEm;

        const compare = thresholdOptions.strict
            ? (a: number, b: number) => a > b
            : (a: number, b: number) => a >= b;

        // TODO: add an option to configure whether these inequalities are
        // strict or not.
        switch (thresholdOptions.value) {
            case "both": {
                if (compare(height, box.height) && compare(depth, box.depth)) {
                    return record.variantGlyph;
                }
                break;
            }
            case "sum": {
                if (compare(height + depth, box.height + box.depth)) {
                    return record.variantGlyph;
                }
                break;
            }
        }
    }

    if (construction.mathGlyphVariantRecords.length > 0) {
        // TODO: return a glyph assembly layout instead of the tallest delim
        return construction.mathGlyphVariantRecords[
            construction.mathGlyphVariantRecords.length - 1
        ].variantGlyph;
    }

    return glyphID;
};

/**
 * Returns the smallest delimiter whose depth and height exceed the that of the
 * box passed in.  `thresholdOptions` controls how this comparison is made.
 *
 * @param {string} char
 * @param {Layout.Box} box layout encompassed by the delimiter
 * @param {ThresholdOptions} options
 * @param {Context} context
 * @returns {Layout.Glyph}
 */
export const makeDelimiter = (
    char: string,
    box: Layout.Box,
    thresholdOptions: ThresholdOptions,
    context: Context,
): Layout.Glyph => {
    const glyphID = getDelimiter(char, box, thresholdOptions, context);

    return Layout.makeGlyph(char, glyphID, context);
};
