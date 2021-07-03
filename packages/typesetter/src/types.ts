import {MathStyle, RenderMode, RadicalDegreeAlgorithm} from "./enums";

import type {FontData} from "@math-blocks/opentype";

export type Context = {
    readonly fontData: FontData;
    readonly baseFontSize: number;
    readonly mathStyle: MathStyle;
    readonly cramped: boolean;
    // TODO: Create a helper function to add colors to nodes in an Editor tree
    // colorMap?: Map<number, string>;
    readonly operator?: boolean; // if true, doesn't use italics for latin glyphs
    readonly renderMode: RenderMode;
    readonly radicalDegreeAlgorithm?: RadicalDegreeAlgorithm;
};
