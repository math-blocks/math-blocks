import React from "react";
import {action} from "@storybook/addon-actions";

import * as Editor from "../src/editor/editor";
import fontMetrics from "../metrics/comic-sans.json";
import MathRenderer from "../src/components/math-renderer";
import {parse} from "../src/text/text-parser";
import {Box} from "../src/typesetting/layout";
import typeset from "../src/typesetting/typeset";

const {row, glyph, frac} = Editor;

export default {
    title: "MathRenderer",
};

export const Small = () => {
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

export const Large = () => {
    // TODO: how to convert
    const math: Editor.Row<Editor.Glyph> = row([
        glyph("2"),
        glyph("x"),
        glyph("+"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("0"),
    ]);
    const fontSize = 50;
    const box = typeset(fontMetrics)(fontSize)(1.0)(math) as Box;

    return <MathRenderer box={box} />;
};

// emoji.story = {
//     name: "with emoji",
// };
