import * as Editor from "@math-blocks/editor-core";

import * as Layout from "./layout";
import {processBox, Group, Point} from "./scene-graph";
import {Context} from "../types";

// Dedupe this with editor/src/util.ts
export const isGlyph = (
    node: Editor.types.Node,
    char: string,
): node is Editor.types.Atom => node.type === "atom" && node.value.char == char;

// Adds appropriate padding around operators where appropriate
const typesetChildren = (
    children: Editor.types.Node[],
    context: Context,
    column = false, // isSingleChildColumn?
): Layout.Node[] => {
    return children.map((child, index) => {
        if (child.type === "atom") {
            const {value} = child;

            const prevChild = index > 0 ? children[index - 1] : undefined;
            const unary =
                /[+\u2212]/.test(value.char) &&
                (prevChild
                    ? prevChild.type === "atom" &&
                      /[+\u2212<>\u2260=\u2264\u2265\u00B1(]/.test(
                          prevChild.value.char,
                      )
                    : true);
            const glyph = _typeset(child, context);

            if (unary && !column) {
                glyph.id = child.id;
                return glyph;
            } else if (
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

const typesetRow = (row: Editor.types.Row, context: Context): Layout.Box => {
    const box = Layout.hpackNat(
        [typesetChildren(row.children, context)],
        context.multiplier,
    );
    box.id = row.id;
    box.color = context?.colorMap?.get(row.id);

    return box;
};

// TODO: check to see if there's an "=" in the previous column of any of the rows
const withOperatorPadding = (
    node: Layout.Node,
    context: Context,
): Layout.Node => {
    const {baseFontSize, multiplier} = context;
    const fontSize = multiplier * baseFontSize;

    // We need to tweak this loic so that we only add padding on the right side
    // for binary operators below.  This is so that we don't get extra space
    // when adding/subtracting something just to the right of an "=" in the above
    return Layout.hpackNat(
        [[Layout.makeKern(fontSize / 4), node, Layout.makeKern(fontSize / 4)]],
        multiplier,
    );
};

const typesetFocus = (
    focus: Editor.Focus,
    zipper: Editor.Zipper,
    context: Context,
): Layout.Box => {
    const {fontMetrics, baseFontSize, multiplier, cramped} = context;
    const jmetrics = fontMetrics.glyphMetrics["j".charCodeAt(0)];
    const Emetrics = fontMetrics.glyphMetrics["E".charCodeAt(0)];

    if (focus.type === "zfrac") {
        const newMultiplier = cramped ? 0.5 : 1.0;
        const childContext = {
            ...context,
            multiplier: newMultiplier,
        };

        const numerator =
            focus.dir === "left"
                ? _typesetZipper(zipper, childContext)
                : typesetRow(focus.other, childContext);

        const denominator =
            focus.dir === "left"
                ? typesetRow(focus.other, childContext)
                : _typesetZipper(zipper, childContext);

        // TODO: try to reuse getCharDepth
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

        const frac = Layout.makeFract(multiplier, 5, numerator, denominator);
        frac.id = focus.id;
        frac.color = context?.colorMap?.get(focus.id);

        return frac;
    }

    throw new Error(
        `typesetFocus: we don't handle "${focus.type}" node type yet`,
    );
};

const _typeset = (node: Editor.types.Node, context: Context): Layout.Node => {
    const {fontMetrics, baseFontSize, multiplier, cramped} = context;
    const jmetrics = fontMetrics.glyphMetrics["j".charCodeAt(0)];
    const Emetrics = fontMetrics.glyphMetrics["E".charCodeAt(0)];

    if (node.type === "row") {
        // ignore
        throw new Error("we shouldn't be processing rows here");
    } else if (node.type === "frac") {
        const newMultiplier = cramped ? 0.5 : 1.0;
        const childContext = {
            ...context,
            multiplier: newMultiplier,
        };

        const numerator = typesetRow(node.children[0], childContext);
        const denominator = typesetRow(node.children[1], childContext);

        // TODO: try to reuse getCharDepth
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

        const frac = Layout.makeFract(multiplier, 5, numerator, denominator);
        frac.id = node.id;
        frac.color = context?.colorMap?.get(node.id);

        return frac;
    } else if (node.type === "atom") {
        const {value} = node;
        const glyph = Layout.makeGlyph(value.char, context);
        glyph.id = node.id;
        glyph.color = context.colorMap?.get(node.id);
        return glyph;
    }

    throw new Error(`_typeset: we don't handle "${node.type}" node type yet`);
};

const _typesetZipper = (
    zipper: Editor.Zipper,
    context: Context,
): Layout.Box => {
    const [crumb, ...restCrumbs] = zipper.path;

    if (crumb) {
        const row = crumb.row;
        const nodes: Layout.Node[] = [];

        for (const child of row.left) {
            nodes.push(_typeset(child, context));
        }

        if (crumb) {
            // TODO: handle crubme && restCrumbs.length === 0
            const nextZipper = {...zipper, path: restCrumbs};
            nodes.push(typesetFocus(crumb.focus, nextZipper, context));
        }

        for (const child of row.right) {
            nodes.push(_typeset(child, context));
        }

        const box = Layout.hpackNat([nodes]);
        box.id = row.id;
        box.color = context?.colorMap?.get(box.id);

        return box;
    } else {
        const row = zipper.row;

        const left = row.left.map((child) => _typeset(child, context));
        const right = row.right.map((child) => _typeset(child, context));

        const box = Layout.hpackNat([left, right]);
        box.id = row.id;
        box.color = context?.colorMap?.get(box.id);

        return box;
    }
};

type Options = {
    // cursor?: LayoutCursor | undefined;
    // cancelRegions?: LayoutCursor[] | undefined;
    loc?: Point | undefined;
};

export const typesetZipper = (
    zipper: Editor.Zipper,
    context: Context,
    options: Options = {},
): Group => {
    const box = _typesetZipper(zipper, context) as Layout.Box;
    return processBox({box, ...options});
};
