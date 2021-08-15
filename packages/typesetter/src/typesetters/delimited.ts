import * as Editor from "@math-blocks/editor-core";
import type {Mutable} from "utility-types";

import * as Layout from "../layout";
import {makeDelimiter} from "../utils";

import type {Context} from "../types";

export const typesetDelimited = (
    typesetChild: (index: number, context: Context) => Layout.HBox | null,
    node: Editor.types.CharDelimited | Editor.ZDelimited,
    context: Context,
): Layout.HBox => {
    const thresholdOptions = {
        value: "both" as const,
        strict: true,
    };

    const row = typesetChild(0, context);
    if (!row) {
        throw new Error("Delimited's content should be defined");
    }

    const open = makeDelimiter(
        node.leftDelim.value,
        row,
        thresholdOptions,
        context,
    ) as Mutable<Layout.Glyph>;

    const close = makeDelimiter(
        node.rightDelim.value,
        row,
        thresholdOptions,
        context,
    ) as Mutable<Layout.Glyph>;

    open.pending = node.leftDelim.pending;
    close.pending = node.rightDelim.pending;

    const delimited = Layout.makeStaticHBox(
        [open, row, close],
        context,
    ) as Mutable<Layout.HBox>;

    delimited.id = node.id;
    delimited.style = node.style;

    return delimited;
};
