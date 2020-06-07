import * as Editor from "@math-blocks/editor";
import * as Layout from "./layout";
import {FontMetrics} from "./metrics";
import {UnreachableCaseError} from "@math-blocks/core";

type ID = {
    id: number;
};

const typeset = (fontMetrics: FontMetrics) => (baseFontSize: number) => (multiplier = 1) => (
    node: Editor.Node<Editor.Glyph, ID>,
): Layout.Node => {
    const _typeset = typeset(fontMetrics)(baseFontSize)(multiplier);
    const fontSize = multiplier * baseFontSize;
    const _makeGlyph = Layout.makeGlyph(fontMetrics)(fontSize);
    const jmetrics = fontMetrics.glyphMetrics["j".charCodeAt(0)];
    const Emetrics = fontMetrics.glyphMetrics["E".charCodeAt(0)];

    // Adds appropriate padding around operators where appropriate
    const typesetChildren = (
        _typeset: (node: Editor.Node<Editor.Glyph, ID>) => Layout.Node,
        children: Editor.Node<Editor.Glyph, ID>[],
    ): Layout.Node[] =>
        children.map((child, index) => {
            if (child.type === "atom") {
                const {value} = child;
                const prevChild = index > 0 ? children[index - 1] : null;
                const unary =
                    /[+\u2212]/.test(value.char) &&
                    (prevChild
                        ? prevChild.type === "atom" &&
                          /[+\u2212<>\u2260=\u2264\u2265\u00B1]/.test(prevChild.value.char)
                        : true);
                const glyph = _typeset(child);

                if (unary) {
                    glyph.id = child.id;
                    return glyph;
                } else if (/[+\-\u00B7\u2212<>\u2260=\u2264\u2265\u00B1]/.test(value.char)) {
                    const box = Layout.hpackNat(
                        [Layout.makeKern(fontSize / 4), glyph, Layout.makeKern(fontSize / 4)],
                        multiplier,
                    );
                    box.id = child.id;
                    return box;
                } else {
                    glyph.id = child.id;
                    if (glyph.type === "Glyph") {
                        glyph.pending = child.value.pending;
                    }
                    return glyph;
                }
            }
            return _typeset(child);
        });

    switch (node.type) {
        case "row": {
            const row = Layout.hpackNat(typesetChildren(_typeset, node.children), multiplier);
            row.height = Math.max(row.height, 0.85 * baseFontSize * multiplier);
            row.depth = Math.max(row.depth, 0.15 * baseFontSize * multiplier);
            row.id = node.id;
            return row;
        }
        case "subsup": {
            const newMultiplier = multiplier === 1.0 ? 0.7 : 0.5;
            const _typeset = typeset(fontMetrics)(baseFontSize)(newMultiplier);
            let subBox: Layout.Box | undefined;
            const [sub, sup] = node.children;
            // TODO: document this better so I know what's going on here.
            if (sub) {
                subBox = Layout.hpackNat(typesetChildren(_typeset, sub.children), newMultiplier);
                subBox.id = sub.id;
                // TODO: try to reuse getCharDepth
                if (jmetrics) {
                    const jDepth =
                        (baseFontSize * newMultiplier * (jmetrics.height - jmetrics.bearingY)) /
                        fontMetrics.unitsPerEm;
                    subBox.depth = Math.max(subBox.depth, jDepth);
                }

                // TODO: grab the max bearingY of all of [0-9a-zA-Z]
                if (Emetrics) {
                    const EHeight =
                        (baseFontSize * newMultiplier * Emetrics.bearingY) / fontMetrics.unitsPerEm;
                    subBox.height = Math.max(subBox.height, EHeight);
                }
            }
            let supBox: Layout.Box | undefined;
            // TODO: document this better so I know what's going on here.
            if (sup) {
                supBox = Layout.hpackNat(typesetChildren(_typeset, sup.children), newMultiplier);
                supBox.id = sup.id;
                // TODO: try to reuse getCharDepth
                if (jmetrics) {
                    const jDepth =
                        (baseFontSize * newMultiplier * (jmetrics.height - jmetrics.bearingY)) /
                        fontMetrics.unitsPerEm;
                    supBox.depth = Math.max(supBox.depth, jDepth);
                }

                // TODO: grab the max bearingY of all of [0-9a-zA-Z]
                if (Emetrics) {
                    const EHeight =
                        (baseFontSize * newMultiplier * Emetrics.bearingY) / fontMetrics.unitsPerEm;
                    supBox.height = Math.max(supBox.height, EHeight);
                }
            }
            const parentBox = Layout.makeSubSup(multiplier, subBox, supBox);
            parentBox.id = node.id;
            return parentBox;
        }
        case "frac": {
            const newMultiplier = multiplier; // === 1.0 ? 0.7 : 0.5;
            const _typeset = typeset(fontMetrics)(baseFontSize)(newMultiplier);
            const numerator = Layout.hpackNat(
                typesetChildren(_typeset, node.children[0].children),
                newMultiplier,
            );
            const denominator = Layout.hpackNat(
                typesetChildren(_typeset, node.children[1].children),
                newMultiplier,
            );

            // TODO: try to reuse getCharDepth
            if (jmetrics) {
                const jDepth =
                    (baseFontSize * newMultiplier * (jmetrics.height - jmetrics.bearingY)) /
                    fontMetrics.unitsPerEm;
                numerator.depth = Math.max(numerator.depth, jDepth);
                denominator.depth = Math.max(denominator.depth, jDepth);
            }

            // TODO: grab the max bearingY of all of [0-9a-zA-Z]
            if (Emetrics) {
                const EHeight =
                    (baseFontSize * newMultiplier * Emetrics.bearingY) / fontMetrics.unitsPerEm;
                numerator.height = Math.max(numerator.height, EHeight);
                denominator.height = Math.max(denominator.height, EHeight);
            }

            numerator.id = node.children[0].id;
            denominator.id = node.children[1].id;

            const frac = Layout.makeFract(multiplier, 5, numerator, denominator);
            frac.id = node.id;
            return frac;
        }
        case "root": {
            const radicand = Layout.hpackNat(
                typesetChildren(_typeset, node.children[0].children), // radicand
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
            const root = Layout.hpackNat([surd, Layout.makeKern(-10), vbox], multiplier);
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
