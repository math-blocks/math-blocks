import React from "react";
import {action} from "@storybook/addon-actions";

import * as Editor from "@math-blocks/editor-core";

import MathEditor from "../src/math-editor";

const {row, glyph} = Editor.builders;

export default {
    title: "MathEditor",
    component: MathEditor,
};

type EmptyProps = Record<string, never>;

export const Editable: React.FunctionComponent<EmptyProps> = () => {
    // TODO: write a function to convert a Semantic AST into an Editor AST
    const math = row([
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
            rows={[math]}
            focus={true}
            onChange={action("onChange")}
            onSubmit={action("onSubmit")}
        />
    );
};

export const Readonly: React.FunctionComponent<EmptyProps> = () => {
    // TODO: how to convert
    const math = row([
        glyph("2"),
        glyph("x"),
        glyph("+"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("0"),
    ]);

    return <MathEditor readonly={true} rows={[math]} focus={false} />;
};
