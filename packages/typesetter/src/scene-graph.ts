import {UnreachableCaseError} from "@math-blocks/core";

import * as Layout from "./layout";

export type Group = {
    type: "group";
    // position relative the parent group
    x: number;
    y: number;
    width: number;
    height: number;
    layers: Node[][];
};

export type Glyph = {
    type: "glyph";
    x: number;
    y: number;
    width: number;
    glyph: Layout.Glyph;
};

export type Line = {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};

export type Rect = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
};

export type Kern = {
    type: "kern";
    x: number;
    width: number;
};

const unionRect = (rects: Rect[]): Rect => {
    let xMin = Infinity;
    let yMin = Infinity;
    let xMax = -Infinity;
    let yMax = -Infinity;

    rects.forEach((rect) => {
        if (rect.x < xMin) {
            xMin = rect.x;
        }
        if (rect.y < yMin) {
            yMin = rect.y;
        }
        if (rect.x + rect.width > xMax) {
            xMax = rect.x + rect.width;
        }
        if (rect.y + rect.height > yMax) {
            yMax = rect.y + rect.height;
        }
    });

    return {
        type: "rect",
        x: xMin,
        y: yMin,
        width: xMax - xMin,
        height: yMax - yMin,
    };
};

type Point = {
    x: number;
    y: number;
};

export type Node = Group | Glyph | Line | Rect | Kern;

const renderHRule = (hrule: Layout.HRule, loc: Point): Node => {
    const advance = Layout.getWidth(hrule);
    return {
        type: "line",
        x1: loc.x,
        y1: loc.y,
        x2: loc.x + advance,
        y2: loc.y,
    };
};

const renderKern = (kern: Layout.Kern, loc: Point): Node => {
    return {
        type: "kern",
        x: loc.x,
        width: kern.size,
    };
};

const renderGlyph = (glyph: Layout.Glyph, loc: Point): Node => {
    return {
        type: "glyph",
        x: loc.x,
        y: loc.y,
        width: Layout.getWidth(glyph),
        glyph: glyph,
    };
};

const left = (node: Node): number => {
    switch (node.type) {
        case "line":
            return Math.min(node.x1, node.x2);
        default:
            return node.x;
    }
};

const right = (node: Node): number => {
    switch (node.type) {
        case "line":
            return Math.max(node.x1, node.x2);
        default:
            return node.x + node.width;
    }
};

type LayoutCursor = {
    parent: number;
    prev: number;
    next: number;
    selection: boolean;
};

const renderHBox = ({
    box,
    cursor,
    cancelRegions,
    loc,
}: {
    box: Layout.Box;
    cursor?: LayoutCursor;
    cancelRegions?: LayoutCursor[];
    loc: Point;
}): Group => {
    const pen = {x: 0, y: 0};
    const {multiplier} = box;

    const cursorInBox = cursor && cursor.parent === box.id;
    const selectionBoxes: Rect[] = [];

    let cursorPos: {startX: number; endX: number; y: number} | null = null;

    const currentCancelRegions = (cancelRegions || []).filter(
        (region) => region.parent === box.id,
    );

    // set up arrays to track state of each cancel region being processed
    const cancelBoxes: Rect[][] = currentCancelRegions.map(() => []);

    const editorLayer: Node[] = [];
    const nonEditorLayer: Node[] = [];

    box.content.forEach((node) => {
        // We use the `id` property as an indicator that this layout
        // node was directly derived from an editor node.
        const layer =
            typeof node.id === "number" ? editorLayer : nonEditorLayer;

        currentCancelRegions.forEach((region, regionIndex) => {
            if (
                layer === editorLayer &&
                region.prev < editorLayer.length &&
                region.next > editorLayer.length
            ) {
                const yMin = -Math.max(
                    Layout.getHeight(node),
                    64 * 0.85 * multiplier,
                );

                const height = Math.max(
                    Layout.getHeight(node) + Layout.getDepth(node),
                    64 * multiplier,
                );

                // TODO: union cancel boxes as we go instead of doing it later
                // this will allow us to avoid having an array of an array.
                cancelBoxes[regionIndex].push({
                    type: "rect",
                    x: pen.x,
                    y: yMin,
                    width: Layout.getWidth(node),
                    height: height,
                });
            }
        });

        // cursor is at the start of the box
        if (cursor && cursorInBox && cursor.selection) {
            if (
                layer === editorLayer &&
                cursor.prev < editorLayer.length &&
                cursor.next > editorLayer.length
            ) {
                // pen.y = 0 places the pen on the baseline so in order
                // for the selection box to appear at the right place we
                // need go up using the standard y-down is positive.
                // How can we include diagrams in code?
                const yMin = -Math.max(
                    Layout.getHeight(node),
                    64 * 0.85 * multiplier,
                );

                const height = Math.max(
                    Layout.getHeight(node) + Layout.getDepth(node),
                    64 * multiplier,
                );

                selectionBoxes.push({
                    type: "rect",
                    x: pen.x,
                    y: yMin,
                    width: Layout.getWidth(node),
                    height: height,
                });
            }
        }

        const advance = Layout.getWidth(node);

        switch (node.type) {
            case "Box":
                layer.push(
                    render({
                        box: node,
                        cursor,
                        cancelRegions,
                        loc: {x: pen.x, y: pen.y + node.shift},
                    }),
                );
                break;
            case "HRule":
                layer.push(renderHRule(node, pen));
                break;
            case "Glyph":
                layer.push(renderGlyph(node, pen));
                break;
            case "Kern":
                layer.push(renderKern(node, pen));
                break;
            default:
                throw new UnreachableCaseError(node);
        }

        pen.x += advance;
    });

    const belowLayer: Node[] = [];
    const aboveLayer: Node[] = [];

    if (cursor && cursorInBox && !cursor.selection) {
        editorLayer.forEach((node, index) => {
            if (index === cursor.next) {
                cursorPos = {
                    startX: left(node) - 1,
                    endX: left(node) - 1,
                    y: -64 * 0.85 * multiplier,
                };
            } else if (index === cursor.prev) {
                cursorPos = {
                    startX: right(node) - 1,
                    endX: right(node) - 1,
                    y: -64 * 0.85 * multiplier,
                };
            }
        });

        // The cursor is in an empty box.
        if (box.content.length === 0 && cursor && cursor.parent === box.id) {
            cursorPos = {
                startX: pen.x - 1 + box.width / 2,
                endX: pen.x - 1 + box.width / 2,
                y: -64 * 0.85 * multiplier,
            };
        }

        // Draw the cursor.
        if (cursorPos) {
            belowLayer.push({
                type: "rect",
                x: cursorPos.startX,
                y: cursorPos.y,
                width: 2,
                height: 64 * multiplier,
            });
        }
    }

    // Draw the selection.
    for (const selectionBox of selectionBoxes) {
        belowLayer.unshift({
            ...selectionBox,
            fill: "rgba(0,64,255,0.3)",
        });
    }

    for (const boxes of cancelBoxes) {
        const box = unionRect(boxes);
        aboveLayer.push({
            type: "line",
            x1: box.x + box.width,
            y1: box.y,
            x2: box.x,
            y2: box.y + box.height,
        });
    }

    return {
        type: "group",
        x: loc.x,
        y: loc.y,
        width: Layout.getWidth(box),
        height: Layout.vsize(box),
        layers: [belowLayer, editorLayer, nonEditorLayer, aboveLayer],
    };
};

const renderVBox = ({
    box,
    cursor,
    cancelRegions,
    loc,
}: {
    box: Layout.Box;
    cursor?: LayoutCursor;
    cancelRegions?: LayoutCursor[];
    loc: Point;
}): Group => {
    const pen = {x: 0, y: 0};

    pen.y -= box.height;

    const editorLayer: Node[] = [];
    const nonEditorLayer: Node[] = [];

    box.content.forEach((node) => {
        const height = Layout.getHeight(node);
        const depth = Layout.getDepth(node);

        // We use the `id` property as an indicator that this layout
        // node was directly derived from an editor node.
        const layer =
            typeof node.id === "number" ? editorLayer : nonEditorLayer;

        switch (node.type) {
            case "Box":
                // TODO: reconsider whether we should be taking the shift into
                // account when computing the height, maybe we can drop this
                // and simplify things.  The reason why we zero out the shift
                // here is that when we render a box inside of a vbox, the shift
                // is a horizontal shift as opposed to a vertical one.
                // I'm not sure we can do this properly since how the shift is
                // used depends on the parent box type.  We could pass that info
                // to the getHeight() function... we should probably do an audit
                // of all the callsites for getHeight()
                pen.y += Layout.getHeight({...node, shift: 0});
                // TODO: see if we can get rid of this check in the future
                if (Number.isNaN(pen.y)) {
                    // eslint-disable-next-line no-debugger
                    debugger;
                }
                layer.push(
                    render({
                        box: node,
                        cursor,
                        cancelRegions,
                        loc: {x: pen.x + node.shift, y: pen.y},
                    }),
                );
                pen.y += Layout.getDepth({...node, shift: 0});
                break;
            case "HRule":
                pen.y += height;
                layer.push(renderHRule(node, pen));
                pen.y += depth;
                break;
            case "Glyph":
                pen.y += height;
                layer.push(renderGlyph(node, pen));
                pen.y += depth;
                break;
            case "Kern":
                pen.y += node.size;
                break;
            default:
                throw new UnreachableCaseError(node);
        }
    });

    return {
        type: "group",
        x: loc.x,
        y: loc.y,
        width: Layout.getWidth(box),
        height: Layout.vsize(box),
        layers: [editorLayer, nonEditorLayer],
    };
};

export const render = ({
    box,
    cursor,
    cancelRegions,
    loc,
}: {
    box: Layout.Box;
    cursor?: LayoutCursor;
    cancelRegions?: LayoutCursor[];
    loc?: Point;
}): Group => {
    // If we weren't passed a location then this is the top-level call, in which
    // case we set the location based on box being passed in.  Setting loc.y to
    // the height of the box shifts the box into view.
    if (!loc) {
        loc = {x: 0, y: Layout.getHeight(box)};
    }

    switch (box.kind) {
        case "hbox":
            return renderHBox({box, cursor, cancelRegions, loc});
        case "vbox":
            return renderVBox({box, cursor, cancelRegions, loc});
    }
};
