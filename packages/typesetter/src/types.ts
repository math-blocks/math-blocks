import {MathStyle, RenderMode, RadicalDegreeAlgorithm} from "./enums";

import type {FontData} from "@math-blocks/opentype";

export type Context = {
    fontData: FontData;
    baseFontSize: number;
    mathStyle: MathStyle;
    cramped: boolean;
    colorMap?: Map<number, string>;
    operator?: boolean; // if true, doesn't use italics for latin glyphs
    renderMode: RenderMode;
    radicalDegreeAlgorithm?: RadicalDegreeAlgorithm;
};
