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
    // TODO: change this to first and last
    start: number;
    end: number; // bounds are inclusive
};

// TODO: add columns before first separator and after last separator
export const splitRow = (row: Row): Column[] => {
    const result: Column[] = [];

    let column: Node[] = [];
    let start = 0;
    let i = 0;

    while (i < row.children.length) {
        const child = row.children[i];

        const charIsSep =
            child.type === "atom" && child.value.char === "\u0008";

        if (charIsSep) {
            result.push({
                nodes: column,
                start: start,
                end: i, // column bounds are inclusive
            });
            column = [];
            start = i;
        } else {
            column.push(child);
        }

        i++;
    }

    result.push({
        nodes: column,
        start: start,
        end: start,
    });

    return result;
};

const colToRow = (
    row: Editor.Row<Editor.Glyph, ID>,
    columns: Column[],
    columnLayouts: Layout.Node[][],
    columnWidths: number[],
    context: Context,
): Layout.Node => {
    const output = [];
    let i = 0;

    // NOTES:
    // - empty start column: start and end are both zero
    // - empty end column: start and end are both the last index
    // - empty middle columns: start and end are separated by 1

    const firstIndex = 0;
    const lastIndex = row.children.length - 1;

    while (i < columns.length) {
        const col = columns[i];

        if (col.start === firstIndex && col.end === lastIndex) {
            // empty first column
        } else if (col.start === firstIndex && col.end === lastIndex) {
            // empty last column
        } else if (i > 0 && col.end === col.start + 1) {
            // empty middle column
            // Compute and push the first 1/2 column kern
            const k1 = Layout.makeKern(columnWidths[i] / 2);
            k1.id = row.children[columns[i].start].id;
            output.push(k1);

            // Create a kern that's 1/2 the width of the current column
            let k2 = Layout.makeKern(columnWidths[i] / 2);
            k2.id = row.children[columns[i].start + 1].id;

            while (i + 1 < columns.length) {
                // If the next column is empty
                if (columns[i + 1].end === columns[i + 1].start + 1) {
                    // Expand the kern by 1/2 the width of the next column
                    k2.size += columnWidths[i + 1] / 2;
                    output.push(k2);
                    // Create a new kern that's 1/2 the width of the next column
                    k2 = Layout.makeKern(columnWidths[i + 1] / 2);
                    k2.id = row.children[columns[i + 1].start].id;
                    // Advance to the column after that
                    i++;
                } else {
                    break;
                }
            }

            // Push the last 1/2 column kern
            output.push(k2);
        } else {
            // Handle separators in between two columns with content
            if (
                (i > 1 && columns[i - 1].end - columns[i - 1].start > 1) ||
                (i === 1 && columns[0].end - columns[0].start > 0)
            ) {
                const sep = row.children[columns[i].start - 1];
                const kern = Layout.makeKern(0);
                kern.id = sep.id;
                output.push(kern);
            }
            const aWidth = Layout.hlistWidth(columnLayouts[i]);
            if (aWidth < columnWidths[i]) {
                const kern = Layout.makeKern(columnWidths[i] - aWidth);
                output.push(kern);
            }
            output.push(...columnLayouts[i]);
        }

        i++;
    }

    const layout = Layout.hpackNat(output, context.multiplier);

    const {baseFontSize, multiplier} = context;
    layout.height = Math.max(layout.height, 0.85 * baseFontSize * multiplier);
    layout.depth = Math.max(layout.depth, 0.15 * baseFontSize * multiplier);
    layout.id = row.id;

    return layout;
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

    console.log("aboveNode: ", aboveNode);
    console.log("belowNode: ", belowNode);

    const aboveCols = splitRow(aboveNode);
    const belowCols = splitRow(belowNode);
    console.log("aboveCols: ", aboveCols);
    console.log("belowCols: ", belowCols);

    if (aboveCols.length !== belowCols.length) {
        throw new Error("column count in rows doesn't match");
    }

    const aboveLayouts = aboveCols.map((column) =>
        typesetChildren(
            column.nodes,
            context,
            column.nodes.length === 1,
            false,
        ),
    );
    const belowLayouts = belowCols.map((column) =>
        typesetChildren(column.nodes, context, column.nodes.length === 1, true),
    );
    console.log("belowLayouts: ", belowLayouts);

    const columnWidths = [];

    // Compute the width of each column
    for (let i = 0; i < aboveCols.length; i++) {
        const aWidth = Layout.hlistWidth(aboveLayouts[i]);
        const bWidth = Layout.hlistWidth(belowLayouts[i]);
        columnWidths.push(Math.max(aWidth, bWidth));
    }

    // Compute new rows with properly sized kerns replacing "\u0008"s
    const aboveRow = colToRow(
        aboveNode,
        aboveCols,
        aboveLayouts,
        columnWidths,
        context,
    );
    const belowRow = colToRow(
        belowNode,
        belowCols,
        belowLayouts,
        columnWidths,
        context,
    );

    console.log("aboveRow:", aboveRow);
    console.log("belowRow:", belowRow);

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
