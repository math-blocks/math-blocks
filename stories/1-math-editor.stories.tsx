import React from "react";
import {action} from "@storybook/addon-actions";

import * as Editor from "@math-blocks/editor";
import {MathEditor} from "@math-blocks/react";

const {row, glyph} = Editor;

export default {
    title: "MathEditor",
    component: MathEditor,
};

type ID = {
    id: number;
};

export const Editable: React.SFC<{}> = () => {
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

    return (
        <MathEditor
            readonly={false}
            value={math}
            focus={false}
            onChange={action("onChange")}
            onSubmit={action("onSubmit")}
        />
    );
};

export const Readonly: React.SFC<{}> = () => {
    // TODO: how to convert
    const math: Editor.Row<Editor.Glyph, ID> = row([
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
