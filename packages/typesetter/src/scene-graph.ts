import {UnreachableCaseError} from "@math-blocks/core";

import * as Layout from "./layout";

import type {FontData} from "@math-blocks/opentype";

type Common = {
    id?: number;
    color?: string;
};

export type Group = {
    type: "group";
    // position relative the parent group
    x: number;
    y: number;
    width: number;
    height: number;
    children: readonly Node[];
} & Common;

export type Glyph = {
    type: "glyph";
    x: number;
    y: number;
    width: number;
    glyph: Layout.Glyph;
} & Common;

export type Line = {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    thickness: number;
} & Common;

export type Rect = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    stroke?: string;
} & Common;

export type Node = Group | Glyph | Line | Rect;

export type Point = {
    x: number;
    y: number;
};

const processHRule = (hrule: Layout.HRule, loc: Point): Node => {
    const advance = Layout.getWidth(hrule);
    return {
        type: "line",
        x1: loc.x,
        y1: loc.y,
        x2: loc.x + advance,
        y2: loc.y,
        thickness: hrule.thickness,
        color: hrule.color,
        id: hrule.id,
    };
};

const processGlyph = (glyph: Layout.Glyph, loc: Point): Node => {
    return {
        type: "glyph",
        x: loc.x,
        y: loc.y,
        width: Layout.getWidth(glyph),
        glyph: glyph,
        color: glyph.color,
        id: glyph.id,
    };
};

export type LayoutCursor = {
    parent: number;
    prev: number;
    next: number;
    selection: boolean;
};

const CURSOR_WIDTH = 2;

const processHBox = (box: Layout.Box, loc: Point, context: Context): Group => {
    const pen = {x: 0, y: 0};

    const selectionBoxes: Rect[] = [];

    const children: Node[] = [];

    const hasSelection =
        !context.inSelection &&
        box.content.length === 3 &&
        box.content[1].length > 0;

    const {
        layer,
        fontData: {font},
    } = context;
    const {fontSize} = box;
    const parenMetrics = font.getGlyphMetrics(font.getGlyphID(")"));
    // This assumes that parenMetrics.height < font.head.unitsPerEm
    const overshoot = (font.head.unitsPerEm - parenMetrics.height) / 2;

    const ascent =
        ((parenMetrics.bearingY + overshoot) * fontSize) / font.head.unitsPerEm;

    box.content.forEach((section, index) => {
        const isSelection = hasSelection && index === 1;

        // There should only be two sections max.  If there are two sections
        // then we should draw a cursor in between the two of them.
        if (
            index === 1 &&
            !hasSelection &&
            !context.inSelection &&
            context.showCursor
        ) {
            // Draw the cursor.
            children.push({
                type: "rect",
                x: pen.x - CURSOR_WIDTH / 2,
                y: pen.y - ascent,
                width: CURSOR_WIDTH,
                height: fontSize,
            });
        }

        section.forEach((node) => {
            if (isSelection && layer === "bg") {
                const yMin = -Math.max(Layout.getHeight(node), ascent);

                const height = Math.max(
                    Layout.getHeight(node) + Layout.getDepth(node),
                    fontSize,
                );

                selectionBoxes.push({
                    type: "rect",
                    x: pen.x,
                    y: yMin,
                    width: Layout.getWidth(node),
                    height: height,
                });
            }

            const advance = Layout.getWidth(node);
            const height = Layout.getHeight(node);
            const depth = Layout.getDepth(node);

            switch (node.type) {
                case "Box": {
                    const child = _processBox(
                        node,
                        {x: pen.x, y: pen.y + node.shift},
                        {
                            ...context,
                            inSelection: context.inSelection || hasSelection,
                        },
                    );

                    // We always have to include child groups regardless of the
                    // layer.  TODO: drop this once we flatten the scene graph.
                    children.push(child);

                    if (layer === "debug") {
                        children.push({
                            type: "rect",
                            x: pen.x,
                            y: pen.y - height,
                            width: advance,
                            height: depth + height,
                            fill: "none",
                            stroke: "red",
                        });
                    }

                    break;
                }
                case "HRule": {
                    const child = processHRule(node, pen);
                    if (layer === "fg") {
                        children.push(child);
                    }
                    break;
                }
                case "Glyph": {
                    const child = processGlyph(node, pen);

                    if (layer === "fg") {
                        children.push(child);
                    }

                    if (layer === "debug") {
                        children.push({
                            type: "rect",
                            x: pen.x,
                            y: pen.y - height,
                            width: advance,
                            height: depth + height,
                            fill: "none",
                            stroke: "red",
                        });
                    }

                    break;
                }
                case "Kern":
                    // We don't need to include kerns in the output since we include
                    // the cursor or select rectangle in the scene graph.
                    break;
                default:
                    throw new UnreachableCaseError(node);
            }

            pen.x += advance;
        });
    });

    // Draw the selection.
    if (layer === "bg") {
        for (const selectionBox of selectionBoxes) {
            children.unshift({
                ...selectionBox,
                fill: "Highlight",
            });
        }
    }

    return {
        type: "group",
        x: loc.x,
        y: loc.y,
        width: Layout.getWidth(box),
        height: Layout.vsize(box),
        children: children,
        color: box.color,
        id: box.id,
    };
};

const processVBox = (box: Layout.Box, loc: Point, context: Context): Group => {
    const pen = {x: 0, y: 0};

    pen.y -= box.height;

    const children: Node[] = [];
    const {layer} = context;

    box.content.forEach((section) => {
        section.forEach((node) => {
            const width = Layout.getWidth(node);
            const height = Layout.getHeight(node);
            const depth = Layout.getDepth(node);

            switch (node.type) {
                case "Box": {
                    // TODO: reconsider whether we should be taking the shift into
                    // account when computing the height, maybe we can drop this
                    // and simplify things.  The reason why we zero out the shift
                    // here is that when we render a box inside of a vbox, the shift
                    // is a horizontal shift as opposed to a vertical one.
                    // I'm not sure we can do this properly since how the shift is
                    // used depends on the parent box type.  We could pass that info
                    // to the getHeight() function... we should probably do an audit
                    // of all the callsites for getHeight()
                    const height = Layout.getHeight({...node, shift: 0});
                    const depth = Layout.getDepth({...node, shift: 0});

                    pen.y += height;
                    // TODO: see if we can get rid of this check in the future
                    if (Number.isNaN(pen.y)) {
                        // eslint-disable-next-line no-debugger
                        debugger;
                    }

                    const child = _processBox(
                        node,
                        {x: pen.x + node.shift, y: pen.y},
                        context,
                    );

                    // We always have to include child groups regardless of the
                    // layer.  TODO: drop this once we flatten the scene graph.
                    children.push(child);

                    if (layer === "debug") {
                        children.push({
                            type: "rect",
                            x: pen.x + node.shift,
                            y: pen.y - height,
                            width: width,
                            height: depth + height,
                            fill: "none",
                            stroke: "red",
                        });
                    }

                    pen.y += depth;
                    break;
                }
                case "HRule": {
                    pen.y += height;
                    const child = processHRule(node, pen);
                    if (layer === "fg") {
                        children.push(child);
                    }
                    pen.y += depth;
                    break;
                }
                case "Glyph": {
                    // Although there currently isn't anything that uses a glyph
                    // in a vbox, we'll likely need it for accents.
                    pen.y += height;
                    const child = processGlyph(node, pen);

                    if (layer === "fg") {
                        children.push(child);
                    }

                    if (layer === "debug") {
                        children.push({
                            type: "rect",
                            x: pen.x,
                            y: pen.y,
                            width: width,
                            height: depth + height,
                        });
                    }

                    pen.y += depth;
                    break;
                }
                case "Kern":
                    pen.y += node.size;
                    break;
                default:
                    throw new UnreachableCaseError(node);
            }
        });
    });

    return {
        type: "group",
        x: loc.x,
        y: loc.y,
        width: Layout.getWidth(box),
        height: Layout.vsize(box),
        children: children,
        color: box.color,
        id: box.id,
    };
};

type Options = {
    showCursor?: boolean;
    debug?: boolean;
};

type Context = {
    fontData: FontData;
    showCursor: boolean;
    inSelection: boolean;
    layer: "fg" | "bg" | "debug";
};

const _processBox = (box: Layout.Box, loc: Point, context: Context): Group => {
    switch (box.kind) {
        case "hbox":
            return processHBox(box, loc, context);
        case "vbox":
            return processVBox(box, loc, context);
    }
};

export const processBox = (
    box: Layout.Box,
    fontData: FontData,
    options: Options = {},
): Group => {
    const layers: Group[] = [];

    const loc = {x: 0, y: Layout.getHeight(box)};
    const context: Context = {
        showCursor: !!options.showCursor,
        inSelection: false,
        fontData: fontData,
        layer: "fg",
    };
    const fgLayer = _processBox(box, loc, context);

    const {fontSize} = box;
    const height = Math.max(fgLayer.height, fontSize);

    const {font} = fontData;
    const parenMetrics = font.getGlyphMetrics(font.getGlyphID(")"));
    // This assumes that parenMetrics.height < font.head.unitsPerEm
    const overshoot = (font.head.unitsPerEm - parenMetrics.height) / 2;
    const ascent =
        ((parenMetrics.bearingY + overshoot) * fontSize) / font.head.unitsPerEm;

    fgLayer.y = Math.max(fgLayer.y, ascent);
    fgLayer.height = height;

    context.layer = "bg";
    const bgLayer = _processBox(box, loc, context);

    layers.push(bgLayer);
    layers.push(fgLayer);

    if (options.debug) {
        context.layer = "debug";
        const debugLayer = _processBox(box, loc, context);

        layers.push(debugLayer);
    }

    const scene: Group = {
        type: "group",
        x: 0,
        y: 0,
        width: fgLayer.width,
        height: fgLayer.height,
        children: layers,
    };

    return scene;
};
