import * as Editor from "@math-blocks/editor-core";

import * as Layout from "../layout";

import type {Context} from "../types";

// TODO: render as a subsup if mathStyle isn't MathStyle.Display
export const typesetLimits = (
    typesetChildren: readonly (Layout.Box | null)[],
    node: Editor.types.Limits | Editor.ZLimits,
    inner: Layout.Node,
    context: Context,
): Layout.Box => {
    const [lowerBox, upperBox] = typesetChildren;

    if (!lowerBox) {
        throw new Error("Lower limit should always be defined");
    }

    const innerWidth = Layout.getWidth(inner);
    const width = Math.max(
        innerWidth,
        lowerBox.width || 0,
        upperBox?.width || 0,
    );

    const newInner =
        innerWidth < width
            ? Layout.hpackNat(
                  [
                      [
                          Layout.makeKern((width - innerWidth) / 2),
                          inner,
                          Layout.makeKern((width - innerWidth) / 2),
                      ],
                  ],
                  context,
              )
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
    );

    limits.id = node.id;
    limits.style = node.style;

    return limits;
};
