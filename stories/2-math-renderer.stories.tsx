import * as React from "react";

import * as Editor from "@math-blocks/editor";
import {MathRenderer} from "@math-blocks/react";
import {Layout, typeset} from "@math-blocks/typesetter";

import fontMetrics from "../packages/metrics/src/index";

console.log(fontMetrics);

const {row, glyph} = Editor;

export default {
    title: "MathRenderer",
    component: MathRenderer,
};

type ID = {
    id: number;
};

export const Small: React.SFC<{}> = () => {
    // TODO: write a function to convert a Semantic AST into an Editor AST
    const math: Editor.Row<Editor.Glyph, ID> = row([
        glyph("2"),
        glyph("x"),
        glyph("+"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("0"),
    ]);
    const fontSize = 20;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };
    const box = typeset(math, context) as Layout.Box;

    return <MathRenderer box={box} />;
};

export const Large: React.SFC<{}> = () => {
    // TODO: how to convert
    const math: Editor.Row<Editor.Glyph, ID> = row([
        glyph("2"),
        glyph("x"),
        glyph("-"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("5"),
    ]);
    const fontSize = 50;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };
    const box = typeset(math, context) as Layout.Box;

    return <MathRenderer box={box} />;
};
