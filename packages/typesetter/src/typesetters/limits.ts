import * as Editor from "@math-blocks/editor-core";
import type {Mutable} from "utility-types";

import * as Layout from "../layout";
import {MathStyle} from "../enums";

import type {Context} from "../types";

const childContextForLimits = (context: Context): Context => {
    const {mathStyle} = context;

    const childMathStyle = {
        [MathStyle.Display]: MathStyle.Script,
        [MathStyle.Text]: MathStyle.Script,
        [MathStyle.Script]: MathStyle.ScriptScript,
        [MathStyle.ScriptScript]: MathStyle.ScriptScript,
    }[mathStyle];

    const childContext: Context = {
        ...context,
        mathStyle: childMathStyle,
        cramped: true,
    };

    return childContext;
};

// TODO: render as a subsup if context.mathStyle isn't MathStyle.Display
export const typesetLimits = (
    typesetChild: (index: number, context: Context) => Layout.HBox | null,
    node: Editor.types.Limits | Editor.ZLimits,
    context: Context,
    typesetNode: (node: Editor.types.CharNode, context: Context) => Layout.Node,
): Layout.VBox => {
    const childContext = childContextForLimits(context);
    const lowerBox = typesetChild(
        0,
        childContext,
    ) as Mutable<Layout.HBox> | null;
    const upperBox = typesetChild(
        1,
        childContext,
    ) as Mutable<Layout.HBox> | null;

    if (!lowerBox) {
        throw new Error("Lower limit should always be defined");
    }

    const inner = typesetNode(node.inner, {
        ...context,
        operator: true,
    }) as Mutable<Layout.Node>;
    inner.id = node.inner.id;
    inner.style = {
        ...inner.style,
        color: node.inner.style.color,
    };

    const innerWidth = Layout.getWidth(inner);
    const width = Math.max(
        innerWidth,
        lowerBox.width || 0,
        upperBox?.width || 0,
    );

    const newInner =
        innerWidth < width
            ? (Layout.makeStaticHBox(
                  [
                      Layout.makeKern((width - innerWidth) / 2),
                      inner,
                      Layout.makeKern((width - innerWidth) / 2),
                  ],
                  context,
              ) as Mutable<Layout.HBox>)
            : inner;
    if (lowerBox.width < width) {
        lowerBox.shift = (width - lowerBox.width) / 2;
    }
    if (upperBox && upperBox.width < width) {
        upperBox.shift = (width - upperBox.width) / 2;
    }

    const limits = Layout.makeVBox(
        width,
        newInner,
        upperBox ? [Layout.makeKern(6), upperBox] : [],
        [Layout.makeKern(4), lowerBox],
        context,
    ) as Mutable<Layout.VBox>;

    limits.id = node.id;
    limits.style = node.style;

    return limits;
};
