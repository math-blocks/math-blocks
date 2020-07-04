import * as Editor from "@math-blocks/editor";
import * as Layout from "./layout";
import {FontMetrics} from "./metrics";
import {UnreachableCaseError} from "@math-blocks/core";

type ID = {
    id: number;
};

type Context = {
    fontMetrics: FontMetrics;
    baseFontSize: number;
    multiplier: number; // roughly maps to display, text, script, and scriptscript in LaTeX
    cramped: boolean;
};

// Adds appropriate padding around operators where appropriate
const typesetChildren = (
    children: Editor.Node<Editor.Glyph, ID>[],
    context: Context,
): Layout.Node[] => {
    const {multiplier, baseFontSize} = context;
    const fontSize = multiplier * baseFontSize;

    let prevResult: Layout.Node | undefined = undefined;
    const output: Layout.Node[] = [];

    // TODO: switch to a while loop so that we can process multiple
    // children at a time
    let index = 0;
    while (index < children.length) {
        const child = children[index];
        const nextChild = children[index + 1];

        if (child.type === "atom") {
            const {value} = child;
            const prevChild = index > 0 ? children[index - 1] : undefined;
            const unary =
                /[+\u2212]/.test(value.char) &&
                (prevChild
                    ? prevChild.type === "atom" &&
                      /[+\u2212<>\u2260=\u2264\u2265\u00B1]/.test(
                          prevChild.value.char,
                      )
                    : true);
            const glyph = typeset(child, context, prevResult);

            if (unary) {
                glyph.id = child.id;
                prevResult = glyph;
            } else if (
                /[+\-\u00B7\u2212<>\u2260=\u2264\u2265\u00B1]/.test(value.char)
            ) {
                const box = context.cramped
                    ? glyph
                    : Layout.hpackNat(
                          [
                              Layout.makeKern(fontSize / 4),
                              glyph,
                              Layout.makeKern(fontSize / 4),
                          ],
                          multiplier,
                      );
                box.id = child.id;
                prevResult = box;
            } else if (
                ["\u03a3", "\u03a0"].includes(value.char) &&
                nextChild &&
                nextChild.type === "subsup"
            ) {
                const [sub, sup] = nextChild.children;
                const newMultiplier = multiplier === 1.0 ? 0.7 : 0.5;

                let subBox: Layout.Box | undefined;
                let supBox: Layout.Box | undefined;

                // TODO: document this better so I know what's going on here.
                if (sub) {
                    subBox = Layout.hpackNat(
                        typesetChildren(sub.children, {
                            ...context,
                            multiplier: newMultiplier,
                            cramped: true,
                        }),
                        newMultiplier,
                    );
                    subBox.id = sub.id;
                }
                // TODO: document this better so I know what's going on here.
                if (sup) {
                    supBox = Layout.hpackNat(
                        typesetChildren(sup.children, {
                            ...context,
                            multiplier: newMultiplier,
                            cramped: true,
                        }),
                        newMultiplier,
                    );
                    supBox.id = sup.id;
                }

                const glyphWidth = Layout.getWidth(glyph);
                const width = Math.max(
                    glyphWidth,
                    supBox?.width || 0,
                    subBox?.width || 0,
                );
                const newGlyph =
                    glyphWidth < width
                        ? Layout.hpackNat(
                              [
                                  Layout.makeKern((width - glyphWidth) / 2),
                                  glyph,
                                  Layout.makeKern((width - glyphWidth) / 2),
                              ],
                              multiplier,
                          )
                        : glyph;
                if (supBox && supBox.width < width) {
                    supBox.shift = (width - supBox.width) / 2;
                }
                if (subBox && subBox.width < width) {
                    subBox.shift = (width - subBox.width) / 2;
                }
                const summation = Layout.makeVBox(
                    width,
                    newGlyph,
                    supBox ? [Layout.makeKern(6), supBox] : [],
                    subBox ? [Layout.makeKern(4), subBox] : [],
                    multiplier,
                );
                summation.id = child.id;
                prevResult = summation;

                index++;
            } else {
                glyph.id = child.id;
                if (glyph.type === "Glyph") {
                    glyph.pending = child.value.pending;
                }
                prevResult = glyph;
            }
        } else {
            prevResult = typeset(child, context, prevResult);
        }

        output.push(prevResult);
        index++;
    }

    return output;
};

const typeset = (
    node: Editor.Node<Editor.Glyph, ID>,
    context: Context,
    previous?: Layout.Node,
): Layout.Node => {
    const {fontMetrics, baseFontSize, multiplier, cramped} = context;
    const fontSize = multiplier * baseFontSize;
    const _makeGlyph = Layout.makeGlyph(fontMetrics)(fontSize);
    const jmetrics = fontMetrics.glyphMetrics["j".charCodeAt(0)];
    const Emetrics = fontMetrics.glyphMetrics["E".charCodeAt(0)];

    switch (node.type) {
        case "row": {
            const row = Layout.hpackNat(
                typesetChildren(node.children, context),
                multiplier,
            );
            row.height = Math.max(row.height, 0.85 * baseFontSize * multiplier);
            row.depth = Math.max(row.depth, 0.15 * baseFontSize * multiplier);
            row.id = node.id;
            return row;
        }
        case "subsup": {
            const newMultiplier = multiplier === 1.0 ? 0.7 : 0.5;
            let subBox: Layout.Box | undefined;
            const [sub, sup] = node.children;
            // TODO: document this better so I know what's going on here.
            if (sub) {
                subBox = Layout.hpackNat(
                    typesetChildren(sub.children, {
                        ...context,
                        multiplier: newMultiplier,
                        cramped: true,
                    }),
                    newMultiplier,
                );
                subBox.id = sub.id;
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
                supBox = Layout.hpackNat(
                    typesetChildren(sup.children, {
                        ...context,
                        multiplier: newMultiplier,
                        cramped: true,
                    }),
                    newMultiplier,
                );
                supBox.id = sup.id;
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
        case "frac": {
            const newMultiplier = cramped ? 0.5 : 1.0;
            const numerator = Layout.hpackNat(
                typesetChildren(node.children[0].children, {
                    ...context,
                    multiplier: newMultiplier,
                }),
                newMultiplier,
            );
            const denominator = Layout.hpackNat(
                typesetChildren(node.children[1].children, {
                    ...context,
                    multiplier: newMultiplier,
                }),
                newMultiplier,
            );

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

            // How do we deal with the 0 and 1 indices disappearing here?
            numerator.id = node.children[0].id;
            denominator.id = node.children[1].id;

            const frac = Layout.makeFract(
                multiplier,
                5,
                numerator,
                denominator,
            );
            frac.id = node.id;
            return frac;
        }
        case "root": {
            const radicand = Layout.hpackNat(
                typesetChildren(node.children[0].children, context), // radicand
                multiplier,
            );
            radicand.id = node.children[0].id;
            const Eheight = 50;
            radicand.width = Math.max(radicand.width, 30 * multiplier);
            radicand.height = Math.max(radicand.height, Eheight * multiplier);
            radicand.depth = Math.max(radicand.depth, 0);
            const stroke = Layout.makeHRule(6.5 * multiplier, radicand.width);
            const vbox = Layout.makeVBox(
                radicand.width,
                radicand,
                [Layout.makeKern(6), stroke],
                [],
                multiplier,
            );
            // TODO: make the surd stretchy
            const surd = Layout.hpackNat([_makeGlyph("\u221A")], multiplier);
            surd.shift = surd.height - vbox.height;
            const root = Layout.hpackNat(
                [surd, Layout.makeKern(-10), vbox],
                multiplier,
            );
            root.id = node.id;
            return root;
        }
        case "atom": {
            const {value} = node;
            return _makeGlyph(value.char);
        }
        default:
            throw new UnreachableCaseError(node);
    }
};

export default typeset;
