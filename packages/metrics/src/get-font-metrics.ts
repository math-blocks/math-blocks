import type {Font} from "opentype.js";

import type {FontMetrics, GlyphMetrics} from "./types";

export const getFontMetrics = (font: Font): FontMetrics => {
    return {
        unitsPerEm: font.tables["head"].unitsPerEm,
        ascender: font.tables["hhea"].ascender,
        descender: font.tables["hhea"].descender,
        getGlyphMetrics: (charCode: number): GlyphMetrics => {
            const glyph = font.charToGlyph(String.fromCharCode(charCode));
            const metrics = glyph.getMetrics();

            return {
                advance: glyph.advanceWidth,
                bearingX: metrics.xMin,
                bearingY: metrics.yMax,
                width: metrics.xMax - metrics.xMin,
                height: metrics.yMax - metrics.yMin,
            };
        },
    };
};
