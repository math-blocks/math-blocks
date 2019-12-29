import React from "react";

import * as Editor from "../src/editor/editor";
import fontMetrics from "../metrics/comic-sans.json";
import MathRenderer from "../src/components/math-renderer";
import {Box} from "../src/typesetting/layout";
import typeset from "../src/typesetting/typeset";

const {row, glyph} = Editor;

export default {
    title: "MathRenderer",
};

export const Small: React.SFC<{}> = () => {
    // TODO: write a function to convert a Semantic AST into an Editor AST
    const math: Editor.Row<Editor.Glyph> = row([
        glyph("2"),
        glyph("x"),
        glyph("+"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("0"),
    ]);
    const fontSize = 20;
    const box = typeset(fontMetrics)(fontSize)(1.0)(math) as Box;

    return <MathRenderer box={box} />;
};

export const Large: React.SFC<{}> = () => {
    // TODO: how to convert
    const math: Editor.Row<Editor.Glyph> = row([
        glyph("2"),
        glyph("x"),
        glyph("-"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("5"),
    ]);
    const fontSize = 50;
    const box = typeset(fontMetrics)(fontSize)(1.0)(math) as Box;

    return <MathRenderer box={box} />;
};
