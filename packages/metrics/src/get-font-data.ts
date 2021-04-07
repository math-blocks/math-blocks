import type {Font} from "opentype.js";

import type {FontData, GlyphMetrics} from "./types";

export const getFontData = (font: Font, fontFamily: string): FontData => {
    const fontMetrics = {
        unitsPerEm: font.tables["head"].unitsPerEm,
        ascender: font.tables["hhea"].ascender,
        descender: font.tables["hhea"].descender,
        getGlyphMetrics: (
            codePoint: number | undefined,
        ): GlyphMetrics | null => {
            if (codePoint === undefined) {
                return null;
            }
            const glyph = font.charToGlyph(String.fromCodePoint(codePoint));
            const metrics = glyph.getMetrics();

            return {
                advance: glyph.advanceWidth,
                bearingX: metrics.xMin,
                bearingY: metrics.yMax, // invert the y-axis
                width: metrics.xMax - metrics.xMin,
                height: metrics.yMax - metrics.yMin,
            };
        },
        hasChar: (char: string): boolean => {
            return font.hasChar(char);
        },
    };

    return {
        fontMetrics: fontMetrics,
        fontFamily: fontFamily,
    };
};
