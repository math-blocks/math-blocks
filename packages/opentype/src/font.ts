import type {Glyph, GlyphMetrics} from "./types";
import type {HeaderTable} from "./tables/head";
import type {MathConstants} from "./tables/math";

export type Font = {
    head: HeaderTable;
    math: MathConstants;
    glyphIndexMap: Record<number, number>;

    getGlyph: (gid: number) => Glyph;
    getGlyphMetrics: (gid: number) => GlyphMetrics;
};
