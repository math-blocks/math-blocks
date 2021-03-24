import {UnreachableCaseError} from "@math-blocks/core";
import * as Editor from "@math-blocks/editor-core";

import * as Layout from "./layout";
import {processBox} from "./scene-graph";

import type {Context} from "./types";
import type {Group} from "./scene-graph";

// Dedupe this with editor/src/util.ts
export const isGlyph = (
    node: Editor.types.Node,
    char: string,
): node is Editor.types.Atom => node.type === "atom" && node.value.char == char;

const typesetRow = (row: Editor.types.Row, context: Context): Layout.Box => {
    const box = Layout.hpackNat(
        [_typesetChildren(row.children, context)],
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
    const {fontData, baseFontSize, multiplier, cramped} = context;
    console.log(fontData);
    const {fontMetrics} = fontData;
    const jmetrics = fontMetrics.getGlyphMetrics("j".charCodeAt(0));
    const Emetrics = fontMetrics.getGlyphMetrics("E".charCodeAt(0));

    switch (focus.type) {
        case "zfrac": {
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

            const frac = Layout.makeFract(
                multiplier,
                5,
                numerator,
                denominator,
            );
            frac.id = focus.id;
            frac.color = context?.colorMap?.get(focus.id);

            return frac;
        }
        case "zsubsup": {
            const newMultiplier = multiplier === 1.0 ? 0.7 : 0.5;
            const childContext = {
                ...context,
                multiplier: newMultiplier,
                cramped: true,
            };

            const [sub, sup] =
                focus.dir === "left"
                    ? [zipper.row, focus.other]
                    : [focus.other, zipper.row];

            let subBox: Layout.Box | undefined;
            // TODO: document this better so I know what's going on here.
            if (sub) {
                subBox =
                    sub.type === "row"
                        ? typesetRow(sub, childContext)
                        : _typesetZipper(zipper, childContext);

                // TODO: try to reuse getCharDepth
                if (jmetrics) {
                    const jDepth =
                        (baseFontSize *
                            newMultiplier *
                            (jmetrics.height - jmetrics.bearingY)) /
                        fontMetrics.unitsPerEm;
                    subBox.depth = Math.max(subBox.depth, jDepth);
                }

                // TODO: grab the max bearingY of all of [0-9a-zA-Z]
                if (Emetrics) {
                    const EHeight =
                        (baseFontSize * newMultiplier * Emetrics.bearingY) /
                        fontMetrics.unitsPerEm;
                    subBox.height = Math.max(subBox.height, EHeight);
                }
            }

            let supBox: Layout.Box | undefined;
            // TODO: document this better so I know what's going on here.
            if (sup) {
                supBox =
                    sup.type === "row"
                        ? typesetRow(sup, childContext)
                        : _typesetZipper(zipper, childContext);

                // TODO: try to reuse getCharDepth
                if (jmetrics) {
                    const jDepth =
                        (baseFontSize *
                            newMultiplier *
                            (jmetrics.height - jmetrics.bearingY)) /
                        fontMetrics.unitsPerEm;
                    supBox.depth = Math.max(supBox.depth, jDepth);
                }

                // TODO: grab the max bearingY of all of [0-9a-zA-Z]
                if (Emetrics) {
                    const EHeight =
                        (baseFontSize * newMultiplier * Emetrics.bearingY) /
                        fontMetrics.unitsPerEm;
                    supBox.height = Math.max(supBox.height, EHeight);
                }
            }

            const parentBox = Layout.makeSubSup(multiplier, subBox, supBox);
            parentBox.id = focus.id;

            return parentBox;
        }
        case "zroot": {
            const radicand =
                focus.dir === "left"
                    ? typesetRow(focus.other, context)
                    : _typesetZipper(zipper, context);
            const Eheight = 50;
            radicand.width = Math.max(radicand.width, 30 * multiplier);
            radicand.height = Math.max(radicand.height, Eheight * multiplier);
            radicand.depth = Math.max(radicand.depth, 0);

            // TODO: make the surd stretchy
            const surd = Layout.hpackNat(
                [[Layout.makeGlyph("\u221A", context)]],
                multiplier,
            );
            const stroke = Layout.makeHRule(6.5 * multiplier, radicand.width);
            const vbox = Layout.makeVBox(
                radicand.width,
                radicand,
                [Layout.makeKern(6), stroke],
                [],
                multiplier,
            );
            surd.shift = surd.height - vbox.height;

            const root = Layout.hpackNat(
                [[surd, Layout.makeKern(-10), vbox]],
                multiplier,
            );
            root.id = focus.id;
            root.color = context?.colorMap?.get(root.id);

            return root;
        }
        case "zlimits": {
            const newMultiplier = multiplier === 1.0 ? 0.7 : 0.5;
            const [lower, upper] =
                focus.dir === "left"
                    ? [zipper.row, focus.other]
                    : [focus.other, zipper.row];
            const childContext = {
                ...context,
                multiplier: newMultiplier,
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

            // TODO: try to reuse getCharDepth
            if (jmetrics) {
                const jDepth =
                    (baseFontSize *
                        newMultiplier *
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
                    (baseFontSize * newMultiplier * Emetrics.bearingY) /
                    fontMetrics.unitsPerEm;
                lowerBox.height = Math.max(lowerBox.height, EHeight);
                if (upperBox) {
                    upperBox.height = Math.max(upperBox.height, EHeight);
                }
            }

            const inner = _typeset(focus.inner, context);
            inner.id = focus.inner.id;
            inner.color = context?.colorMap?.get(inner.id);

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
                          multiplier,
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
                multiplier,
            );
            limits.id = focus.id;
            limits.color = context?.colorMap?.get(limits.id);

            return limits;
        }
    }
};

const _typeset = (node: Editor.types.Node, context: Context): Layout.Node => {
    const {fontData, baseFontSize, multiplier, cramped} = context;
    const {fontMetrics} = fontData;
    const jmetrics = fontMetrics.getGlyphMetrics("j".charCodeAt(0));
    const Emetrics = fontMetrics.getGlyphMetrics("E".charCodeAt(0));

    switch (node.type) {
        case "row": {
            // The only time this can happen is if limits.inner is a row
            return typesetRow(node, context);
        }
        case "frac": {
            const newMultiplier = cramped ? 0.5 : 1.0;
            const childContext = {
                ...context,
                multiplier: newMultiplier,
            };

            const [num, den] = node.children;
            const numerator = typesetRow(num, childContext);
            const denominator = typesetRow(den, childContext);

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

            const frac = Layout.makeFract(
                multiplier,
                5,
                numerator,
                denominator,
            );
            frac.id = node.id;
            frac.color = context?.colorMap?.get(node.id);

            return frac;
        }
        case "subsup": {
            const newMultiplier = multiplier === 1.0 ? 0.7 : 0.5;
            const childContext = {
                ...context,
                multiplier: newMultiplier,
                cramped: true,
            };

            const [sub, sup] = node.children;

            let subBox: Layout.Box | undefined;
            // TODO: document this better so I know what's going on here.
            if (sub) {
                subBox = typesetRow(sub, childContext);

                // TODO: try to reuse getCharDepth
                if (jmetrics) {
                    const jDepth =
                        (baseFontSize *
                            newMultiplier *
                            (jmetrics.height - jmetrics.bearingY)) /
                        fontMetrics.unitsPerEm;
                    subBox.depth = Math.max(subBox.depth, jDepth);
                }

                // TODO: grab the max bearingY of all of [0-9a-zA-Z]
                if (Emetrics) {
                    const EHeight =
                        (baseFontSize * newMultiplier * Emetrics.bearingY) /
                        fontMetrics.unitsPerEm;
                    subBox.height = Math.max(subBox.height, EHeight);
                }
            }

            let supBox: Layout.Box | undefined;
            // TODO: document this better so I know what's going on here.
            if (sup) {
                supBox = typesetRow(sup, childContext);

                // TODO: try to reuse getCharDepth
                if (jmetrics) {
                    const jDepth =
                        (baseFontSize *
                            newMultiplier *
                            (jmetrics.height - jmetrics.bearingY)) /
                        fontMetrics.unitsPerEm;
                    supBox.depth = Math.max(supBox.depth, jDepth);
                }

                // TODO: grab the max bearingY of all of [0-9a-zA-Z]
                if (Emetrics) {
                    const EHeight =
                        (baseFontSize * newMultiplier * Emetrics.bearingY) /
                        fontMetrics.unitsPerEm;
                    supBox.height = Math.max(supBox.height, EHeight);
                }
            }

            const parentBox = Layout.makeSubSup(multiplier, subBox, supBox);
            parentBox.id = node.id;

            return parentBox;
        }
        case "root": {
            const [, rad] = node.children;
            const radicand = typesetRow(rad, context);
            const Eheight = 50;
            radicand.width = Math.max(radicand.width, 30 * multiplier);
            radicand.height = Math.max(radicand.height, Eheight * multiplier);
            radicand.depth = Math.max(radicand.depth, 0);

            // TODO: make the surd stretchy
            const surd = Layout.hpackNat(
                [[Layout.makeGlyph("\u221A", context)]],
                multiplier,
            );
            const stroke = Layout.makeHRule(6.5 * multiplier, radicand.width);
            const vbox = Layout.makeVBox(
                radicand.width,
                radicand,
                [Layout.makeKern(6), stroke],
                [],
                multiplier,
            );
            surd.shift = surd.height - vbox.height;

            const root = Layout.hpackNat(
                [[surd, Layout.makeKern(-10), vbox]],
                multiplier,
            );
            root.id = node.id;
            root.color = context?.colorMap?.get(root.id);

            return root;
        }
        case "limits": {
            const newMultiplier = multiplier === 1.0 ? 0.7 : 0.5;
            const [lower, upper] = node.children;
            const childContext = {
                ...context,
                multiplier: newMultiplier,
                cramped: true,
            };

            const lowerBox = typesetRow(lower, childContext);
            const upperBox = upper
                ? typesetRow(upper, childContext)
                : undefined;

            // TODO: try to reuse getCharDepth
            if (jmetrics) {
                const jDepth =
                    (baseFontSize *
                        newMultiplier *
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
                    (baseFontSize * newMultiplier * Emetrics.bearingY) /
                    fontMetrics.unitsPerEm;
                lowerBox.height = Math.max(lowerBox.height, EHeight);
                if (upperBox) {
                    upperBox.height = Math.max(upperBox.height, EHeight);
                }
            }

            const inner = _typeset(node.inner, context);
            inner.id = node.inner.id;
            inner.color = context?.colorMap?.get(inner.id);

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
                          multiplier,
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
                multiplier,
            );
            limits.id = node.id;
            limits.color = context?.colorMap?.get(limits.id);

            return limits;
        }
        case "atom": {
            const {value} = node;
            const glyph = Layout.makeGlyph(value.char, context);
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
