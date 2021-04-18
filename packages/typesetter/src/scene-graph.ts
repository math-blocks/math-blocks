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
    layers: readonly Node[][];
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

// TODO: replace with font.hhea.ascender
const ASCENDER = 850;
const CURSOR_WIDTH = 2;

const processHBox = (
    box: Layout.Box,
    loc: Point,
    fontData: FontData,
    options: Options,
): Group => {
    const pen = {x: 0, y: 0};

    const selectionBoxes: Rect[] = [];
    const editorLayer: Node[] = [];
    const nonEditorLayer: Node[] = [];
    const belowLayer: Node[] = [];
    const aboveLayer: Node[] = [];

    const hasSelection =
        !options.inSelection &&
        box.content.length === 3 &&
        box.content[1].length > 0;

    const {font} = fontData;
    const {fontSize} = box;
    const ascent = (fontSize * ASCENDER) / font.head.unitsPerEm;

    box.content.forEach((section, index) => {
        const isSelection = hasSelection && index === 1;

        // There should only be two sections max.  If there are two sections
        // then we should draw a cursor in between the two of them.
        if (
            index === 1 &&
            !hasSelection &&
            !options.inSelection &&
            options.showCursor
        ) {
            // Draw the cursor.
            belowLayer.push({
                type: "rect",
                x: pen.x - CURSOR_WIDTH / 2,
                y: pen.y - ascent,
                width: CURSOR_WIDTH,
                height: fontSize,
            });
        }

        section.forEach((node) => {
            // We use the `id` property as an indicator that this layout
            // node was directly derived from an editor node.
            const layer =
                typeof node.id === "number" ? editorLayer : nonEditorLayer;

            if (isSelection) {
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

            switch (node.type) {
                case "Box":
                    layer.push(
                        _processBox(
                            node,
                            {x: pen.x, y: pen.y + node.shift},
                            fontData,
                            {
                                ...options,
                                inSelection:
                                    options.inSelection || hasSelection,
                            },
                        ),
                    );
                    break;
                case "HRule":
                    layer.push(processHRule(node, pen));
                    break;
                case "Glyph":
                    layer.push(processGlyph(node, pen));
                    break;
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
    for (const selectionBox of selectionBoxes) {
        belowLayer.unshift({
            ...selectionBox,
            fill: "rgba(0,144,255,0.5)",
        });
    }

    return {
        type: "group",
        x: loc.x,
        y: loc.y,
        width: Layout.getWidth(box),
        height: Layout.vsize(box),
        layers: [belowLayer, editorLayer, nonEditorLayer, aboveLayer],
        color: box.color,
        id: box.id,
    };
};

const processVBox = (
    box: Layout.Box,
    loc: Point,
    fontData: FontData,
    options: Options,
): Group => {
    const pen = {x: 0, y: 0};

    pen.y -= box.height;

    const editorLayer: Node[] = [];
    const nonEditorLayer: Node[] = [];

    box.content.forEach((section) => {
        section.forEach((node) => {
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
                        _processBox(
                            node,
                            {x: pen.x + node.shift, y: pen.y},
                            fontData,
                            options,
                        ),
                    );
                    pen.y += Layout.getDepth({...node, shift: 0});
                    break;
                case "HRule":
                    pen.y += height;
                    layer.push(processHRule(node, pen));
                    pen.y += depth;
                    break;
                case "Glyph":
                    pen.y += height;
                    layer.push(processGlyph(node, pen));
                    pen.y += depth;
                    break;
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
        layers: [editorLayer, nonEditorLayer],
        color: box.color,
        id: box.id,
    };
};

type Options = {
    showCursor?: boolean;
    inSelection?: boolean;
};

const _processBox = (
    box: Layout.Box,
    loc: Point,
    fontData: FontData,
    options: Options,
): Group => {
    switch (box.kind) {
        case "hbox":
            return processHBox(box, loc, fontData, options);
        case "vbox":
            return processVBox(box, loc, fontData, options);
    }
};

export const processBox = (
    box: Layout.Box,
    fontData: FontData,
    options: Options = {},
): Group => {
    const loc = {x: 0, y: Layout.getHeight(box)};
    const scene = _processBox(box, loc, fontData, options);

    const {fontSize} = box;
    const height = Math.max(scene.height, fontSize);

    const {font} = fontData;
    const ascent = (fontSize * ASCENDER) / font.head.unitsPerEm;
    scene.y = Math.max(scene.y, ascent);
    scene.height = height;

    return scene;
};
