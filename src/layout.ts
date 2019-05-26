import { FontMetrics } from "./metrics";
import { UnreachableCaseError } from "./util";

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

type Glue = {
  type: "Glue",
  id: number,
  size: Dist,
  stretch: Dist,
  shrink: Dist,
};

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
  size: Dist,
};

type Rule = {
  type: "Rule",
  id: number,
} & Dim;

export type LayoutNode =
  | Box
  | Glyph
  | Glue
  | Kern
  | Rule;

const makeBox = (kind: BoxKind, dim: Dim, content: LayoutNode[]): Box => ({
  type: "Box",
  id: -1, // TOOD: generate incrementing ids
  kind,
  ...dim,
  shift: 0,
  content,
});

const makeKern = (size: Dist): Kern => ({
  type: "Kern",
  id: -1,
  size,
});

const makeRule = (dim: Dim): Rule => ({
  type: "Rule",
  id: -1,
  ...dim,
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

export const getCharHeight = (glyph: Glyph) => {
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
    case "Box": return node.width
    case "Glue": return node.size
    case "Glyph": return getCharWidth(node)
    case "Kern": return node.size
    case "Rule": return node.width
    default: throw new UnreachableCaseError(node)
  }
}

const height = (node: LayoutNode) => {
  switch (node.type) {
    case "Box": return node.height - node.shift
    case "Glue": return 0
    case "Glyph": return getCharHeight(node)
    case "Kern": return 0
    case "Rule": return node.height
    default: throw new UnreachableCaseError(node)
  }
}

const depth = (node: LayoutNode) => {
  switch (node.type) {
    case "Box": return node.depth + node.shift
    case "Glue": return 0
    case "Glyph": return getCharDepth(node)
    case "Kern": return 0
    case "Rule": return node.depth
    default: throw new UnreachableCaseError(node)
  }
}

const vwidth = (node: LayoutNode) => {
  switch (node.type) {
    case "Box": return node.width + node.shift
    case "Glue": return 0
    case "Glyph": return getCharWidth(node)
    case "Kern": return 0
    case "Rule": return node.width
    default: throw new UnreachableCaseError(node)
  }
}

export const vsize = (node: LayoutNode) => {
  switch (node.type) {
    case "Box": return node.height + node.depth
    case "Glue": return node.size
    case "Glyph": return getCharHeight(node) + getCharDepth(node)
    case "Kern": return node.size
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

export const hpackNat = (nl: LayoutNode[]) => {
  const dim = {
    width: hlistWidth(nl),
    height: hlistHeight(nl),
    depth: hlistDepth(nl),
  }
  return makeBox("hbox", dim, nl)
}

const makeVBox = (width: Dist, node: LayoutNode, upList: LayoutNode[], dnList: LayoutNode[]) => {
  const dim = {
    width,
    depth: vlistVsize(dnList) + depth(node),
    height: vlistVsize(upList) + height(node),
  }
  const nodeList = [
    ...upList,
    node,
    ...dnList,
  ]
  return makeBox("vbox", dim, nodeList)
}

const rebox = (newWidth: Dist, box: Box): Box => {
  let { kind, width, height, depth, content } = box;
  if (newWidth == width) {
    return box;
  } else if (content == []) {
    return hpackNat([makeKern(newWidth)])
  } else {
    const hl = kind === "hbox"
      ? content
      : [{
        ...box,
        id: -1,
      }]

    const glue: Glue = {
      type: "Glue",
      id: -1,
      size: 0,
      stretch: 1,
      shrink: 1,
    }

    return makeBox("hbox", { width: newWidth, height, depth }, [glue, ...hl, glue])
  }
}

const makeList = (size: Dist, box: Box): LayoutNode[] => [
  makeKern(size),
  { ...box, shift: 0 },
];

// TODO: compute width from numBox and denBox
export const makeFract = (thickness: Dist, width: Dist, numBox: Box, denBox: Box): Box => {
  const halfThickness = 0.5 * thickness

  const depth = halfThickness;
  const height = halfThickness;
  const stroke = makeRule({ width, depth, height });

  const upList = makeList(10, rebox(width, numBox));
  const dnList = makeList(10, rebox(width, denBox));

  return makeVBox(width, stroke, upList, dnList);
};
