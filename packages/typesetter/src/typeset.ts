import {UnreachableCaseError} from "@math-blocks/core";
import * as Editor from "@math-blocks/editor-core";

import * as Layout from "./layout";
import {processBox} from "./scene-graph";
import {MathStyle, RenderMode} from "./enums";
import {
    multiplierForMathStyle,
    fontSizeForContext,
    makeDelimiter,
} from "./utils";

import type {Context} from "./types";
import type {Group} from "./scene-graph";

import {constants} from "./math-constants";

// Dedupe this with editor/src/util.ts
export const isGlyph = (
    node: Editor.types.Node,
    char: string,
): node is Editor.types.Atom => node.type === "atom" && node.value.char == char;

const typesetRow = (row: Editor.types.Row, context: Context): Layout.Box => {
    const box = Layout.hpackNat(
        [_typesetChildren(row.children, context)],
        context,
    );
    box.id = row.id;
    box.color = context?.colorMap?.get(row.id);

    if (context.renderMode === RenderMode.Dynamic) {
        ensureMinDepthAndHeight(box, context);
    }

    return box;
};

// TODO: check to see if there's an "=" in the previous column of any of the rows
const withOperatorPadding = (
    node: Layout.Node,
    context: Context,
): Layout.Node => {
    const fontSize = fontSizeForContext(context);

    // We need to tweak this loic so that we only add padding on the right side
    // for binary operators below.  This is so that we don't get extra space
    // when adding/subtracting something just to the right of an "=" in the above
    return Layout.hpackNat(
        [[Layout.makeKern(fontSize / 4), node, Layout.makeKern(fontSize / 4)]],
        context,
    );
};

/**
 * This function is used to guarantee a certain depth/height for a box that is
 * equal to the depth/height of the cursor or selection rectangle.  This is
 * useful for typesetting while editing since it minimize changes to vertical
 * size of the rendered math.
 *
 * WARNING: This function mutates `box`.
 *
 * TODO: add originalDepth and originalHeight so that getDelimiter can make its
 * decisions based on the original dimensions of the box.
 *
 * @param {Layout.Box} box
 * @param {Context} context
 * @return {void}
 */
const ensureMinDepthAndHeight = (box: Layout.Box, context: Context): void => {
    const {
        fontData: {font},
    } = context;
    const fontSize = fontSizeForContext(context);
    const parenMetrics = font.getGlyphMetrics(font.getGlyphID(")"));

    // This assumes that parenMetrics.height < font.head.unitsPerEm
    const overshoot = (font.head.unitsPerEm - parenMetrics.height) / 2;

    const depth =
        ((parenMetrics.height - parenMetrics.bearingY + overshoot) * fontSize) /
        font.head.unitsPerEm;
    box.depth = Math.max(box.depth, depth);

    const height =
        ((parenMetrics.bearingY + overshoot) * fontSize) / font.head.unitsPerEm;
    box.height = Math.max(box.height, height);
};

const typesetFrac = (
    numerator: Layout.Box,
    denominator: Layout.Box,
    context: Context,
): Layout.Box => {
    return Layout.makeFract(numerator, denominator, context, constants);
};

const typesetSubsup = (
    subBox: Layout.Box | null,
    supBox: Layout.Box | null,
    context: Context,
): Layout.Box => {
    return Layout.makeSubSup(subBox, supBox, context, constants);
};

const typesetRoot = (
    indexBox: Layout.Box | null,
    radicand: Layout.Box,
    context: Context,
): Layout.Box => {
    const multiplier = multiplierForMathStyle(context.mathStyle);

    // Give the radicand a minimal width in case it's empty
    radicand.width = Math.max(radicand.width, 30 * multiplier);

    // TODO: change how we do the index to the following:
    // [index, negative kern, surd, radicand]

    const thresholdOptions = {
        value: "sum" as const,
        strict: true,
    };
    const surdGlyph = makeDelimiter(
        "\u221A",
        radicand,
        thresholdOptions,
        context,
    );
    const surdHBox = Layout.hpackNat([[surdGlyph]], context);

    let surdVBox;
    if (indexBox) {
        // TODO: get this constant from the MATH table constants
        surdHBox.shift = Math.max(0, indexBox.width - 36);
        surdVBox = Layout.makeVBox(
            surdHBox.width + Math.max(0, indexBox.width - 36),
            surdHBox,
            // TODO: get this constant from the MATH table constants
            // TODO: fix how we handle negative kerns, right now we just subtract
            // them from the dimension of the container which isn't right
            [Layout.makeKern(-35.4), indexBox],
            [],
            context,
        );
    } else {
        surdVBox = Layout.makeVBox(surdHBox.width, surdHBox, [], [], context);
    }

    const fontSize = fontSizeForContext(context);
    const thickness = (fontSize * constants.fractionRuleThickness.value) / 1000;
    const stroke = Layout.makeHRule(thickness, radicand.width);

    const vbox = Layout.makeVBox(
        radicand.width,
        radicand,
        [Layout.makeKern(6), stroke],
        [],
        context,
    );
    surdVBox.shift = surdVBox.height - vbox.height;

    const root = Layout.hpackNat([[surdVBox, vbox]], context);

    return root;
};

const typesetLimits = (
    inner: Layout.Node,
    lowerBox: Layout.Box,
    upperBox: Layout.Box | null,
    context: Context,
): Layout.Box => {
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

    return limits;
};

const childContextForFrac = (context: Context): Context => {
    const {mathStyle} = context;

    const childMathStyle = {
        [MathStyle.Display]: MathStyle.Text,
        [MathStyle.Text]: MathStyle.Script,
        [MathStyle.Script]: MathStyle.ScriptScript,
        [MathStyle.ScriptScript]: MathStyle.ScriptScript,
    }[mathStyle];

    const childContext: Context = {
        ...context,
        mathStyle: childMathStyle,
    };

    return childContext;
};

const childContextForSubsup = (context: Context): Context => {
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

const typesetFocus = (
    focus: Editor.Focus,
    zipper: Editor.Zipper,
    context: Context,
): Layout.Box => {
    switch (focus.type) {
        case "zfrac": {
            const childContext = childContextForFrac(context);

            const numerator =
                focus.dir === "left"
                    ? _typesetZipper(zipper, childContext)
                    : typesetRow(focus.other, childContext);

            const denominator =
                focus.dir === "left"
                    ? typesetRow(focus.other, childContext)
                    : _typesetZipper(zipper, childContext);

            const frac = typesetFrac(numerator, denominator, context);

            frac.id = focus.id;
            frac.color = context?.colorMap?.get(focus.id);

            return frac;
        }
        case "zsubsup": {
            const childContext = childContextForSubsup(context);

            const [sub, sup] =
                focus.dir === "left"
                    ? [zipper.row, focus.other]
                    : [focus.other, zipper.row];

            // TODO: document this better so I know what's going on here.
            const subBox =
                sub &&
                (sub.type === "row"
                    ? typesetRow(sub, childContext)
                    : _typesetZipper(zipper, childContext));

            // TODO: document this better so I know what's going on here.
            const supBox =
                sup &&
                (sup.type === "row"
                    ? typesetRow(sup, childContext)
                    : _typesetZipper(zipper, childContext));

            const parentBox = typesetSubsup(subBox, supBox, context);
            parentBox.id = focus.id;

            return parentBox;
        }
        case "zroot": {
            const [ind, rad] =
                focus.dir === "left"
                    ? [zipper.row, focus.other]
                    : [focus.other, zipper.row];

            const radicand =
                rad.type === "row"
                    ? typesetRow(rad, context)
                    : _typesetZipper(zipper, context);

            const indexContext: Context = {
                ...context,
                // It doesn't matter what the mathStyle is of the parent, we
                // always use ScriptScript for root indicies.
                mathStyle: MathStyle.ScriptScript,
            };

            const index = ind
                ? ind.type === "row"
                    ? typesetRow(ind, indexContext)
                    : _typesetZipper(zipper, indexContext)
                : null;

            const root = typesetRoot(index, radicand, context);

            root.id = focus.id;
            root.color = context?.colorMap?.get(root.id);

            return root;
        }
        case "zlimits": {
            const childContext = childContextForLimits(context);

            const [lower, upper] =
                focus.dir === "left"
                    ? [zipper.row, focus.other]
                    : [focus.other, zipper.row];

            const lowerBox =
                lower.type === "row"
                    ? typesetRow(lower, childContext)
                    : _typesetZipper(zipper, childContext);

            const upperBox =
                upper &&
                (upper.type === "row"
                    ? typesetRow(upper, childContext)
                    : _typesetZipper(zipper, childContext));

            const inner = _typeset(focus.inner, {...context, operator: true});
            inner.id = focus.inner.id;
            inner.color = context?.colorMap?.get(inner.id);

            const limits = typesetLimits(inner, lowerBox, upperBox, context);

            limits.id = focus.id;
            limits.color = context?.colorMap?.get(limits.id);

            return limits;
        }
        case "zdelimited": {
            const row = _typesetZipper(zipper, context);

            row.id = focus.id;
            row.color = context?.colorMap?.get(row.id);

            const thresholdOptions = {
                value: "both" as const,
                strict: true,
            };

            const open = makeDelimiter(
                focus.leftDelim.value.char,
                row,
                thresholdOptions,
                context,
            );

            const close = makeDelimiter(
                focus.rightDelim.value.char,
                row,
                thresholdOptions,
                context,
            );

            open.pending = focus.leftDelim.value.pending;
            close.pending = focus.rightDelim.value.pending;

            return Layout.hpackNat([[open, row, close]], context);
        }
        default:
            throw new UnreachableCaseError(focus);
    }
};

const _typeset = (node: Editor.types.Node, context: Context): Layout.Node => {
    const {font} = context.fontData;

    switch (node.type) {
        case "row": {
            // The only time this can happen is if limits.inner is a row
            return typesetRow(node, context);
        }
        case "frac": {
            const childContext = childContextForFrac(context);

            const [num, den] = node.children;
            const numerator = typesetRow(num, childContext);
            const denominator = typesetRow(den, childContext);

            const frac = typesetFrac(numerator, denominator, context);

            frac.id = node.id;
            frac.color = context?.colorMap?.get(node.id);

            return frac;
        }
        case "subsup": {
            const childContext = childContextForSubsup(context);

            const [sub, sup] = node.children;

            const subBox = sub && typesetRow(sub, childContext);
            const supBox = sup && typesetRow(sup, childContext);

            const parentBox = typesetSubsup(subBox, supBox, context);

            parentBox.id = node.id;

            return parentBox;
        }
        case "root": {
            const [ind, rad] = node.children;

            const radicand = typesetRow(rad, context);

            const indexContext: Context = {
                ...context,
                // It doesn't matter what the mathStyle is of the parent, we
                // always use ScriptScript for root indicies.
                mathStyle: MathStyle.ScriptScript,
            };
            const index = ind && typesetRow(ind, indexContext);

            const root = typesetRoot(index, radicand, context);

            root.id = node.id;
            root.color = context?.colorMap?.get(root.id);

            return root;
        }
        case "limits": {
            // TODO: render as a subsup if mathStyle isn't MathStyle.Display

            const childContext = childContextForLimits(context);

            const [lower, upper] = node.children;

            const lowerBox = typesetRow(lower, childContext);
            const upperBox = upper && typesetRow(upper, childContext);

            const inner = _typeset(node.inner, {...context, operator: true});
            inner.id = node.inner.id;
            inner.color = context?.colorMap?.get(inner.id);

            const limits = typesetLimits(inner, lowerBox, upperBox, context);

            limits.id = node.id;
            limits.color = context?.colorMap?.get(limits.id);

            return limits;
        }
        case "delimited": {
            const row = typesetRow(node.children[0], context);

            row.id = node.id;
            row.color = context?.colorMap?.get(row.id);

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

            return Layout.hpackNat([[open, row, close]], context);
        }
        case "atom": {
            const {value} = node;

            const glyphID = font.getGlyphID(value.char);
            let glyph = Layout.makeGlyph(value.char, glyphID, context);

            // Convert individual glyphs to italic glyphs if they exist in the
            // current font.
            if (/[a-z]/.test(value.char) && !context.operator) {
                const offset = value.char.charCodeAt(0) - "a".charCodeAt(0);
                const char = String.fromCodePoint(0x1d44e + offset);
                const glyphID = font.getGlyphID(char);
                glyph = Layout.makeGlyph(char, glyphID, context);
            }

            glyph.id = node.id;
            glyph.color = context.colorMap?.get(node.id);
            return glyph;
        }
        default:
            throw new UnreachableCaseError(node);
    }
};

const _typesetChildren = (
    children: readonly Editor.types.Node[],
    context: Context,
    prevChild?: Editor.types.Node | Editor.Focus,
): readonly Layout.Node[] => {
    return children.map((child, index) => {
        prevChild = index > 0 ? children[index - 1] : prevChild;

        if (child.type === "atom") {
            // TODO: Create a separate function for typesetting glyphs
            const glyph = _typeset(child, context);
            const {value} = child;
            const unary =
                /[+\u2212]/.test(value.char) &&
                (prevChild
                    ? prevChild.type === "atom" &&
                      /[+\u2212<>\u2260=\u2264\u2265\u00B1(]/.test(
                          prevChild.value.char,
                      )
                    : true);
            if (
                !unary &&
                /[+\-\u00B7\u2212<>\u2260=\u2264\u2265\u00B1]/.test(value.char)
            ) {
                const box = context.cramped
                    ? glyph
                    : withOperatorPadding(glyph, context);
                box.id = child.id;
                return box;
            } else {
                glyph.id = child.id;
                if (glyph.type === "Glyph") {
                    glyph.pending = child.value.pending;
                }
                return glyph;
            }
        } else {
            return _typeset(child, context);
        }
    });
};

const _typesetZipper = (
    zipper: Editor.Zipper,
    context: Context,
): Layout.Box => {
    const [crumb, ...restCrumbs] = zipper.breadcrumbs;

    if (crumb) {
        const row = crumb.row;

        if (row.selection) {
            const left = _typesetChildren(row.left, context);
            const nextZipper: Editor.Zipper = {
                ...zipper,
                breadcrumbs: restCrumbs,
            };
            const selection =
                row.selection.dir === "left"
                    ? [
                          ..._typesetChildren(
                              row.selection.nodes,
                              context,
                              row.left[row.left.length - 1],
                          ),
                          typesetFocus(crumb.focus, nextZipper, context),
                      ]
                    : [
                          typesetFocus(crumb.focus, nextZipper, context),
                          ..._typesetChildren(
                              row.selection.nodes,
                              context,
                              crumb.focus,
                          ),
                      ];
            const right = _typesetChildren(
                row.right,
                context,
                row.selection.dir === "left" || row.selection.nodes.length === 0
                    ? crumb.focus
                    : row.selection.nodes[row.selection.nodes.length - 1],
            );

            const box = Layout.hpackNat([left, selection, right], context);
            box.id = row.id;
            box.color = context?.colorMap?.get(box.id);

            if (context.renderMode === RenderMode.Dynamic) {
                ensureMinDepthAndHeight(box, context);
            }

            return box;
        } else {
            const nodes: Layout.Node[] = [];

            nodes.push(..._typesetChildren(row.left, context));
            const nextZipper: Editor.Zipper = {
                ...zipper,
                breadcrumbs: restCrumbs,
            };
            nodes.push(typesetFocus(crumb.focus, nextZipper, context));
            nodes.push(..._typesetChildren(row.right, context, crumb.focus));

            const box = Layout.hpackNat([nodes], context);
            box.id = row.id;
            box.color = context?.colorMap?.get(box.id);

            if (context.renderMode === RenderMode.Dynamic) {
                ensureMinDepthAndHeight(box, context);
            }

            return box;
        }
    } else {
        const row = zipper.row;

        const left = _typesetChildren(row.left, context);
        const selection = row.selection
            ? _typesetChildren(
                  row.selection.nodes,
                  context,
                  row.left[row.left.length - 1],
              )
            : [];
        const prevLastChild = row.selection
            ? row.selection.nodes[row.selection.nodes.length - 1]
            : row.left[row.left.length - 1];
        const right = _typesetChildren(row.right, context, prevLastChild);

        const box = Layout.hpackNat([left, selection, right], context);
        box.id = row.id;
        box.color = context?.colorMap?.get(box.id);

        if (context.renderMode === RenderMode.Dynamic) {
            ensureMinDepthAndHeight(box, context);
        }

        return box;
    }
};

type Options = {
    showCursor?: boolean;
};

export const typesetZipper = (
    zipper: Editor.Zipper,
    context: Context,
    options: Options = {},
): Group => {
    const box = _typesetZipper(zipper, context) as Layout.Box;
    return processBox(box, context.fontData, options);
};

export const typeset = (
    node: Editor.types.Node,
    context: Context,
    options: Options = {},
): Group => {
    const box = _typeset(node, context) as Layout.Box;
    return processBox(box, context.fontData, options);
};
