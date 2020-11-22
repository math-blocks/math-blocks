import {FontMetrics} from "./metrics";

export type Context = {
    fontMetrics: FontMetrics;
    baseFontSize: number;
    multiplier: number; // roughly maps to display, text, script, and scriptscript in LaTeX
    cramped: boolean;
    colorMap?: Map<number, string>;
};
