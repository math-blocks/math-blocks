import {FontMetrics} from "./metrics";
import {UnreachableCaseError} from "./util";

type Dist = number;

type Dim = {
    width: Dist,
    depth: Dist,
    height: Dist,
};

type BoxKind = "hbox" | "vbox";

type Box = {
    type: "Box",
    id: number,
    kind: BoxKind,
    shift: Dist,
    content: LayoutNode[],
} & Dim;

type Glyph = {
    type: "Glyph",
    id: number,
    char: string,
    size: number,
    metrics: FontMetrics,
};

type Kern = {
    type: "Kern",
    id: number,
    dist: Dist,
};

type Rule = {
    type: "Rule",
    id: number,
} & Dim;

export type LayoutNode = 
    | Box 
    | Glyph 
    | Kern 
    | Rule;

let makebox = (kind: BoxKind, {height, depth, width}: Dim, content: LayoutNode[]): Box => ({
    type: "Box", 
    id: -1, // TOOD: generate incrementing ids
    kind,
    width,
    height,
    depth,
    shift: 0,
    content,
});

const getCharWidth = (glyph: Glyph) => {
    const charCode = glyph.char.charCodeAt(0);
    const fontMetrics = glyph.metrics;
    const glyphMetrics = fontMetrics.glyphMetrics;
    const metrics = glyphMetrics[charCode];
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return metrics.advance * glyph.size / fontMetrics.unitsPerEm;
};

export const getCharBearingX = (glyph: Glyph) => {
    const charCode = glyph.char.charCodeAt(0);
    const fontMetrics = glyph.metrics;
    const glyphMetrics = fontMetrics.glyphMetrics;
    const metrics = glyphMetrics[charCode];
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return metrics.bearingX * glyph.size / fontMetrics.unitsPerEm;
};

const getCharHeight = (glyph: Glyph) => {
    const charCode = glyph.char.charCodeAt(0);
    const fontMetrics = glyph.metrics;
    const glyphMetrics = fontMetrics.glyphMetrics;
    const metrics = glyphMetrics[charCode];
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return metrics.bearingY * glyph.size / fontMetrics.unitsPerEm;
};

const getCharDepth = (glyph: Glyph) => {
    const charCode = glyph.char.charCodeAt(0);
    const fontMetrics = glyph.metrics;
    const glyphMetrics = fontMetrics.glyphMetrics;
    const metrics = glyphMetrics[charCode];
    if (!metrics) {
        throw new Error(`metrics do not exist for "${glyph.char}"`);
    }
    return (metrics.height - metrics.bearingY) * glyph.size / fontMetrics.unitsPerEm;
};

export const width = (node: LayoutNode) => {
    switch (node.type) {
        case "Box": return node.width;
        case "Glyph": return getCharWidth(node);
        case "Kern": return node.dist;
        case "Rule": return node.width;
        default: throw new UnreachableCaseError(node);
    }
}

const height = (node: LayoutNode) => {
    switch (node.type) {
        case "Box": return node.height - node.shift
        case "Glyph": return getCharHeight(node)
        case "Kern": return 0
        case "Rule": return node.height
        default: throw new UnreachableCaseError(node)
    }
}

const depth = (node: LayoutNode) => {
    switch (node.type) {
        case "Box": return node.depth + node.shift
        case "Glyph": return getCharDepth(node)
        case "Kern": return 0
        case "Rule": return node.depth
        default: throw new UnreachableCaseError(node)
    }
}

const vwidth = (node: LayoutNode) => {
    switch (node.type) {
        case "Box": return node.width + node.shift
        case "Glyph": return getCharWidth(node)
        case "Kern": return 0
        case "Rule": return node.width
        default: throw new UnreachableCaseError(node)
    }
}

const vsize = (node: LayoutNode) => {
    switch (node.type) {
        case "Box": return node.height + node.depth
        case "Glyph": return getCharHeight(node) + getCharDepth(node)
        case "Kern": return node.dist
        case "Rule": return node.height + node.depth
        default: throw new UnreachableCaseError(node)
    }
}


const add = (a: number, b: number) => a + b;
const zero = 0;
const sum = (values: number[]) => values.reduce(add, zero);
const max = (values: number[]) => Math.max(...values);

const hlistWidth = (nodes: LayoutNode[]) => sum(nodes.map(width));
const hlistHeight = (nodes: LayoutNode[]) => max(nodes.map(height));
const hlistDepth = (nodes: LayoutNode[]) => max(nodes.map(depth))
const vlistWidth = (nodes: LayoutNode[]) => max(nodes.map(vwidth))
const vlistVsize = (nodes: LayoutNode[]) => sum(nodes.map(vsize))
  
export const hpackNat = (nl: LayoutNode[]) => 
    makebox(
        "hbox",
        {
            width: hlistWidth(nl),
            height: hlistHeight(nl),
            depth: hlistDepth(nl),
        },
        nl,
    );
