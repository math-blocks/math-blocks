import * as Editor from "@math-blocks/editor-core";
import {UnreachableCaseError} from "@math-blocks/core";

import * as Layout from "./layout";
import {processBox} from "./scene-graph";

import type {Group} from "./scene-graph";
import type {Context, Options} from "./types";

const DEBUG = typeof jest === "undefined";

const RADICAND = 1;

// Dedupe this with editor/src/util.ts
export const isGlyph = (
    node: Editor.types.Node,
    char: string,
): node is Editor.types.Atom => node.type === "atom" && node.value.char == char;

// Adds appropriate padding around operators where appropriate
const typesetChildren = (
    children: readonly Editor.types.Node[],
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
        typesetChildren(row.children, context),
        context.multiplier,
    );
    box.id = row.id;
    box.color = context?.colorMap?.get(row.id);

    return box;
};

const typesetColumn = (
    columns: Column[],
    colIndex: number,
    context: Context,
): Layout.Node[] => {
    const col = columns[colIndex];
    return col.nodes.map((child, index) => {
        if (child.type === "atom") {
            const {value} = child;
            const prevChild = index > 0 ? col.nodes[index - 1] : undefined;
            const unary =
                /[+\u2212]/.test(value.char) &&
                (prevChild
                    ? prevChild.type === "atom" &&
                      /[+\u2212<>\u2260=\u2264\u2265\u00B1(]/.test(
                          prevChild.value.char,
                      )
                    : true);
            const glyph = _typeset(child, context);
            const singleCharCol = col.nodes.length === 1;
            const prevCol = columns[colIndex - 1];
            const prevColPlusMinus =
                prevCol &&
                prevCol.nodes.length === 1 &&
                (isGlyph(prevCol.nodes[0], "+") ||
                    isGlyph(prevCol.nodes[0], "\u2212") ||
                    isGlyph(prevCol.nodes[0], "="));

            if (unary && (!singleCharCol || prevColPlusMinus)) {
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

type Column = {
    nodes: Editor.types.Node[];
    // TODO: change this to first and last
    start: number;
    end: number; // bounds are inclusive
};

// TODO: add columns before first separator and after last separator
export const splitRow = (row: Editor.types.Row): Column[] => {
    const result: Column[] = [];

    let column: Editor.types.Node[] = [];
    let start = -Infinity;
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
        end: Infinity,
    });

    return result;
};

const colToLayout = (
    row: Editor.types.Row,
    columns: Column[],
    columnLayouts: Layout.Node[][],
    columnWidths: number[],
    context: Context,
): Layout.Node => {
    const output = [];
    let i = 0;

    while (i < columns.length) {
        let col = columns[i];

        if (col.nodes.length === 0) {
            // empty middle column
            // Compute and push the first 1/2 column kern
            let kern = Layout.makeKern(columnWidths[i] / 2);
            if (col.start >= 0) {
                kern.id = row.children[col.start].id;
            }
            output.push(kern);

            // Create a kern that's 1/2 the width of the current column
            kern = Layout.makeKern(columnWidths[i] / 2);
            if (col.end < Infinity) {
                kern.id = row.children[col.end].id;
            }

            while (i + 1 < columns.length) {
                col = columns[i + 1];
                // If the next column is empty
                if (col.nodes.length === 0) {
                    // Expand the kern by 1/2 the width of the next column
                    kern.size += columnWidths[i + 1] / 2;
                    output.push(kern);
                    // Create a new kern that's 1/2 the width of the next column
                    kern = Layout.makeKern(columnWidths[i + 1] / 2);
                    kern.id = row.children[col.start].id;
                    // Advance to the column after that
                    i++;
                } else {
                    break;
                }
            }

            // Push the last 1/2 column kern
            output.push(kern);
        } else {
            // Handle separators in between two columns with content
            // TODO: It would be nice if we didn't have to insert these extra
            // kerns. We could do this if left-right arrow reducers were column
            // aware.
            const prevCol = columns[i - 1];
            if (prevCol && prevCol.nodes.length !== 0) {
                const sep = row.children[columns[i].start - 1];
                const kern = Layout.makeKern(0);
                kern.id = sep.id;
                output.push(kern);
            }
            const aWidth = Layout.hlistWidth(columnLayouts[i]);
            const kern = Layout.makeKern(Math.max(0, columnWidths[i] - aWidth));
            output.push(kern);
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
        [Layout.makeKern(fontSize / 4), node, Layout.makeKern(fontSize / 4)],
        multiplier,
    );
};

export const typesetWithWork = (
    state: Editor.State,
    context: Context,
    options: Options = {},
): Group => {
    const {multiplier} = context;

    // TODO: split state.rows in two arrays:
    // - math rows
    // - hrule rows
    // along with a mapping from destination index back to source index

    const rowCols = state.rows.map((rowState) => splitRow(rowState.math));

    /* istanbul ignore next */

    if (DEBUG) {
        console.log("rowCols[0]: ", rowCols[0]);
        console.log("rowCols[1]: ", rowCols[1]);
    }

    const colCount = rowCols[0].length;
    if (rowCols.some((cols) => cols.length !== colCount)) {
        throw new Error("column count in rows doesn't match");
    }

    const rowLayouts = rowCols.map((cols) =>
        cols.map(
            (col, index) =>
                // this function needs more info, in particular what was in the
                // previous column to determine how to render the spacing around
                // '+' and '-' characters
                typesetColumn(cols, index, context), // , col.nodes.length === 1),
        ),
    );

    /* istanbul ignore next */

    if (DEBUG) {
        const currentRow = state.rows[state.rowIndex];
        const currentCols = rowCols[state.rowIndex];
        const colCursor = Editor.util.cursorInColumns(
            currentCols,
            currentRow.cursor,
        );
        console.log(`the cursor is in column ${colCursor.colIndex}`);
    }

    const columnWidths = [];

    // Compute the width of each column
    for (let i = 0; i < rowCols[0].length; i++) {
        let width = -Infinity;
        let colEmpty = true;
        for (let j = 0; j < rowCols.length; j++) {
            const cell = rowCols[j][i];
            const cellLayout = rowLayouts[j][i];
            colEmpty = colEmpty && cell.nodes.length === 0;
            width = Math.max(width, Layout.hlistWidth(cellLayout));
        }
        if (colEmpty) {
            // always have padding in the first and last column if they're empty
            columnWidths.push(30);
        } else {
            columnWidths.push(width);
        }
    }

    // Compute new rows with properly sized kerns replacing "\u0008"s
    const outputRows: Layout.Node[] = [];
    for (let i = 0; i < state.rows.length; i++) {
        const row = state.rows[i];
        outputRows.push(
            colToLayout(
                row.math,
                rowCols[i],
                rowLayouts[i],
                columnWidths,
                context,
            ),
        );
    }

    let width = -Infinity;
    for (let i = 0; i < outputRows.length; i++) {
        width = Math.max(width, Layout.getWidth(outputRows[i]));
    }

    // TODO: add gaps between each row
    const outputRowsWithRules: Layout.Node[] = [];
    for (let i = 0; i < state.rows.length; i++) {
        const row = state.rows[i];
        if (row.hrule) {
            outputRowsWithRules.push(Layout.makeHRule(5, width));
        }
        outputRowsWithRules.push(outputRows[i]);
    }

    const verticalLayout = Layout.makeVBox(
        width,
        outputRowsWithRules[0],
        [],
        outputRowsWithRules.slice(1),
        multiplier,
    );

    return processBox({box: verticalLayout, ...options});
};

const _typeset = (node: Editor.types.Node, context: Context): Layout.Node => {
    const {fontMetrics, baseFontSize, multiplier, cramped} = context;
    const jmetrics = fontMetrics.glyphMetrics["j".charCodeAt(0)];
    const Emetrics = fontMetrics.glyphMetrics["E".charCodeAt(0)];

    switch (node.type) {
        case "row": {
            const row = typesetRow(node, context);
            row.height = Math.max(row.height, 0.85 * baseFontSize * multiplier);
            row.depth = Math.max(row.depth, 0.15 * baseFontSize * multiplier);

            return row;
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
            limits.color = context?.colorMap?.get(limits.id);

            return limits;
        }
        case "frac": {
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
        case "root": {
            const radicand = typesetRow(node.children[RADICAND], context);
            const Eheight = 50;
            radicand.width = Math.max(radicand.width, 30 * multiplier);
            radicand.height = Math.max(radicand.height, Eheight * multiplier);
            radicand.depth = Math.max(radicand.depth, 0);

            // TODO: make the surd stretchy
            const surd = Layout.hpackNat(
                [Layout.makeGlyph("\u221A", context)],
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
                [surd, Layout.makeKern(-10), vbox],
                multiplier,
            );
            root.id = node.id;
            root.color = context?.colorMap?.get(root.id);

            return root;
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

export const typeset = (
    node: Editor.types.Node,
    context: Context,
    options: Options = {},
): Group => {
    const box = _typeset(node, context) as Layout.Box;
    return processBox({box, ...options});
};
