import {UnreachableCaseError} from "@math-blocks/core";

import * as Layout from "./layout";

import type {FontData} from "@math-blocks/opentype";

type Style = {
    fill?: string;
    stroke?: string;
};

type Common = {
    id?: number;
    style: Style;
};

export type Group = {
    type: "group";
    // pen position of the group within its parent
    x: number;
    y: number;
    // `bounds` includes height and depth which is even information to compute
    // the bounding box of the group in `findIntersections`.
    bounds: Layout.Dim;
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
        style: {
            stroke: hrule.style.color,
        },
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
        style: {
            fill: glyph.style.color,
        },
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

    const debugStyle = {
        fill: "none",
        stroke: "red",
    };

    // Each cancel region has its own ID. This allows us to have two cancel
    // regions side-by-side without them being merged into one.
    type CancelRegion = {
        id: number;
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
    };

    let cancelRegion: CancelRegion | null = null;

    box.content.forEach((section, index) => {
        const isSelection = hasSelection && index === 1;

        // There should only be two sections max.  If there are two sections
        // then we should draw a cursor in between the two of them.
        if (
            index === 1 &&
            !hasSelection &&
            !context.inSelection &&
            context.showCursor &&
            layer === "selection"
        ) {
            // Draw the cursor.
            children.push({
                type: "rect",
                x: pen.x - CURSOR_WIDTH / 2,
                y: pen.y - ascent,
                width: CURSOR_WIDTH,
                height: fontSize,
                style: {},
            });
        }

        section.forEach((node) => {
            // We've encountered a new cancel id or no cancel id.  Finalize the
            // current cancel region and reset for the next one.
            if (
                cancelRegion &&
                cancelRegion.id !== node.style.cancel &&
                layer === "content"
            ) {
                children.push({
                    type: "line",
                    x1: cancelRegion.xMin,
                    y1: cancelRegion.yMax,
                    x2: cancelRegion.xMax,
                    y2: cancelRegion.yMin,
                    thickness: 5,
                    style: {},
                });
                cancelRegion = null;
            }
            // If the node has a cancel id, continue the current cancel region
            // or start a new one if there isn't one.
            if (typeof node.style.cancel === "number" && layer == "content") {
                const yMin = -Math.max(Layout.getHeight(node), ascent);
                const height = Math.max(
                    Layout.getHeight(node) + Layout.getDepth(node),
                    fontSize,
                );
                const yMax = yMin + height;

                if (!cancelRegion) {
                    cancelRegion = {
                        id: node.style.cancel,
                        xMin: pen.x,
                        xMax: pen.x,
                        yMin,
                        yMax,
                    };
                } else {
                    cancelRegion.yMin = Math.min(cancelRegion.yMin, yMin);
                    cancelRegion.yMax = Math.max(cancelRegion.yMax, yMax);
                }
            }

            if (isSelection && layer === "selection") {
                const yMin = -Math.max(Layout.getHeight(node), ascent);

                const height = Math.max(
                    Layout.getHeight(node) + Layout.getDepth(node),
                    fontSize,
                );

                // Draw the cursor.
                selectionBoxes.push({
                    type: "rect",
                    x: pen.x,
                    y: yMin,
                    width: Layout.getWidth(node),
                    height: height,
                    style: {},
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
                            style: debugStyle,
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
                            style: debugStyle,
                        });
                    }

                    if (layer === "hitboxes") {
                        // TODO: do a second pass on the hitboxes to expand them
                        // to their full height
                        children.push({
                            type: "rect",
                            id: node.id,
                            x: pen.x,
                            y: pen.y - height,
                            width: advance,
                            height: depth + height,
                            style: debugStyle,
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
                                style: debugStyle,
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

            if (node.style.cancel && cancelRegion) {
                cancelRegion.xMax = pen.x;
            }
        });
    });

    if (cancelRegion !== null && layer === "content") {
        const thickness =
            (fontSize * font.math.constants.fractionRuleThickness.value) /
            font.head.unitsPerEm;
        children.push({
            type: "line",
            // @ts-expect-error: TypeScript doesn't understand forEach loops
            x1: cancelRegion.xMin,
            // @ts-expect-error: TypeScript doesn't understand forEach loops
            y1: cancelRegion.yMax,
            // @ts-expect-error: TypeScript doesn't understand forEach loops
            x2: cancelRegion.xMax,
            // @ts-expect-error: TypeScript doesn't understand forEach loops
            y2: cancelRegion.yMin,
            thickness: thickness,
            style: {},
        });
        cancelRegion = null;
    }

    // Draw the selection.
    if (layer === "selection") {
        for (const selectionBox of selectionBoxes) {
            children.unshift({
                ...selectionBox,
                fill: "Highlight",
                stroke: "none",
            });
        }
    }

    return {
        type: "group",
        x: loc.x,
        y: loc.y,
        bounds: box,
        children: children,
        style:
            layer === "content"
                ? {
                      fill: box.style.color,
                      stroke: box.style.color,
                  }
                : {},
        id: box.id,
    };
};

const processVBox = (box: Layout.Box, loc: Point, context: Context): Group => {
    const pen = {x: 0, y: 0};

    pen.y -= box.height;

    const children: Node[] = [];
    const {layer} = context;

    const debugStyle = {
        fill: "none",
        stroke: "red",
    };

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
                            style: debugStyle,
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
                            style: debugStyle,
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
                            style: debugStyle,
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
        bounds: box,
        children: children,
        style:
            layer === "content"
                ? {
                      fill: box.style.color,
                      stroke: box.style.color,
                  }
                : {},
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
    // When computing "hitboxes", only Groups and Rect and returned.  Groups
    // remain unchanged from other layers, but Rects and the bounding boxes of
    // Glyphs and horizontal Kerns.
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

    context.layer = "selection";
    const selectionLayer = _processBox(box, loc, context);

    context.layer = "debug";
    const debugLayer = _processBox(box, loc, context);

    context.layer = "hitboxes";
    const hitboxes = _processBox(box, loc, context);

    const scene: Scene = {
        width: contentLayer.bounds.width,
        height: contentLayer.bounds.height + contentLayer.bounds.depth,
        content: contentLayer,
        selection: selectionLayer,
        debug: debugLayer,
        hitboxes: hitboxes,
    };

    return scene;
};

type Side = "left" | "right";

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const isPointInBounds = (point: Point, bounds: Bounds): Side | undefined => {
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

const getBounds = (child: Group | Rect, translation: Point): Bounds => {
    return child.type === "group"
        ? {
              x: child.x + translation.x,
              y: child.y + translation.y - child.bounds.height,
              width: child.bounds.width,
              height: child.bounds.height + child.bounds.depth,
          }
        : {
              x: child.x + translation.x,
              y: child.y + translation.y,
              width: child.width,
              height: child.height,
          };
};

type Intersection =
    | {type: "content"; id: number; side: Side}
    | {type: "padding"; flag: "start" | "end"};

const getIntersection = (
    child: Group | Rect,
    side: Side,
): Intersection | void => {
    if (child.id) {
        return {
            type: "content",
            id: child.id,
            side: side,
        };
    } else if (child.type === "rect" && child.flag) {
        return {
            type: "padding",
            flag: child.flag,
        };
    }
};

export const findIntersections = (
    point: Point,
    node: Group, // must be the group containing the debug bounding rectangles
    translation?: Point,
): Intersection[] => {
    const result: Intersection[] = [];

    translation = translation || {
        x: node.x,
        y: node.y,
    };

    for (const child of node.children) {
        if (child.type !== "group" && child.type !== "rect") {
            throw new Error("Unexpected node type in hitboxes");
        }

        const bounds = getBounds(child, translation);
        const side = isPointInBounds(point, bounds);

        if (side) {
            const intersection = getIntersection(child, side);
            if (intersection) {
                result.push(intersection);
            }

            if (child.type === "group") {
                const newTranslation = {
                    x: child.x + translation.x,
                    y: child.y + translation.y,
                };

                result.push(...findIntersections(point, child, newTranslation));
            }
        }
    }

    if (result.length === 0) {
        // iterate through all of the children again and find any bounds that
        // intersect with the vertical line crossing with `point` on it

        const candidateIntersections: (Group | Rect)[] = [];

        for (const child of node.children) {
            if (child.type !== "group" && child.type !== "rect") {
                throw new Error("Unexpected node type in hitboxes");
            }

            const bounds = getBounds(child, translation);

            // We decide which side of the child to put the cursor on once we
            // decide on which candidate is the closest vertically to the point.
            if (point.x > bounds.x && point.x < bounds.x + bounds.width) {
                candidateIntersections.push(child);
            }
        }

        // If there are no candidates don't bother finding the closest one.
        if (candidateIntersections.length === 0) {
            return result;
        }

        const [int, ...rest] = candidateIntersections;

        // The closest candidate is the one with the smallest vertical distance
        // from the point.
        let bounds = getBounds(int, translation);
        let minDist = Math.min(
            Math.abs(bounds.y - point.y),
            Math.abs(bounds.y + bounds.height - point.y),
        );
        let closest = int;

        for (const candidate of rest) {
            bounds = getBounds(candidate, translation);
            const dist = Math.min(
                Math.abs(bounds.y - point.y),
                Math.abs(bounds.y + bounds.height - point.y),
            );
            if (dist < minDist) {
                minDist = dist;
                closest = candidate;
            }
        }

        // Determine whether the cursor should be to the left or the right of
        // the closest node.
        bounds = getBounds(closest, translation);
        const side: Side =
            point.x < bounds.x + bounds.width / 2 ? "left" : "right";

        if (side) {
            const intersection = getIntersection(closest, side);
            if (intersection) {
                result.push(intersection);
            }

            if (closest.type === "group") {
                const newTranslation = {
                    x: closest.x + translation.x,
                    y: closest.y + translation.y,
                };

                result.push(
                    ...findIntersections(point, closest, newTranslation),
                );
            }
        }
    }

    return result;
};
