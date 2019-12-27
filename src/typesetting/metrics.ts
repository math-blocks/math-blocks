export type GlyphMetrics = {
    readonly advance: number;
    readonly bearingX: number;
    readonly bearingY: number;
    readonly width: number;
    readonly height: number;
};

export type FontMetrics = {
    readonly unitsPerEm: number;
    readonly ascender: number;
    readonly descender: number;
    readonly glyphMetrics: Partial<{
        readonly [charCode: number]: GlyphMetrics;
    }>;
};
