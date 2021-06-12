import {UnreachableCaseError} from "@math-blocks/core";
import * as Editor from "@math-blocks/editor-core";

import * as Layout from "./layout";
import {processBox} from "./scene-graph";
import {MathStyle, RenderMode} from "./enums";
import {fontSizeForContext} from "./utils";

import {typesetDelimited} from "./typesetters/delimited";
import {typesetFrac} from "./typesetters/frac";
import {typesetLimits} from "./typesetters/limits";
import {typesetRoot} from "./typesetters/root";
import {typesetSubsup} from "./typesetters/subsup";
import {typesetTable} from "./typesetters/table";

import type {Context} from "./types";
import type {Scene} from "./scene-graph";

const typesetRow = (row: Editor.types.Row, context: Context): Layout.Box => {
    const box = Layout.hpackNat([typesetNodes(row.children, context)], context);
    box.id = row.id;
    box.style.color = row.style.color;

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

const getTypesetChildren = (
    zipper: Editor.Zipper,
    focus: Editor.Focus,
    childContext: Context,
): (Layout.Box | null)[] => {
    const focusedCell = _typesetZipper(zipper, childContext);

    return [
        ...focus.left.map((child) => {
            return child && typesetRow(child, childContext);
        }),
        focusedCell,
        ...focus.right.map((child) => {
            return child && typesetRow(child, childContext);
        }),
    ];
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

            const typesetChildren = getTypesetChildren(
                zipper,
                focus,
                childContext,
            );

            return typesetFrac(typesetChildren, focus, context);
        }
        case "zsubsup": {
            const childContext = childContextForSubsup(context);

            const typesetChildren = getTypesetChildren(
                zipper,
                focus,
                childContext,
            );

            return typesetSubsup(
                typesetChildren,
                focus,
                context,
                prevEditNode,
                prevLayoutNode,
            );
        }
        case "zroot": {
            // NOTE: We can't reuse the same pattern as the others since the
            // index and the radicand are typeset using different contexts so
            // that their sizes are different.
            const [ind, rad] = focus.right[0]
                ? [zipper.row, focus.right[0]]
                : [focus.left[0], zipper.row];

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
            root.style = focus.style;

            return root;
        }
        case "zlimits": {
            // TODO: render as a subsup if mathStyle isn't MathStyle.Display
            const childContext = childContextForLimits(context);

            const typesetChildren = getTypesetChildren(
                zipper,
                focus,
                childContext,
            );

            const inner = typesetNode(focus.inner, {
                ...context,
                operator: true,
            });
            inner.id = focus.inner.id;
            inner.style.color = focus.inner.style.color;

            return typesetLimits(typesetChildren, focus, inner, context);
        }
        case "zdelimited": {
            const row = _typesetZipper(zipper, context);

            return typesetDelimited(row, focus, context);
        }
        case "ztable": {
            const childContext = childContextForFrac(context);

            const typesetChildren = getTypesetChildren(
                zipper,
                focus,
                childContext,
            );

            return typesetTable(typesetChildren, focus, context);
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
    glyph.style = node.style;
    glyph.pending = node.value.pending;
    return glyph;
};

const typesetNode = (
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

            const typesetChildren = node.children.map((child) =>
                typesetRow(child, childContext),
            );

            return typesetFrac(typesetChildren, node, context);
        }
        case "subsup": {
            const childContext = childContextForSubsup(context);

            const typesetChildren = node.children.map(
                (child) => child && typesetRow(child, childContext),
            );

            return typesetSubsup(
                typesetChildren,
                node,
                context,
                prevEditNode,
                prevLayoutNode,
            );
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
            root.style = node.style;

            return root;
        }
        case "limits": {
            // TODO: render as a subsup if mathStyle isn't MathStyle.Display
            const childContext = childContextForLimits(context);

            const typesetChildren = node.children.map(
                (child) => child && typesetRow(child, childContext),
            );

            const inner = typesetNode(node.inner, {...context, operator: true});
            inner.id = node.inner.id;
            inner.style.color = node.inner.style.color;

            return typesetLimits(typesetChildren, node, inner, context);
        }
        case "delimited": {
            const row = typesetRow(node.children[0], context);

            return typesetDelimited(row, node, context);
        }
        case "table": {
            const childContext = childContextForFrac(context);

            const typesetChildren = node.children.map((child) => {
                return child && typesetRow(child, childContext);
            });

            return typesetTable(typesetChildren, node, context);
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

const typesetNodes = (
    nodes: readonly Editor.types.Node[],
    context: Context,
    prevChild?: Editor.types.Node | Editor.Focus,
    prevLayoutNode?: Layout.Node,
): readonly Layout.Node[] => {
    return nodes.map((child) => {
        if (child.type === "atom") {
            const glyph = _typesetAtom(child, context);
            const result = shouldHavePadding(prevChild, child, context)
                ? withOperatorPadding(glyph, context)
                : glyph;
            if (result !== glyph) {
                result.id = glyph.id;
                delete glyph.id;
                // Move the style to the result so that cancel overlays are
                // continuous even when they include an operator with padding.
                result.style = glyph.style;
                glyph.style = {};
            }
            prevLayoutNode = result;
            prevChild = child;
            return result;
        } else {
            const result = typesetNode(
                child,
                context,
                prevChild,
                prevLayoutNode,
            );
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

        const nodes: Layout.Node[] = [];

        nodes.push(...typesetNodes(row.left, context));
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
            ...typesetNodes(
                row.right,
                context,
                crumb.focus, // previous edit node
                nodes[nodes.length - 1], // previous layout node
            ),
        );

        const box = Layout.hpackNat([nodes], context);
        box.id = row.id;
        box.style.color = row.style.color;

        if (context.renderMode === RenderMode.Dynamic) {
            ensureMinDepthAndHeight(box, context);
        }

        return box;
    } else {
        const row = zipper.row;

        const left = typesetNodes(row.left, context);
        const selection =
            row.selection.length > 0
                ? typesetNodes(
                      row.selection,
                      context,
                      row.left[row.left.length - 1],
                  )
                : [];

        const prevEditNode =
            row.selection.length > 0
                ? row.selection[row.selection.length - 1]
                : row.left[row.left.length - 1];

        const prevLayoutNode =
            selection[selection.length - 1] || left[left.length - 1];

        const right = typesetNodes(
            row.right,
            context,
            prevEditNode,
            prevLayoutNode,
        );

        const box = Layout.hpackNat([left, selection, right], context);
        box.id = row.id;
        box.style.color = row.style.color;

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
    const box = typesetNode(node, context) as Layout.Box;
    return processBox(box, context.fontData, options);
};
