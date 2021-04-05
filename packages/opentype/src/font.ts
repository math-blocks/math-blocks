import type {Glyph} from "./types";
import type {HeaderTable} from "./head";
import type {MathConstants} from "./math";

export type Font = {
    head: HeaderTable;
    math: MathConstants;
    glyphIndexMap: Record<number, number>;
    getGlyph: (gid: number) => Glyph;
};
