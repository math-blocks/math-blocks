import {UnreachableCaseError} from "@math-blocks/core";
import * as Editor from "@math-blocks/editor-core";

import * as Layout from "./layout";
import {processBox} from "./scene-graph";
import {MathStyle} from "./enums";
import {multiplierForMathStyle} from "./utils";

import type {Context} from "./types";
import type {Group} from "./scene-graph";

import {constants} from "./math-constants";

// Dedupe this with editor/src/util.ts
export const isGlyph = (
    node: Editor.types.Node,
    char: string,
): node is Editor.types.Atom => node.type === "atom" && node.value.char == char;

const typesetRow = (row: Editor.types.Row, context: Context): Layout.Box => {
    const box = Layout.hpackNat([_typesetChildren(row.children, context)]);
    box.id = row.id;
    box.color = context?.colorMap?.get(row.id);

    return box;
};

// TODO: check to see if there's an "=" in the previous column of any of the rows
const withOperatorPadding = (
    node: Layout.Node,
    context: Context,
): Layout.Node => {
    const {baseFontSize, mathStyle} = context;
    const multiplier = multiplierForMathStyle(mathStyle);
    const fontSize = multiplier * baseFontSize;

    // We need to tweak this loic so that we only add padding on the right side
    // for binary operators below.  This is so that we don't get extra space
    // when adding/subtracting something just to the right of an "=" in the above
    return Layout.hpackNat([
        [Layout.makeKern(fontSize / 4), node, Layout.makeKern(fontSize / 4)],
    ]);
};

const typesetFrac = (
    numerator: Layout.Box,
    denominator: Layout.Box,
    context: Context,
): Layout.Box => {
    const {fontData, baseFontSize, cramped} = context;
    const {fontMetrics} = fontData;
    const jmetrics = fontMetrics.getGlyphMetrics("j".charCodeAt(0));
    const Emetrics = fontMetrics.getGlyphMetrics("E".charCodeAt(0));

    const newMultiplier = cramped ? 0.5 : 1.0;

    // TODO: Use the commented out code when render static math content

    // const descent =
    //     (newMultiplier * baseFontSize * fontMetrics.descender) /
    //     fontMetrics.unitsPerEm;

    // numerator.depth = Math.max(numerator.depth, descent);

    // const ascent =
    //     (newMultiplier * baseFontSize * fontMetrics.ascender) /
    //     fontMetrics.unitsPerEm;

    // denominator.height = Math.max(numerator.height, ascent);

    // TODO: try to reuse getCharDepth

    // This code is only for rendering editable math content
    if (jmetrics) {
        const jDepth =
            (baseFontSize *
                newMultiplier *
                (jmetrics.height - jmetrics.bearingY)) /
            fontMetrics.unitsPerEm;
        numerator.depth = Math.max(numerator.depth, jDepth);
        denominator.depth = Math.max(denominator.depth, jDepth);
    }

    // TODO: grab the max bearingY of all of [0-9a-zA-Z]
    if (Emetrics) {
        const EHeight =
            (baseFontSize * newMultiplier * Emetrics.bearingY) /
            fontMetrics.unitsPerEm;
        numerator.height = Math.max(numerator.height, EHeight);
        denominator.height = Math.max(denominator.height, EHeight);
    }

    const frac = Layout.makeFract(numerator, denominator, context, constants);

    return frac;
};

const typesetSubsup = (
    subBox: Layout.Box | undefined,
    supBox: Layout.Box | undefined,
    context: Context,
): Layout.Box => {
    const {fontData, baseFontSize, mathStyle} = context;
    const {fontMetrics} = fontData;
    const jmetrics = fontMetrics.getGlyphMetrics("j".charCodeAt(0));
    const Emetrics = fontMetrics.getGlyphMetrics("E".charCodeAt(0));

    const childMathStyle = {
        [MathStyle.Display]: MathStyle.Script,
        [MathStyle.Text]: MathStyle.Script,
        [MathStyle.Script]: MathStyle.ScriptScript,
        [MathStyle.ScriptScript]: MathStyle.ScriptScript,
    }[mathStyle];

    const childMultiplier = multiplierForMathStyle(childMathStyle);

    if (subBox) {
        // TODO: try to reuse getCharDepth
        if (jmetrics) {
            const jDepth =
                (baseFontSize *
                    childMultiplier *
                    (jmetrics.height - jmetrics.bearingY)) /
                fontMetrics.unitsPerEm;
            subBox.depth = Math.max(subBox.depth, jDepth);
        }

        // TODO: grab the max bearingY of all of [0-9a-zA-Z]
        if (Emetrics) {
            const EHeight =
                (baseFontSize * childMultiplier * Emetrics.bearingY) /
                fontMetrics.unitsPerEm;
            subBox.height = Math.max(subBox.height, EHeight);
        }
    }

    if (supBox) {
        // TODO: try to reuse getCharDepth
        if (jmetrics) {
            const jDepth =
                (baseFontSize *
                    childMultiplier *
                    (jmetrics.height - jmetrics.bearingY)) /
                fontMetrics.unitsPerEm;
            supBox.depth = Math.max(supBox.depth, jDepth);
        }

        // TODO: grab the max bearingY of all of [0-9a-zA-Z]
        if (Emetrics) {
            const EHeight =
                (baseFontSize * childMultiplier * Emetrics.bearingY) /
                fontMetrics.unitsPerEm;
            supBox.height = Math.max(supBox.height, EHeight);
        }
    }

    const multiplier = multiplierForMathStyle(mathStyle);
    return Layout.makeSubSup(multiplier, subBox, supBox);
};

const typesetRoot = (
    indexBox: Layout.Box | null,
    radicand: Layout.Box,
    context: Context,
): Layout.Box => {
    const {fontData, baseFontSize, mathStyle} = context;
    const {fontMetrics} = fontData;
    const jmetrics = fontMetrics.getGlyphMetrics("j".charCodeAt(0));
    const Emetrics = fontMetrics.getGlyphMetrics("E".charCodeAt(0));

    const multiplier = multiplierForMathStyle(mathStyle);

    radicand.width = Math.max(radicand.width, 30 * multiplier);
    if (Emetrics) {
        const EHeight =
            (baseFontSize * multiplier * Emetrics.bearingY) /
            fontMetrics.unitsPerEm;
        radicand.height = Math.max(radicand.height, EHeight);
    }
    if (jmetrics) {
        const jDepth =
            (baseFontSize *
                multiplier *
                (jmetrics.height - jmetrics.bearingY)) /
            fontMetrics.unitsPerEm;
        radicand.depth = Math.max(radicand.depth, jDepth);
    }

    // TODO: change how we do the index to the following:
    // [index, negative kern, surd, radicand]

    // TODO: make the surd stretchy
    const surd = Layout.hpackNat([[Layout.makeGlyph("\u221A", context)]]);
    let surdBox;
    if (indexBox) {
        const indexMultiplier = multiplierForMathStyle(MathStyle.ScriptScript);
        if (Emetrics) {
            const EHeight =
                (baseFontSize * indexMultiplier * Emetrics.bearingY) /
                fontMetrics.unitsPerEm;
            indexBox.height = Math.max(indexBox.height, EHeight);
        }
        if (jmetrics) {
            const jDepth =
                (baseFontSize *
                    indexMultiplier *
                    (jmetrics.height - jmetrics.bearingY)) /
                fontMetrics.unitsPerEm;
            indexBox.depth = Math.max(indexBox.depth, jDepth);
        }

        // TODO: get this constant from the MATH table constants
        surd.shift = Math.max(0, indexBox.width - 36);
        surdBox = Layout.makeVBox(
            surd.width + Math.max(0, indexBox.width - 36),
            surd,
            // TODO: get this constant from the MATH table constants
            // TODO: fix how we handle negative kerns, right now we just subtract
            // them from the dimension of the container which isn't right
            [Layout.makeKern(-31.4), indexBox],
            [],
        );
    } else {
        surdBox = Layout.makeVBox(surd.width, surd, [], []);
    }

    const fontSize = multiplier * baseFontSize;
    const thickness = (fontSize * constants.fractionRuleThickness) / 1000;
    const stroke = Layout.makeHRule(thickness, radicand.width);

    const vbox = Layout.makeVBox(
        radicand.width,
        radicand,
        [Layout.makeKern(6), stroke],
        [],
    );
    surdBox.shift = surdBox.height - vbox.height;

    const root = Layout.hpackNat([[surdBox, vbox]]);

    return root;
};

const typesetLimits = (
    inner: Layout.Node,
    lowerBox: Layout.Box,
    upperBox: Layout.Box | undefined,
    context: Context,
): Layout.Box => {
    const {fontData, baseFontSize, mathStyle} = context;
    const {fontMetrics} = fontData;
    const jmetrics = fontMetrics.getGlyphMetrics("j".charCodeAt(0));
    const Emetrics = fontMetrics.getGlyphMetrics("E".charCodeAt(0));

    const childMathStyle = {
        [MathStyle.Display]: MathStyle.Script,
        [MathStyle.Text]: MathStyle.Script,
        [MathStyle.Script]: MathStyle.ScriptScript,
        [MathStyle.ScriptScript]: MathStyle.ScriptScript,
    }[mathStyle];

    const multiplier = multiplierForMathStyle(childMathStyle);

    // TODO: try to reuse getCharDepth
    if (jmetrics) {
        const jDepth =
            (baseFontSize *
                multiplier *
                (jmetrics.height - jmetrics.bearingY)) /
            fontMetrics.unitsPerEm;
        lowerBox.depth = Math.max(lowerBox.depth, jDepth);
        if (upperBox) {
            upperBox.depth = Math.max(upperBox.depth, jDepth);
        }
    }

    // TODO: grab the max bearingY of all of [0-9a-zA-Z]
    if (Emetrics) {
        const EHeight =
            (baseFontSize * multiplier * Emetrics.bearingY) /
            fontMetrics.unitsPerEm;
        lowerBox.height = Math.max(lowerBox.height, EHeight);
        if (upperBox) {
            upperBox.height = Math.max(upperBox.height, EHeight);
        }
    }

    const innerWidth = Layout.getWidth(inner);
    const width = Math.max(
        innerWidth,
        lowerBox.width || 0,
        upperBox?.width || 0,
    );

    const newInner =
        innerWidth < width
            ? Layout.hpackNat([
                  [
                      Layout.makeKern((width - innerWidth) / 2),
                      inner,
                      Layout.makeKern((width - innerWidth) / 2),
                  ],
              ])
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
    );

    return limits;
};

const typesetFocus = (
    focus: Editor.Focus,
    zipper: Editor.Zipper,
    context: Context,
): Layout.Box => {
    const {mathStyle} = context;

    switch (focus.type) {
        case "zfrac": {
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

            const [sub, sup] =
                focus.dir === "left"
                    ? [zipper.row, focus.other]
                    : [focus.other, zipper.row];

            // TODO: document this better so I know what's going on here.
            const subBox = sub
                ? sub.type === "row"
                    ? typesetRow(sub, childContext)
                    : _typesetZipper(zipper, childContext)
                : undefined;

            // TODO: document this better so I know what's going on here.
            const supBox = sup
                ? sup.type === "row"
                    ? typesetRow(sup, childContext)
                    : _typesetZipper(zipper, childContext)
                : undefined;

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
            const childMathStyle = {
                [MathStyle.Display]: MathStyle.Script,
                [MathStyle.Text]: MathStyle.Script,
                [MathStyle.Script]: MathStyle.ScriptScript,
                [MathStyle.ScriptScript]: MathStyle.ScriptScript,
            }[mathStyle];

            const [lower, upper] =
                focus.dir === "left"
                    ? [zipper.row, focus.other]
                    : [focus.other, zipper.row];
            const childContext: Context = {
                ...context,
                mathStyle: childMathStyle,
                cramped: true,
            };

            const lowerBox =
                lower.type === "row"
                    ? typesetRow(lower, childContext)
                    : _typesetZipper(zipper, childContext);

            const upperBox = upper
                ? upper.type === "row"
                    ? typesetRow(upper, childContext)
                    : _typesetZipper(zipper, childContext)
                : undefined;

            const inner = _typeset(focus.inner, context);
            inner.id = focus.inner.id;
            inner.color = context?.colorMap?.get(inner.id);

            const limits = typesetLimits(inner, lowerBox, upperBox, context);

            limits.id = focus.id;
            limits.color = context?.colorMap?.get(limits.id);

            return limits;
        }
    }
};

const _typeset = (node: Editor.types.Node, context: Context): Layout.Node => {
    const {fontData, mathStyle} = context;
    const {fontMetrics} = fontData;

    switch (node.type) {
        case "row": {
            // The only time this can happen is if limits.inner is a row
            return typesetRow(node, context);
        }
        case "frac": {
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

            const [num, den] = node.children;
            const numerator = typesetRow(num, childContext);
            const denominator = typesetRow(den, childContext);

            const frac = typesetFrac(numerator, denominator, context);

            frac.id = node.id;
            frac.color = context?.colorMap?.get(node.id);

            return frac;
        }
        case "subsup": {
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

            const [sub, sup] = node.children;

            const subBox = sub ? typesetRow(sub, childContext) : undefined;
            const supBox = sup ? typesetRow(sup, childContext) : undefined;

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

            const childMathStyle = {
                [MathStyle.Display]: MathStyle.Script,
                [MathStyle.Text]: MathStyle.Script,
                [MathStyle.Script]: MathStyle.ScriptScript,
                [MathStyle.ScriptScript]: MathStyle.ScriptScript,
            }[mathStyle];

            const [lower, upper] = node.children;
            const childContext: Context = {
                ...context,
                mathStyle: childMathStyle,
                cramped: true,
            };

            const lowerBox = typesetRow(lower, childContext);
            const upperBox = upper
                ? typesetRow(upper, childContext)
                : undefined;

            const inner = _typeset(node.inner, context);
            inner.id = node.inner.id;
            inner.color = context?.colorMap?.get(inner.id);

            const limits = typesetLimits(inner, lowerBox, upperBox, context);

            limits.id = node.id;
            limits.color = context?.colorMap?.get(limits.id);

            return limits;
        }
        case "atom": {
            const {value} = node;
            let glyph = Layout.makeGlyph(value.char, context);

            // Convert individual glyphs to italic glyphs if they exist in the
            // current font.
            if (/[a-z]/.test(value.char)) {
                const offset = value.char.charCodeAt(0) - "a".charCodeAt(0);
                const char = String.fromCodePoint(0x1d44e + offset);
                if (fontMetrics.hasChar(char)) {
                    glyph = Layout.makeGlyph(char, context);
                }
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

            const box = Layout.hpackNat([left, selection, right]);
            box.id = row.id;
            box.color = context?.colorMap?.get(box.id);

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

            const box = Layout.hpackNat([nodes]);
            box.id = row.id;
            box.color = context?.colorMap?.get(box.id);

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

        const box = Layout.hpackNat([left, selection, right]);
        box.id = row.id;
        box.color = context?.colorMap?.get(box.id);

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
