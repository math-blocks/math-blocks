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

/**
 * Returns the smallest delimiter whose depth and height exceed the that of the
 * box passed in.
 *
 * @param {string} char
 * @param {Layout.Box} box layout encompassed by the delimiter
 * @returns {number} glyphID
 */
export const getDelimiter = (
    char: string,
    box: Layout.Box,
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

        // TODO: add an option to configure whether these inequalities are
        // strict or not.
        if (height > box.height && depth > box.depth) {
            return record.variantGlyph;
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
 * Returns the smallest surd whose vsize (depth + height) exceed the that of the
 * box passed in.
 *
 * @param {string} char
 * @param {Layout.Box} box layout encompassed by the delimiter
 * @returns {number} glyphID
 */
export const getSurd = (
    char: string,
    box: Layout.Box,
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

        if (height + depth > box.height + box.depth) {
            return record.variantGlyph;
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
