import {UnreachableCaseError} from "@math-blocks/core";

import * as Layout from "./layout";

import type {FontData} from "@math-blocks/opentype";

type Common = {
    id?: number;
    color?: string;
};

export type Group = {
    type: "group";
    orientation: "vertical" | "horizontal";
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
    flag?: "start" | "end";
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
            if (isSelection && layer === "selection") {
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
                            id: node.id,
                            x: pen.x,
                            y: pen.y - height,
                            width: advance,
                            height: depth + height,
                            fill: "none",
                            stroke: "red",
                        });
                    }

                    if (layer === "hitboxes") {
                        // TODO: do a second pass on the hitboxes to expand them
                        // to their full height
                        children.push({
                            type: "rect",
                            id: node.id,
                            x: pen.x,
                            y: pen.y - box.height,
                            width: advance,
                            height: box.depth + box.height,
                            fill: "none",
                            stroke: "red",
                        });
                    }

                    break;
                }
                case "HRule": {
                    const child = processHRule(node, pen);
                    if (layer === "content") {
                        children.push(child);
                    }
                    break;
                }
                case "Glyph": {
                    const child = processGlyph(node, pen);

                    if (layer === "content") {
                        children.push(child);
                    }

                    if (layer === "debug") {
                        children.push({
                            type: "rect",
                            id: node.id,
                            x: pen.x,
                            y: pen.y - height,
                            width: advance,
                            height: depth + height,
                            fill: "none",
                            stroke: "red",
                        });
                    }

                    if (layer === "hitboxes") {
                        // TODO: do a second pass on the hitboxes to expand them
                        // to their full height
                        children.push({
                            type: "rect",
                            id: node.id,
                            x: pen.x,
                            y: pen.y - box.height,
                            width: advance,
                            height: box.depth + box.height,
                            fill: "none",
                            stroke: "red",
                        });
                    }

                    break;
                }
                case "Kern":
                    if (node.flag) {
                        if (layer === "hitboxes") {
                            // TODO: do a second pass on the hitboxes to expand
                            // them to their full height
                            children.push({
                                type: "rect",
                                flag: node.flag,
                                x: pen.x,
                                y: pen.y - box.height,
                                width: node.size,
                                height: box.depth + box.height,
                                fill: "none",
                                stroke: "red",
                            });
                        }
                    }

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
    if (layer === "selection") {
        for (const selectionBox of selectionBoxes) {
            children.unshift({
                ...selectionBox,
                fill: "Highlight",
            });
        }
    }

    return {
        type: "group",
        orientation: "horizontal",
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
                            id: node.id,
                            x: pen.x + node.shift,
                            y: pen.y - height,
                            width: width,
                            height: depth + height,
                            fill: "none",
                            stroke: "red",
                        });
                    }

                    if (layer === "hitboxes") {
                        // TODO: do a second pass on the hitboxes to expand them
                        // to their full height
                        children.push({
                            type: "rect",
                            id: node.id,
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
                    if (layer === "content") {
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

                    if (layer === "content") {
                        children.push(child);
                    }

                    if (layer === "debug") {
                        children.push({
                            type: "rect",
                            id: node.id,
                            x: pen.x,
                            y: pen.y,
                            width: width,
                            height: depth + height,
                        });
                    }

                    if (layer === "hitboxes") {
                        // TODO: do a second pass on the hitboxes to expand them
                        // to their full height
                        children.push({
                            type: "rect",
                            id: node.id,
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
        orientation: "vertical",
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
    layer: "content" | "selection" | "debug" | "hitboxes";
};

const _processBox = (box: Layout.Box, loc: Point, context: Context): Group => {
    switch (box.kind) {
        case "hbox":
            return processHBox(box, loc, context);
        case "vbox":
            return processVBox(box, loc, context);
    }
};

export type Scene = {
    width: number;
    height: number;
    // group these into .layers?
    content: Group;
    selection: Group;
    hitboxes: Group;
    debug: Group;
};

export const processBox = (
    box: Layout.Box,
    fontData: FontData,
    options: Options = {},
): Scene => {
    const loc = {x: 0, y: Layout.getHeight(box)};
    const context: Context = {
        showCursor: !!options.showCursor,
        inSelection: false,
        fontData: fontData,
        layer: "content",
    };
    const contentLayer = _processBox(box, loc, context);

    const {fontSize} = box;
    const height = Math.max(contentLayer.height, fontSize);

    const {font} = fontData;
    const parenMetrics = font.getGlyphMetrics(font.getGlyphID(")"));
    // This assumes that parenMetrics.height < font.head.unitsPerEm
    const overshoot = (font.head.unitsPerEm - parenMetrics.height) / 2;
    const ascent =
        ((parenMetrics.bearingY + overshoot) * fontSize) / font.head.unitsPerEm;

    contentLayer.y = Math.max(contentLayer.y, ascent);
    contentLayer.height = height;

    context.layer = "selection";
    const selectionLayer = _processBox(box, loc, context);

    context.layer = "debug";
    const debugLayer = _processBox(box, loc, context);

    context.layer = "hitboxes";
    const hitboxes = _processBox(box, loc, context);

    const scene: Scene = {
        width: contentLayer.width,
        height: contentLayer.height,
        content: contentLayer,
        selection: selectionLayer,
        debug: debugLayer,
        hitboxes: hitboxes,
    };

    return scene;
};

type Side = "left" | "right";

const isPointInRect = (point: Point, bounds: Rect): Side | undefined => {
    if (
        point.x > bounds.x &&
        point.x < bounds.x + bounds.width / 2 &&
        point.y > bounds.y &&
        point.y < bounds.y + bounds.height
    ) {
        return "left";
    }
    if (
        point.x > bounds.x + bounds.width / 2 &&
        point.x < bounds.x + bounds.width &&
        point.y > bounds.y &&
        point.y < bounds.y + bounds.height
    ) {
        return "right";
    }
    return undefined;
};

type Intersection =
    | {type: "content"; id: number; side: Side}
    | {type: "padding"; flag: "start" | "end"};

export const findIntersections = (
    point: Point,
    node: Node, // must be the group containing the debug bounding rectangles
    translation: Point = {x: 0, y: 0},
): Intersection[] => {
    const result: Intersection[] = [];

    if (node.type === "rect") {
        const translatedRect = {
            ...node,
            x: node.x + translation.x,
            y: node.y + translation.y,
        };

        const side = isPointInRect(point, translatedRect);
        if (side) {
            if (node.id) {
                result.push({
                    type: "content",
                    id: node.id,
                    side: side,
                });
            } else if (node.flag) {
                result.push({
                    type: "padding",
                    flag: node.flag,
                });
            }
        }
    }

    if (node.type === "group") {
        const newTranslation = {
            x: translation.x + node.x,
            y: translation.y + node.y,
        };
        for (const child of node.children) {
            result.push(...findIntersections(point, child, newTranslation));
        }
    }

    return result;
};
