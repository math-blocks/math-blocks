import {UnreachableCaseError} from "@math-blocks/core";

import * as Layout from "./layout";

export type Group = {
    type: "group";
    // position relative the parent group
    x: number;
    y: number;
    width: number;
    height: number;
    children: Node[];
};

export type Glyph = {
    type: "glyph";
    x: number;
    y: number;
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

export type Node = Group | Glyph | Line | Rect;

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

const renderGlyph = (glyph: Layout.Glyph, loc: Point): Node => {
    return {
        type: "glyph",
        x: loc.x,
        y: loc.y,
        glyph: glyph,
    };
};

type LayoutCursor = {
    parent: number;
    prev: number | null;
    next: number | null;
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
    const children: Node[] = [];
    const pen = {x: 0, y: 0};
    const {multiplier} = box;

    const cursorInBox = cursor && cursor.parent === box.id;
    const selection = cursor && cursor.selection;
    const selectionBoxes: Rect[] = [];

    let insideSelection = false;
    let cursorPos: {startX: number; endX: number; y: number} | null = null;

    const currentCancelRegions = (cancelRegions || []).filter(
        (region) => region.parent === box.id,
    );
    // set up arrays to track state of each cancel region being processed
    const insideCancel: boolean[] = [];
    const cancelBoxes: Rect[][] = currentCancelRegions.map(() => []);

    box.content.forEach((node, index) => {
        currentCancelRegions.forEach((region, regionIndex) => {
            if (region.next === node.id) {
                insideCancel[regionIndex] = false;
            }

            if (region.prev == null && index === 0) {
                insideCancel[regionIndex] = true;
            }

            if (insideCancel[regionIndex]) {
                const yMin = -Math.max(
                    Layout.getHeight(node),
                    64 * 0.85 * multiplier,
                );

                const height = Math.max(
                    Layout.getHeight(node) + Layout.getDepth(node),
                    64 * multiplier,
                );

                cancelBoxes[regionIndex].push({
                    type: "rect",
                    x: pen.x,
                    y: yMin,
                    width: Layout.getWidth(node),
                    height: height,
                });
            }

            if (region.prev === node.id) {
                insideCancel[regionIndex] = true;
            }
        });

        // cursor is at the start of the box
        if (cursor && cursorInBox) {
            if (
                cursor.prev === node.id ||
                (cursor.prev == null && index === 0)
            ) {
                cursorPos = {
                    startX: pen.x - 1,
                    endX: pen.x - 1,
                    y: -64 * 0.85 * multiplier,
                };
            }

            if (selection) {
                if (cursor.next === node.id) {
                    insideSelection = false;
                }

                // The cursor is at the start of the row.
                if (cursor.prev == null && index === 0) {
                    insideSelection = true;
                }

                if (insideSelection) {
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

                if (cursor.prev === node.id) {
                    insideSelection = true;
                }
            }
        }

        const advance = Layout.getWidth(node);

        switch (node.type) {
            case "Box":
                children.push(
                    render({
                        box: node,
                        cursor,
                        cancelRegions,
                        loc: {x: pen.x, y: pen.y + node.shift},
                    }),
                );
                break;
            case "HRule":
                children.push(renderHRule(node, pen));
                break;
            case "Glyph":
                children.push(renderGlyph(node, pen));
                break;
            case "Kern":
                break;
            default:
                throw new UnreachableCaseError(node);
        }

        pen.x += advance;

        // cursor is at the end of the box
        if (cursor && cursorInBox && cursor.prev === node.id) {
            cursorPos = {
                startX: pen.x - 1,
                endX: pen.x - 1,
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
    if (cursorPos && selectionBoxes.length === 0) {
        children.push({
            type: "rect",
            x: cursorPos.startX,
            y: cursorPos.y,
            width: 2,
            height: 64 * multiplier,
        });
    }

    // Draw the selection.
    for (const selectionBox of selectionBoxes) {
        children.unshift({
            ...selectionBox,
            fill: "rgba(0,64,255,0.3)",
        });
    }

    for (const boxes of cancelBoxes) {
        const box = unionRect(boxes);
        children.push({
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
        children: children,
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
    const children: Node[] = [];
    const pen = {x: 0, y: 0};

    pen.y -= box.height;

    box.content.forEach((node) => {
        const height = Layout.getHeight(node);
        const depth = Layout.getDepth(node);

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
                children.push(
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
                children.push(renderHRule(node, pen));
                pen.y += depth;
                break;
            case "Glyph":
                pen.y += height;
                children.push(renderGlyph(node, pen));
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
        children: children,
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
