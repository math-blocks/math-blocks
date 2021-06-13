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
import {typesetAtom, maybeAddOperatorPadding} from "./typesetters/atom";

import type {Context} from "./types";
import type {Scene} from "./scene-graph";

const typesetRow = (row: Editor.types.Row, context: Context): Layout.HBox => {
    const box = Layout.makeStaticHBox(
        typesetNodes(row.children, context),
        context,
    );
    box.id = row.id;
    box.style.color = row.style.color;

    if (context.renderMode === RenderMode.Dynamic) {
        ensureMinDepthAndHeight(box, context);
    }

    return box;
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

/**
 * Typesets the children of a Focus and associated Zipper.
 *
 * @param {Editor.Zipper} zipper
 * @param {Editor.Focus} focus
 * @param {Function} contextForIndex
 */
const getTypesetChildren = (
    zipper: Editor.Zipper,
    focus: Editor.Focus,
    contextForIndex: (index: number) => Context,
): (Layout.HBox | null)[] => {
    return [
        ...focus.left.map((child, index) => {
            return child && typesetRow(child, contextForIndex(index));
        }),
        _typesetZipper(zipper, contextForIndex(focus.left.length)),
        ...focus.right.map((child, index) => {
            return (
                child &&
                typesetRow(
                    child,
                    contextForIndex(focus.left.length + index + 1),
                )
            );
        }),
    ];
};

const typesetFocus = (
    focus: Editor.Focus,
    zipper: Editor.Zipper,
    context: Context,
    prevEditNode?: Editor.types.Node,
    prevLayoutNode?: Layout.Node,
): Layout.Node => {
    switch (focus.type) {
        case "zfrac": {
            const childContext = childContextForFrac(context);

            const typesetChildren = getTypesetChildren(
                zipper,
                focus,
                () => childContext,
            );

            return typesetFrac(typesetChildren, focus, context);
        }
        case "zsubsup": {
            const childContext = childContextForSubsup(context);

            const typesetChildren = getTypesetChildren(
                zipper,
                focus,
                () => childContext,
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
            const indexContext: Context = {
                ...context,
                // It doesn't matter what the mathStyle is of the parent, we
                // always use ScriptScript for root indicies.
                mathStyle: MathStyle.ScriptScript,
            };

            const typesetChildren = getTypesetChildren(zipper, focus, (index) =>
                index === 0 ? indexContext : context,
            );

            return typesetRoot(typesetChildren, focus, context);
        }
        case "zlimits": {
            // TODO: render as a subsup if mathStyle isn't MathStyle.Display
            const childContext = childContextForLimits(context);

            const typesetChildren = getTypesetChildren(
                zipper,
                focus,
                () => childContext,
            );

            return typesetLimits(typesetChildren, focus, context, typesetNode);
        }
        case "zdelimited": {
            const typesetChildren = getTypesetChildren(
                zipper,
                focus,
                () => context,
            );

            return typesetDelimited(typesetChildren, focus, context);
        }
        case "ztable": {
            const childContext = childContextForFrac(context);

            const typesetChildren = getTypesetChildren(
                zipper,
                focus,
                () => childContext,
            );

            return typesetTable(typesetChildren, focus, context);
        }
        default:
            throw new UnreachableCaseError(focus);
    }
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
            const [deg, rad] = node.children;

            const radicand = typesetRow(rad, context);
            const degree =
                deg &&
                typesetRow(deg, {
                    ...context,
                    // It doesn't matter what the mathStyle is of the parent, we
                    // always use ScriptScript for root indicies.
                    mathStyle: MathStyle.ScriptScript,
                });

            return typesetRoot([degree, radicand], node, context);
        }
        case "limits": {
            // TODO: render as a subsup if mathStyle isn't MathStyle.Display
            const childContext = childContextForLimits(context);

            const typesetChildren = node.children.map(
                (child) => child && typesetRow(child, childContext),
            );

            return typesetLimits(typesetChildren, node, context, typesetNode);
        }
        case "delimited": {
            const typesetChildren = node.children.map((child) =>
                typesetRow(child, context),
            );

            return typesetDelimited(typesetChildren, node, context);
        }
        case "table": {
            const childContext = childContextForFrac(context);

            const typesetChildren = node.children.map((child) => {
                return child && typesetRow(child, childContext);
            });

            return typesetTable(typesetChildren, node, context);
        }
        case "atom": {
            return typesetAtom(node, context);
        }
        default:
            throw new UnreachableCaseError(node);
    }
};

const typesetNodes = (
    nodes: readonly Editor.types.Node[],
    context: Context,
    prevChild?: Editor.types.Node | Editor.Focus,
    prevLayoutNode?: Layout.Node,
): readonly Layout.Node[] => {
    return nodes.map((child) => {
        if (child.type === "atom") {
            const result = maybeAddOperatorPadding(prevChild, child, context);
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
): Layout.HBox => {
    // The bottommost crumb is the outermost row
    const [crumb, ...restCrumbs] = zipper.breadcrumbs;

    if (crumb) {
        const row = crumb.row;
        const nextZipper: Editor.Zipper = {
            ...zipper,
            breadcrumbs: restCrumbs,
        };
        const nodes: Layout.Node[] = [];

        nodes.push(...typesetNodes(row.left, context));
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

        const box = Layout.makeStaticHBox(nodes, context);
        box.id = row.id;
        box.style.color = row.style.color;

        if (context.renderMode === RenderMode.Dynamic) {
            ensureMinDepthAndHeight(box, context);
        }

        return box;
    } else {
        const row = zipper.row;

        const input = [...row.left, ...row.selection, ...row.right];
        const output = typesetNodes(input, context);

        const firstCut = row.left.length;
        const secondCut = firstCut + row.selection.length;

        const left = output.slice(0, firstCut);
        const selection = output.slice(firstCut, secondCut);
        const right = output.slice(secondCut);

        const box =
            selection.length > 0
                ? Layout.makeSelectionHBox(left, selection, right, context)
                : Layout.makeCursorHBox(left, right, context);

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
    const box = _typesetZipper(zipper, context) as Layout.HBox;
    return processBox(box, context.fontData, options);
};

export const typeset = (
    node: Editor.types.Node,
    context: Context,
    options: Options = {},
): Scene => {
    const box = typesetNode(node, context) as Layout.HBox;
    return processBox(box, context.fontData, options);
};
