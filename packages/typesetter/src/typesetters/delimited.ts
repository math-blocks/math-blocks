import * as Editor from "@math-blocks/editor-core";

import * as Layout from "../layout";
import {makeDelimiter} from "../utils";

import type {Context} from "../types";

export const typesetDelimited = (
    row: Layout.HBox,
    node: Editor.types.Delimited | Editor.ZDelimited,
    context: Context,
): Layout.HBox => {
    const thresholdOptions = {
        value: "both" as const,
        strict: true,
    };

    const open = makeDelimiter(
        node.leftDelim.value.char,
        row,
        thresholdOptions,
        context,
    );

    const close = makeDelimiter(
        node.rightDelim.value.char,
        row,
        thresholdOptions,
        context,
    );

    open.pending = node.leftDelim.value.pending;
    close.pending = node.rightDelim.value.pending;

    const delimited = Layout.makeStaticHBox([open, row, close], context);

    delimited.id = node.id;
    delimited.style = node.style;

    return delimited;
};
