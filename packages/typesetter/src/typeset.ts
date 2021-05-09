import {UnreachableCaseError} from "@math-blocks/core";
import * as Editor from "@math-blocks/editor-core";

import * as Layout from "./layout";
import {processBox} from "./scene-graph";
import {MathStyle, RenderMode, RadicalDegreeAlgorithm} from "./enums";
import {multiplierForContext, fontSizeForContext, makeDelimiter} from "./utils";

import type {Context} from "./types";
import type {Scene} from "./scene-graph";

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
 * @param {Layout.Box} dim
 * @param {Context} context
 * @return {void}
 */
const ensureMinDepthAndHeight = (dim: Layout.Dim, context: Context): void => {
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
    dim.depth = Math.max(dim.depth, depth);

    const height =
        ((parenMetrics.bearingY + overshoot) * fontSize) / font.head.unitsPerEm;
    dim.height = Math.max(dim.height, height);
};

const typesetFrac = (
    numerator: Layout.Box,
    denominator: Layout.Box,
    context: Context,
): Layout.Box => {
    return Layout.makeFract(numerator, denominator, context);
};

const typesetSubsup = (
    subBox: Layout.Box | null,
    supBox: Layout.Box | null,
    context: Context,
    prevEditNode?: Editor.types.Node | Editor.Focus,
    prevLayoutNode?: Layout.Node,
): Layout.Box => {
    return Layout.makeSubSup(
        subBox,
        supBox,
        context,
        prevEditNode,
        prevLayoutNode,
    );
};

const typesetRoot = (
    // TODO: rename all uses of radical `index` to `degree` to match this
    degree: Layout.Box | null,
    radicand: Layout.Box,
    context: Context,
): Layout.Box => {
    const multiplier = multiplierForContext(context);

    // Give the radicand a minimal width in case it's empty
    radicand.width = Math.max(radicand.width, 30 * multiplier);

    const thresholdOptions = {
        value: "sum" as const,
        strict: true,
    };

    const surd = Layout.hpackNat(
        [[makeDelimiter("\u221A", radicand, thresholdOptions, context)]],
        context,
    );

    const fontSize = fontSizeForContext(context);
    const {font} = context.fontData;
    const {constants} = context.fontData.font.math;
    const thickness =
        (fontSize * constants.radicalRuleThickness.value) /
        font.head.unitsPerEm;
    const endPadding = thickness; // Add extra space at the end of the radicand
    const stroke = Layout.makeHRule(thickness, radicand.width + endPadding);

    const radicalWithRule = Layout.makeVBox(
        radicand.width,
        radicand,
        [Layout.makeKern(6), stroke],
        [],
        context,
    );

    // Compute the shift to align the top of the surd with the radical rule
    const shift = surd.height - radicalWithRule.height;

    surd.shift = shift;

    let root;
    if (degree) {
        const afterDegreeKern = Layout.makeKern(
            (fontSize * constants.radicalKernAfterDegree.value) /
                font.head.unitsPerEm,
        );

        // TODO: take into account constants.radicalKernBeforeDegree
        const beforeDegreeKern = Layout.makeKern(
            Math.max(0, -afterDegreeKern.size - degree.width),
        );

        // This follows the instructions from 3.3.3.3 describing the alphabetic
        // baseline of the index.
        // https://mathml-refresh.github.io/mathml-core/#root-with-index
        //
        // NOTE: This doesn't account for an index with a large descender, but
        // neither does TeX's layout algorithm.  Most of the the time the index
        // is a single number or `n`, neither of whcih have a descender.
        const degreeBottomRaisePercent =
            constants.radicalDegreeBottomRaisePercent / 100;

        // We default to MathML/Word beahavior since that's what most fonts
        // seem to use.
        const algorithm =
            context.radicalDegreeAlgorithm ?? RadicalDegreeAlgorithm.MathML;

        switch (algorithm) {
            case RadicalDegreeAlgorithm.OpenType:
                degree.shift =
                    shift - // match shift of surdHBox
                    // The OpenType spec says `radicalDegreeBottomRaisePercent` is
                    // with respect to the ascender of the radical glyph.
                    degreeBottomRaisePercent * surd.height;
                break;
            case RadicalDegreeAlgorithm.MathML:
                degree.shift =
                    shift + // match shift of surdHBox
                    surd.depth - // align the index to the bottom of surdHBox
                    // The MathML Core spec says `radicalDegreeBottomRaisePercent`
                    // is with respect to the height of the radical glyph.
                    degreeBottomRaisePercent * Layout.vsize(surd);
                break;
        }

        root = Layout.hpackNat(
            [
                [
                    beforeDegreeKern,
                    degree,
                    afterDegreeKern,
                    surd,
                    radicalWithRule,
                ],
            ],
            context,
        );
    } else {
        root = Layout.hpackNat([[surd, radicalWithRule]], context);
    }

    root.width += endPadding;

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
    prevEditNode?: Editor.types.Node,
    prevLayoutNode?: Layout.Node,
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

            const parentBox = typesetSubsup(
                subBox,
                supBox,
                context,
                prevEditNode,
                prevLayoutNode,
            );
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

            const delimited = Layout.hpackNat([[open, row, close]], context);

            delimited.id = focus.id;
            delimited.color = context?.colorMap?.get(delimited.id);

            return delimited;
        }
        default:
            throw new UnreachableCaseError(focus);
    }
};

const _typesetAtom = (
    node: Editor.types.Atom,
    context: Context,
): Layout.Glyph => {
    const {font} = context.fontData;

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
    glyph.pending = node.value.pending;
    return glyph;
};

const _typeset = (
    node: Editor.types.Node,
    context: Context,
    prevEditNode?: Editor.types.Node | Editor.Focus,
    prevLayoutNode?: Layout.Node,
): Layout.Node => {
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

            const parentBox = typesetSubsup(
                subBox,
                supBox,
                context,
                prevEditNode,
                prevLayoutNode,
            );

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

            const delimited = Layout.hpackNat([[open, row, close]], context);

            delimited.id = node.id;
            delimited.color = context?.colorMap?.get(delimited.id);

            return delimited;
        }
        case "atom": {
            return _typesetAtom(node, context);
        }
        default:
            throw new UnreachableCaseError(node);
    }
};

const canBeUnary = (char: string): boolean => {
    const unaryOperators = [
        "+",
        "\u2212", // \minus
        "\u00B1", // \pm
    ];

    return unaryOperators.includes(char);
};

// TODO: dedupe with isOperator in slash.ts
const isOperator = (char: string): boolean => {
    // We don't include unary +/- in the numerator.  This mimic's mathquill's
    // behavior.
    const operators = [
        "+",
        "\u2212", // \minus
        "\u00B1", // \pm
        "\u00B7", // \times
        "=",
        "<",
        ">",
        "\u2260", // \neq
        "\u2264", // \geq
        "\u2265", // \leq
    ];

    if (operators.includes(char)) {
        return true;
    }

    const charCode = char.charCodeAt(0);

    // Arrows
    if (charCode >= 0x2190 && charCode <= 0x21ff) {
        return true;
    }

    return false;
};

const shouldHavePadding = (
    prevNode: Editor.types.Node | Editor.Focus | undefined,
    currentNode: Editor.types.Atom,
    context: Context,
): boolean => {
    const currentChar = currentNode.value.char;

    // We only add padding around operators, so if we get a non-operator char
    // we can return early.
    if (!isOperator(currentChar)) {
        return false;
    }

    // No operators get padding when `cramped` is true
    if (context.cramped) {
        return false;
    }

    // If the currentChar can be unary we check a number of situations where it
    // should be unary and don't give it any padding in those situations.
    if (canBeUnary(currentChar)) {
        if (
            !prevNode ||
            (prevNode.type === "atom" && isOperator(prevNode.value.char)) ||
            prevNode.type === "limits" ||
            prevNode.type === "zlimits"
        ) {
            return false;
        }
    }

    // All other operators should have padding around them.
    return true;
};

const _typesetChildren = (
    children: readonly Editor.types.Node[],
    context: Context,
    prevChild?: Editor.types.Node | Editor.Focus,
    prevLayoutNode?: Layout.Node,
): readonly Layout.Node[] => {
    return children.map((child) => {
        if (child.type === "atom") {
            const glyph = _typesetAtom(child, context);
            const result = shouldHavePadding(prevChild, child, context)
                ? withOperatorPadding(glyph, context)
                : glyph;
            if (result !== glyph) {
                result.id = glyph.id;
                delete glyph.id;
            }
            prevLayoutNode = result;
            prevChild = child;
            return result;
        } else {
            const result = _typeset(child, context, prevChild, prevLayoutNode);
            prevLayoutNode = result;
            prevChild = child;
            return result;
        }
    });
};

const _typesetZipper = (
    zipper: Editor.Zipper,
    context: Context,
): Layout.Box => {
    // The bottommost crumb is the outermost row
    const [crumb, ...restCrumbs] = zipper.breadcrumbs;

    if (crumb) {
        const row = crumb.row;

        if (row.selection) {
            const left = _typesetChildren(row.left, context);
            const nextZipper: Editor.Zipper = {
                ...zipper,
                breadcrumbs: restCrumbs,
            };
            const focusBox = typesetFocus(crumb.focus, nextZipper, context);
            const selection =
                row.selection.dir === "left"
                    ? [
                          ..._typesetChildren(
                              row.selection.nodes,
                              context,
                              row.left[row.left.length - 1],
                          ),
                          focusBox,
                      ]
                    : [
                          focusBox,
                          ..._typesetChildren(
                              row.selection.nodes,
                              context,
                              crumb.focus, // prev edit node
                              focusBox, // prev layout node
                          ),
                      ];
            const right = _typesetChildren(
                row.right,
                context,
                row.selection.dir === "left" || row.selection.nodes.length === 0
                    ? crumb.focus
                    : row.selection.nodes[row.selection.nodes.length - 1],
                selection[selection.length - 1], // previous layout node
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
            nodes.push(
                typesetFocus(
                    crumb.focus,
                    nextZipper,
                    context,
                    row.left[row.left.length - 1], // previous edit node
                    nodes[nodes.length - 1], // previous layout node
                ),
            );
            nodes.push(
                ..._typesetChildren(
                    row.right,
                    context,
                    crumb.focus, // previous edit node
                    nodes[nodes.length - 1], // previous layout node
                ),
            );

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

        const prevEditNode = row.selection
            ? row.selection.nodes[row.selection.nodes.length - 1]
            : row.left[row.left.length - 1];

        const prevLayoutNode =
            selection[selection.length - 1] || left[left.length - 1];

        const right = _typesetChildren(
            row.right,
            context,
            prevEditNode,
            prevLayoutNode,
        );

        const box = Layout.hpackNat([left, selection, right], context);
        box.id = row.id;
        box.color = context?.colorMap?.get(box.id);

        if (context.renderMode === RenderMode.Dynamic) {
            ensureMinDepthAndHeight(box, context);
        }

        return box;
    }
};

export type Options = {
    showCursor?: boolean;
};

export const typesetZipper = (
    zipper: Editor.Zipper,
    context: Context,
    options: Options = {},
): Scene => {
    const box = _typesetZipper(zipper, context) as Layout.Box;
    return processBox(box, context.fontData, options);
};

export const typeset = (
    node: Editor.types.Node,
    context: Context,
    options: Options = {},
): Scene => {
    const box = _typeset(node, context) as Layout.Box;
    return processBox(box, context.fontData, options);
};
