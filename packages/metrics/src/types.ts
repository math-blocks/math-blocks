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
    getGlyphMetrics: (charCode: number) => GlyphMetrics | null;
    glyphMetrics: Record<number, GlyphMetrics>;
};
