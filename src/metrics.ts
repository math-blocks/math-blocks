import {$Shape} from "utility-types";

export type GlyphMetrics = {
    advance: number;
    bearingX: number;
    bearingY: number;
    width: number;
    height: number;
};

export type FontMetrics = {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    glyphMetrics: $Shape<{
        [charCode: number]: GlyphMetrics;
    }>;
};
