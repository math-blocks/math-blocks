import React from "react";
import {action} from "@storybook/addon-actions";

import * as Editor from "@math-blocks/editor-core";

import ZipperEditor from "../zipper-editor";

const {row, glyph} = Editor.builders;

export default {
    title: "ZipperEditor",
    component: ZipperEditor,
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

    const zipper: Editor.Zipper = {
        breadcrumbs: [],
        row: {
            id: math.id,
            type: "zrow",
            left: [],
            selection: null,
            right: math.children,
        },
    };

    return (
        <ZipperEditor
            readonly={false}
            zipper={zipper}
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

    const zipper: Editor.Zipper = {
        breadcrumbs: [],
        row: {
            id: math.id,
            type: "zrow",
            left: [],
            selection: null,
            right: math.children,
        },
    };

    return <ZipperEditor readonly={true} zipper={zipper} focus={false} />;
};
