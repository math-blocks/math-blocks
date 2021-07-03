import {MathStyle} from "./enums";
import * as Layout from "./layout";

import type {Context} from "./types";

// TODO: return the font size instead of the multiplier
export const multiplierForContext = (context: Context): number => {
    const {constants} = context.fontData.font.math;
    const {mathStyle} = context;

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

export const fontSizeForContext = (context: Context): number => {
    const multiplier = multiplierForContext(context);
    const {baseFontSize} = context;
    const fontSize = multiplier * baseFontSize;
    return fontSize;
};

type ThresholdOptions = {
    readonly value: "both" | "sum";
    readonly strict: boolean;
};

// TODO: special case how we compute the delimiters for rows including "y" or
// other deep descenders so that we get the same font size as the rest of the
// glyphs on that row.
const getDelimiter = (
    char: string,
    box: Layout.HBox | Layout.VBox,
    thresholdOptions: ThresholdOptions,
    context: Context,
): number => {
    const {font} = context.fontData;

    const glyphID = font.getGlyphID(char);
    const construction = font.math.variants.getVertGlyphConstruction(glyphID);

    if (!construction) {
        return glyphID;
    }

    const fontSize = fontSizeForContext(context);

    for (let i = 0; i < construction.mathGlyphVariantRecords.length; i++) {
        const record = construction.mathGlyphVariantRecords[i];

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
                    // HACK: this is to ensure that we're using the same size
                    // glyph as the row when it contains deep descenders like "y"
                    if (i === 1 && char !== "\u221a") {
                        return glyphID;
                    }
                    return record.variantGlyph;
                }
                break;
            }
            case "sum": {
                if (compare(height + depth, box.height + box.depth)) {
                    // HACK: this is to ensure that we're using the same size
                    // glyph as the row when it contains deep descenders like "y"
                    if (i === 1 && char !== "\u221a") {
                        return glyphID;
                    }
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
    box: Layout.HBox | Layout.VBox,
    thresholdOptions: ThresholdOptions,
    context: Context,
): Layout.Glyph => {
    const glyphID = getDelimiter(char, box, thresholdOptions, context);

    return Layout.makeGlyph(char, glyphID, context);
};
