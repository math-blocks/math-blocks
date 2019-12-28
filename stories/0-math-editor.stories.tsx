import React from "react";
import {action} from "@storybook/addon-actions";

import * as Editor from "../src/editor/editor";
import fontMetrics from "../metrics/comic-sans.json";
import MathEditor from "../src/components/math-editor";
import {parse} from "../src/text/text-parser";
import {Box} from "../src/typesetting/layout";
import typeset from "../src/typesetting/typeset";

const {row, glyph, frac} = Editor;

export default {
    title: "MathEditor",
};

export const Editable = () => {
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

    return <MathEditor readonly={false} value={math} focus={false} />;
};

export const Readonly = () => {
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

    return <MathEditor readonly={true} value={math} focus={false} />;
};

// emoji.story = {
//     name: "with emoji",
// };
