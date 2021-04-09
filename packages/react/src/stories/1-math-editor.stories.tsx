import React from "react";
import {action} from "@storybook/addon-actions";

import * as Editor from "@math-blocks/editor-core";
import type {FontData} from "@math-blocks/opentype";

import MathEditor from "../math-editor";
import {FontDataContext} from "../font-data-context";

const {row, glyph} = Editor.builders;

const fontLoader = async (): Promise<FontData> => {
    const {comicSans} = await import("../../../../demo/src/comic-sans");
    return {
        fontMetrics: comicSans,
        fontFamily: "comic sans ms",
    };
};

export default {
    title: "MathEditor",
    component: MathEditor,
    loaders: [fontLoader],
};

type EmptyProps = Record<string, never>;

export const Editable: React.FunctionComponent<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
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
        <FontDataContext.Provider value={fontData}>
            <MathEditor
                readonly={false}
                zipper={zipper}
                focus={true}
                onChange={action("onChange")}
                onSubmit={action("onSubmit")}
            />
        </FontDataContext.Provider>
    );
};

export const Readonly: React.FunctionComponent<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
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

    return (
        <FontDataContext.Provider value={fontData}>
            <MathEditor readonly={true} zipper={zipper} focus={false} />
        </FontDataContext.Provider>
    );
};
