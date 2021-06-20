import * as Editor from "@math-blocks/editor-core";

import * as Layout from "../layout";
import {fontSizeForContext, makeDelimiter} from "../utils";

import type {Context} from "../types";

type Row = {
    children: Layout.HBox[];
    height: number;
    depth: number;
};
type Col = {
    children: Layout.HBox[];
    width: number;
};

const DEFAULT_GUTTER_WIDTH = 50;

const padContent = (
    content: Layout.Content,
    kernSize: number,
): Layout.Content => {
    if (content.type === "static") {
        return {
            type: "static",
            nodes: [
                Layout.makeKern(kernSize),
                ...content.nodes,
                Layout.makeKern(kernSize),
            ],
        };
    } else if (content.type === "cursor") {
        return {
            type: "cursor",
            left: [Layout.makeKern(kernSize), ...content.left],
            right: [...content.right, Layout.makeKern(kernSize)],
        };
    } else {
        return {
            type: "selection",
            left: [Layout.makeKern(kernSize), ...content.left],
            selection: content.selection,
            right: [...content.right, Layout.makeKern(kernSize)],
        };
    }
};

export const typesetTable = (
    typesetChildren: (Layout.HBox | null)[],
    node: Editor.types.Table | Editor.ZTable,
    context: Context,
    zipper?: Editor.Zipper,
): Layout.HBox | Layout.VBox => {
    const columns: Col[] = [];
    const rows: Row[] = [];

    const gutterWidth: number =
        typeof node.gutterWidth === "undefined"
            ? DEFAULT_GUTTER_WIDTH
            : node.gutterWidth;

    // Group cells into rows and columns and determine the width of each
    // column and the depth/height of each row.
    for (let i = 0; i < node.colCount; i++) {
        for (let j = 0; j < node.rowCount; j++) {
            if (!columns[i]) {
                columns[i] = {
                    children: [],
                    width: 0,
                };
            }
            if (!rows[j]) {
                rows[j] = {
                    children: [],
                    height: 0,
                    depth: 0,
                };
            }
            const cellIndex = j * node.colCount + i;
            let cell = typesetChildren[cellIndex];
            const children =
                node.type === "table"
                    ? node.children
                    : [
                          ...node.left,
                          Editor.zrowToRow(zipper.row),
                          ...node.right,
                      ];
            const child = children[cellIndex];
            if (cell) {
                if (
                    child &&
                    child.children.length === 1 &&
                    child.children[0]?.type === "atom" &&
                    ["+", "\u2212"].includes(child.children[0].value.char)
                ) {
                    cell.width += 32;
                    cell.content = padContent(cell.content, 16);
                }
                columns[i].width = Math.max(cell.width, columns[i].width);
                rows[j].height = Math.max(cell.height, rows[j].height);
                rows[j].depth = Math.max(cell.depth, rows[j].depth);
            } else {
                // Use an empty Layout.Box for children that were null
                cell = {
                    type: "HBox",
                    shift: 0,
                    content: {
                        type: "static",
                        nodes: [],
                    },
                    // These values don't matter since the box is empty
                    fontSize: 0,
                    style: {},
                    // These will get filled in later
                    width: 0,
                    height: 0,
                    depth: 0,
                };
            }

            columns[i].children.push(cell);
            rows[j].children.push(cell);
        }
    }

    const cursorIndex = node.type === "ztable" ? node.left.length : -1;
    console.log(`cursorIndex = ${cursorIndex}`);
    if (cursorIndex !== -1) {
        const cursorCol = cursorIndex % node.colCount;
        if (columns[cursorCol].width === 0) {
            columns[cursorCol].width = 32;
        }
    }

    // Adjust the width of cells in the same column to be the same
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        for (let j = 0; j < col.children.length; j++) {
            // center the cell content
            const originalWidth = Layout.getWidth(col.children[j]);
            const baseKernSize = (col.width - originalWidth) / 2;
            const rightKernSize =
                i < columns.length - 1
                    ? baseKernSize + gutterWidth / 2
                    : baseKernSize;
            const leftKernSize =
                i > 0 ? baseKernSize + gutterWidth / 2 : baseKernSize;
            const cell = Layout.rebox(
                col.children[j],
                Layout.makeKern(leftKernSize, "start"),
                Layout.makeKern(rightKernSize, "end"),
            );
            col.children[j] = cell;
            // rows[] has its own references so we need to update it as well
            rows[j].children[i] = cell;
        }
    }

    // Adjust the height/depth of cells in the same row to be the same
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        for (let j = 0; j < row.children.length; j++) {
            row.children[j].height = row.height;
            row.children[j].depth = row.depth;
        }
    }

    const rowBoxes = rows.map((row) =>
        Layout.makeStaticHBox(row.children, context),
    );
    const width =
        columns.reduce((sum, col) => sum + col.width, 0) +
        gutterWidth * (columns.length - 1);

    const inner = Layout.makeVBox(
        width,
        rowBoxes[0],
        [],
        rowBoxes.slice(1),
        context,
    );

    const {constants} = context.fontData.font.math;
    const fontSize = fontSizeForContext(context);
    const shift = (fontSize * constants.axisHeight.value) / 1000;
    // Equalize the depth and height and then shift up so the center of the
    // table aligns with the central axis.
    const vsize = Layout.vsize(inner);
    inner.height = vsize / 2 + shift;
    inner.depth = vsize / 2 - shift;

    const thresholdOptions = {
        value: "sum" as const,
        strict: true,
    };

    if (!node.delimiters) {
        inner.id = node.id;
        inner.style = node.style;

        return inner;
    }

    const open = makeDelimiter(
        node.delimiters.left.value.char,
        inner,
        thresholdOptions,
        context,
    );
    const close = makeDelimiter(
        node.delimiters.right.value.char,
        inner,
        thresholdOptions,
        context,
    );

    const table = Layout.makeStaticHBox([open, inner, close], context);

    table.id = node.id;
    table.style = node.style;

    return table;
};
