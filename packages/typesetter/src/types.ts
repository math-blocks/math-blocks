import {MathStyle, RenderMode} from "./enums";

import type {FontData} from "@math-blocks/opentype";
import type {LayoutCursor, Point} from "./scene-graph";

export type Context = {
    fontData: FontData;
    baseFontSize: number;
    mathStyle: MathStyle;
    cramped: boolean;
    colorMap?: Map<number, string>;
    operator?: boolean; // if true, doesn't use italics for latin glyphs
    renderMode: RenderMode;
};

export type Options = {
    cursor?: LayoutCursor | undefined;
    cancelRegions?: readonly LayoutCursor[] | undefined;
    loc?: Point | undefined;
};
