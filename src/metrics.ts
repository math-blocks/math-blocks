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
    glyphMetrics: Partial<{
        [charCode: number]: GlyphMetrics;
    }>;
};
