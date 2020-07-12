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
    return children.map((child, index) => {
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
            const glyph = typeset(child, context);

            if (unary) {
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
            return typeset(child, context);
        }
    });
};

type Below = {
    lhs: Editor.Row<Editor.Glyph, ID>;
    rhs: Editor.Row<Editor.Glyph, ID>;
};

type Term = {
    operator?: Layout.Node;
    value: Layout.Node[];
};

const splitIntoTerms = (
    nodes: Editor.Node<Editor.Glyph, ID>[],
    context: Context,
): Term[] => {
    const {fontMetrics, baseFontSize, multiplier} = context;
    const fontSize = multiplier * baseFontSize;
    const _makeGlyph = Layout.makeGlyph(fontMetrics)(fontSize);

    const result: Term[] = [];
    let parenCount = 0;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type === "atom") {
            if (node.value.char === "(") {
                parenCount++;
            } else if (node.value.char === ")") {
                parenCount--;
            }
        }

        const layoutNode =
            node.type === "atom" && /[+\u2212]/.test(node.value.char)
                ? withOperatorPadding(_makeGlyph(node.value.char), context)
                : typeset(node, context);

        if (
            parenCount === 0 &&
            node.type === "atom" &&
            /[+\u2212]/.test(node.value.char)
        ) {
            result.push({
                operator: layoutNode,
                value: [],
            });
        } else {
            if (i === 0) {
                result.push({
                    value: [],
                });
            }

            const currentTerm = result[result.length - 1];
            currentTerm.value.push(layoutNode);
        }
    }

    return result;
};

const withOperatorPadding = (
    node: Layout.Node,
    context: Context,
): Layout.Node => {
    const {baseFontSize, multiplier} = context;
    const fontSize = multiplier * baseFontSize;

    return Layout.hpackNat(
        [Layout.makeKern(fontSize / 4), node, Layout.makeKern(fontSize / 4)],
        multiplier,
    );
};

const flattenTerms = (terms: Term[]): Layout.Node[] => {
    const result: Layout.Node[] = [];
    for (const term of terms) {
        if (term.operator) {
            result.push(term.operator);
        }
        result.push(...term.value);
    }
    return result;
};

/**
 * Creates a kern that's the same with as the node or nodes.
 * @param arg {Layout.Node | Layout.Nodes[]}
 */
const phantom: {
    (node: Layout.Node): Layout.Kern;
    (nodes: Layout.Node[]): Layout.Kern;
} = (arg: Layout.Node | Layout.Node[]): Layout.Kern => {
    if (Array.isArray(arg)) {
        return Layout.makeKern(Layout.hlistWidth(arg));
    }
    return Layout.makeKern(Layout.getWidth(arg));
};

const typesetWithWork = (
    node: Editor.Row<Editor.Glyph, ID>,
    below: Below, // this is where we're showing work
    context: Context,
): Layout.Node => {
    const {baseFontSize, multiplier, fontMetrics} = context;
    const fontSize = multiplier * baseFontSize;

    const equalIndex = node.children.findIndex(
        (child) => child.type === "atom" && child.value.char === "=",
    );

    const lhsTop = node.children.slice(0, equalIndex);
    const rhsTop = node.children.slice(equalIndex + 1);

    const lhsTerms = splitIntoTerms(lhsTop, context);
    const rhsTerms = splitIntoTerms(rhsTop, context);

    const _makeGlyph = Layout.makeGlyph(fontMetrics)(fontSize);

    const equalLayoutNode = withOperatorPadding(_makeGlyph("="), context);

    // TODO: split Layout.Box into Layout.HBox and Layout.VBox so that we don't
    // have too keep checking the kind.
    const lhsBottomChildren = typesetChildren(below.lhs.children, context);
    const rhsBottomChildren = typesetChildren(below.rhs.children, context);

    // TODO: change 'content' to 'children'
    if (
        lhsBottomChildren[0].type === "Glyph" &&
        /[+\u2212]/.test(lhsBottomChildren[0].char)
    ) {
        lhsBottomChildren[0] = withOperatorPadding(
            lhsBottomChildren[0],
            context,
        );
    }
    if (
        rhsBottomChildren[0].type === "Glyph" &&
        /[+\u2212]/.test(rhsBottomChildren[0].char)
    ) {
        rhsBottomChildren[0] = Layout.hpackNat(
            [rhsBottomChildren[0], Layout.makeKern(fontSize / 4)],
            multiplier,
        );
    }

    // TODO: specify these as part of Below
    const leftColumn = 1;
    const rightColumn = 0;

    const lhsBottom = Layout.hpackNat(
        lhsTerms.flatMap((term, index): Layout.Node[] => {
            if (index === leftColumn) {
                const topWidth = term.operator
                    ? Layout.getWidth(term.operator) +
                      Layout.hlistWidth(term.value)
                    : Layout.hlistWidth(term.value);
                const bottomWidth = Layout.hlistWidth(lhsBottomChildren);
                if (bottomWidth > topWidth) {
                    term.value.unshift(Layout.makeKern(bottomWidth - topWidth));
                } else if (bottomWidth < topWidth) {
                    lhsBottomChildren.splice(
                        1,
                        0,
                        Layout.makeKern(topWidth - bottomWidth),
                    );
                }
                return lhsBottomChildren;
            } else {
                const result: Layout.Node[] = [];
                if (term.operator) {
                    result.push(phantom(term.operator));
                }
                result.push(phantom(term.value));
                return result;
            }
        }),
        multiplier,
    );

    const rhsBottom = Layout.hpackNat(
        rhsTerms.flatMap((term, index): Layout.Node[] => {
            if (index === rightColumn) {
                const topWidth = term.operator
                    ? Layout.getWidth(term.operator) +
                      Layout.hlistWidth(term.value)
                    : Layout.hlistWidth(term.value);
                const bottomWidth =
                    index === 0
                        ? // Also check that the bottom children starts with an operator
                          Layout.hlistWidth(rhsBottomChildren.slice(1))
                        : Layout.hlistWidth(rhsBottomChildren);
                if (bottomWidth > topWidth) {
                    term.value.unshift(Layout.makeKern(bottomWidth - topWidth));
                } else if (bottomWidth < topWidth) {
                    rhsBottomChildren.splice(
                        1,
                        0,
                        Layout.makeKern(topWidth - bottomWidth),
                    );
                }
                return rhsBottomChildren;
            } else {
                const result: Layout.Node[] = [];
                if (term.operator) {
                    result.push(phantom(term.operator));
                }
                result.push(phantom(term.value));
                return result;
            }
        }),
        multiplier,
    );

    const belowRow = Layout.hpackNat(
        [lhsBottom, phantom(equalLayoutNode), rhsBottom],
        multiplier,
    );

    const topRow = Layout.hpackNat(
        [
            ...flattenTerms(lhsTerms),
            equalLayoutNode,
            phantom(rhsBottomChildren[0]),
            ...flattenTerms(rhsTerms),
        ],
        multiplier,
    );

    const equationWithWork = Layout.makeVBox(
        Layout.getWidth(topRow),
        topRow,
        [],
        [
            Layout.makeKern(8), // row gap
            belowRow,
        ],
        multiplier,
    );

    equationWithWork.width = Math.max(
        Layout.getWidth(topRow),
        Layout.getWidth(belowRow),
    );

    return equationWithWork;
};

const typeset = (
    node: Editor.Node<Editor.Glyph, ID>,
    context: Context,
    below?: Below,
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

            const isEquation = node.children.some(
                (child) => child.type === "atom" && child.value.char === "=",
            );

            if (below && isEquation) {
                return typesetWithWork(node, below, context);
            }

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
        case "limits": {
            const newMultiplier = multiplier === 1.0 ? 0.7 : 0.5;
            const [lower, upper] = node.children;

            const lowerBox = Layout.hpackNat(
                typesetChildren(lower.children, {
                    ...context,
                    multiplier: newMultiplier,
                    cramped: true,
                }),
                newMultiplier,
            );
            lowerBox.id = lower.id;
            const inner = typeset(node.inner, context);

            let upperBox: Layout.Box | undefined;
            if (upper) {
                upperBox = Layout.hpackNat(
                    typesetChildren(upper.children, {
                        ...context,
                        multiplier: newMultiplier,
                        cramped: true,
                    }),
                    newMultiplier,
                );
                upperBox.id = upper.id;
            }

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
                              Layout.makeKern((width - innerWidth) / 2),
                              inner,
                              Layout.makeKern((width - innerWidth) / 2),
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
            return limits;
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
