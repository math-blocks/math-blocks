import {FontMetrics} from "./metrics";
import {LayoutCursor, Point} from "./scene-graph";

export type Context = {
    fontMetrics: FontMetrics;
    baseFontSize: number;
    multiplier: number; // roughly maps to display, text, script, and scriptscript in LaTeX
    cramped: boolean;
    colorMap?: Map<number, string>;
};

export type Options = {
    cursor?: LayoutCursor | undefined;
    cancelRegions?: LayoutCursor[] | undefined;
    loc?: Point | undefined;
};
