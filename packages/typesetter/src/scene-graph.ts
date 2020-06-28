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
    loc,
}: {
    box: Layout.Box;
    cursor?: LayoutCursor;
    loc: Point;
}): Group => {
    const children: Node[] = [];
    const pen = {x: 0, y: 0};
    const {multiplier} = box;

    const cursorInBox = cursor && cursor.parent === box.id;
    let cursorPos: {startX: number; endX: number; y: number} | null = null;

    box.content.forEach((node, index) => {
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
        }

        const advance = Layout.getWidth(node);

        switch (node.type) {
            case "Box":
                children.push(
                    render({
                        box: node,
                        cursor,
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

    if (cursorPos) {
        children.push({
            type: "rect",
            x: cursorPos.startX,
            y: cursorPos.y,
            width: 2,
            height: 64 * multiplier,
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
    loc,
}: {
    box: Layout.Box;
    cursor?: LayoutCursor;
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
    loc,
}: {
    box: Layout.Box;
    cursor?: LayoutCursor;
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
            return renderHBox({box, cursor, loc});
        case "vbox":
            return renderVBox({box, cursor, loc});
    }
};
