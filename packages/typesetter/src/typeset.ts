import * as Editor from "@math-blocks/editor";
import * as Layout from "./layout";
import {FontMetrics} from "./metrics";
import {UnreachableCaseError} from "@math-blocks/core";

type ID = {
    id: number;
};

type Row = Editor.Row<Editor.Glyph, ID>;
type Node = Editor.Node<Editor.Glyph, ID>;

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
    column = false, // isSingleChildColumn?
    below = false,
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
            const glyph = typeset(child, context);

            if (unary && !column) {
                glyph.id = child.id;
                return glyph;
            } else if (
                /[+\-\u00B7\u2212<>\u2260=\u2264\u2265\u00B1]/.test(value.char)
            ) {
                const box = context.cramped
                    ? glyph
                    : withOperatorPadding(glyph, context, below);
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

type Column = {
    nodes: Node[];
    start: number;
    end: number; // always +1 the character being included
};

export const splitRow = (row: Row): Column[] => {
    const result: Column[] = [];

    let column: Node[] = [];
    let parens = 0;
    let start = 0;
    let prevCharIsSep = false;

    for (let i = 0; i < row.children.length; i++) {
        const child = row.children[i];

        const charIsSep =
            child.type === "atom" && child.value.char === "\u0008";
        console.log(`charIsSep = ${charIsSep}`);

        if (charIsSep) {
            if (prevCharIsSep) {
                result.push({
                    nodes: [],
                    start: start,
                    end: i + 1,
                });
            } else if (column.length > 0) {
                result.push({
                    nodes: column,
                    start: start,
                    end: i + 1,
                });
                column = [];
                start = i + 1;
            }
            // If the previous column wasn't a separator then we ignore the
            // character altogether.  To have one column we need two separators
            // in a row.  If there are n separators in a row then there that
            // represents n-1 columns.
        } else if (child.type === "atom" && child.value.char === "(") {
            parens++;
            column.push(child);
        } else if (child.type === "atom" && child.value.char === ")") {
            parens--;
            column.push(child);
        } else if (
            // Handle a +, -, or = in a single column
            child.type === "atom" &&
            parens === 0 &&
            ["+", "=", "\u2212"].includes(child.value.char)
        ) {
            if (column.length > 0) {
                result.push({
                    nodes: column,
                    start: start,
                    end: i + 1,
                });
            }
            result.push({
                nodes: [child],
                start: i,
                end: i + 1,
            });
            column = [];
            start = i + 1;
        } else {
            column.push(child);
        }

        prevCharIsSep = charIsSep;
    }

    if (column.length > 0) {
        result.push({
            nodes: column,
            start: start,
            end: row.children.length,
        });
    }

    return result;
};

const withOperatorPadding = (
    node: Layout.Node,
    context: Context,
    below = false,
): Layout.Node => {
    const {baseFontSize, multiplier} = context;
    const fontSize = multiplier * baseFontSize;

    // We need to tweak this loic so that we only add padding on the right side
    // for binary operators below.  This is so that we don't get extra space
    // when adding/subtracting something just to the right of an "=" in the above
    return Layout.hpackNat(
        below
            ? [node, Layout.makeKern(fontSize / 4)]
            : [
                  Layout.makeKern(fontSize / 4),
                  node,
                  Layout.makeKern(fontSize / 4),
              ],
        multiplier,
    );
};

export const typesetWithWork = (
    aboveNode: Editor.Row<Editor.Glyph, ID>,
    belowNode: Editor.Row<Editor.Glyph, ID>,
    context: Context,
): Layout.Box => {
    const {multiplier} = context;

    const above = splitRow(aboveNode);
    const below = splitRow(belowNode);

    if (above.length !== below.length) {
        throw new Error("column count in rows doesn't match");
    }

    const aboveColumns = above.map((column) =>
        typesetChildren(
            column.nodes,
            context,
            column.nodes.length === 1,
            false,
        ),
    );
    const belowColumns = below.map((column) =>
        typesetChildren(column.nodes, context, column.nodes.length === 1, true),
    );

    const aboveOutput = [];
    const belowOutput = [];

    for (let i = 0; i < above.length; i++) {
        const aCol = aboveColumns[i];
        const bCol = belowColumns[i];

        const aWidth = Layout.hlistWidth(aCol);
        const bWidth = Layout.hlistWidth(bCol);

        // TODO: if there's an empty column, then we have to give the kern
        // we create an id that matches the id of the separator char.  We also
        // have to handle a single column creating two kerns as well as the
        // case where there's more than two separator chars in a row.
        if (aWidth < bWidth) {
            // right align above content
            const kern = Layout.makeKern(bWidth - aWidth);
            aboveOutput.push(kern, ...aCol);
            belowOutput.push(...bCol);
        } else if (bWidth < aWidth) {
            aboveOutput.push(...aCol);
            // right align below content
            const kern = Layout.makeKern(aWidth - bWidth);
            if (below[i].nodes.length === 0) {
                const node = belowNode.children[below[i].start];
                kern.id = node.id;
            }
            belowOutput.push(kern, ...bCol);
        } else {
            aboveOutput.push(...aCol);
            belowOutput.push(...bCol);
        }
    }

    const aboveRow = Layout.hpackNat(aboveOutput, context.multiplier);
    const belowRow = Layout.hpackNat(belowOutput, context.multiplier);

    aboveRow.id = aboveNode.id;
    belowRow.id = belowNode.id;

    console.log("aboveRow");
    console.log(aboveRow);
    console.log("belowRow");
    console.log(belowRow);

    const width = Math.max(
        Layout.getWidth(aboveRow),
        Layout.getWidth(belowRow),
    );

    const verticalLayout = Layout.makeVBox(
        width,
        aboveRow,
        [],
        [
            Layout.makeKern(8), // row gap
            belowRow,
        ],
        multiplier,
    );

    return verticalLayout;
};

const typeset = (
    node: Editor.Node<Editor.Glyph, ID>,
    context: Context,
    column = false, // isSingleChildColumn?
    below = false,
): Layout.Node => {
    const {fontMetrics, baseFontSize, multiplier, cramped} = context;
    const fontSize = multiplier * baseFontSize;
    const _makeGlyph = Layout.makeGlyph(fontMetrics)(fontSize);
    const jmetrics = fontMetrics.glyphMetrics["j".charCodeAt(0)];
    const Emetrics = fontMetrics.glyphMetrics["E".charCodeAt(0)];

    switch (node.type) {
        case "row": {
            const row = Layout.hpackNat(
                typesetChildren(node.children, context, column, below),
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
