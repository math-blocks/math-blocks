import {FontMetrics} from "./metrics";
import {UnreachableCaseError} from "./util";

type Dist = number;

type Dim = {
  width: Dist,
  depth: Dist,
  height: Dist,
};

type BoxKind = "hbox" | "vbox";

export type Box = {
  type: "Box",
  id?: number,
  kind: BoxKind,
  shift: Dist,
  content: LayoutNode[],
} & Dim;

export type Glue = {
  type: "Glue",
  id?: number,
  size: Dist,
  stretch: Dist,
  shrink: Dist,
};

export type Glyph = {
  type: "Glyph",
  id?: number,
  char: string,
  size: number,
  metrics: FontMetrics,
};

export type Kern = {
  type: "Kern",
  id?: number,
  size: Dist,
};

export type Rule = {
  type: "Rule",
  id?: number,
} & Dim;

export type LayoutNode =
  | Box
  | Glyph
  | Glue
  | Kern
  | Rule;

export const makeBox = (kind: BoxKind, dim: Dim, content: LayoutNode[]): Box => ({
  type: "Box",
  kind,
  ...dim,
  shift: 0,
  content,
});

export const makeKern = (size: Dist): Kern => ({
  type: "Kern",
  size,
});

export const makeRule = (dim: Dim): Rule => ({
  type: "Rule",
  ...dim,
});

export const makeGlyph = (fontMetrics: FontMetrics) => (fontSize: number) => (char: string): Glyph => {
  return {
    type: "Glyph",
    char,
    size: fontSize,
    metrics: fontMetrics,
  }
};

export const getCharAdvance = (glyph: Glyph) => {
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

export const getCharWidth = (glyph: Glyph) => {
  const charCode = glyph.char.charCodeAt(0);
  const fontMetrics = glyph.metrics;
  const glyphMetrics = fontMetrics.glyphMetrics;
  const metrics = glyphMetrics[charCode];
  if (!metrics) {
    throw new Error(`metrics do not exist for "${glyph.char}"`);
  }
  return metrics.width * glyph.size / fontMetrics.unitsPerEm;
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

export const getCharDepth = (glyph: Glyph) => {
  const charCode = glyph.char.charCodeAt(0);
  const fontMetrics = glyph.metrics;
  const glyphMetrics = fontMetrics.glyphMetrics;
  const metrics = glyphMetrics[charCode];
  if (!metrics) {
    throw new Error(`metrics do not exist for "${glyph.char}"`);
  }
  return (metrics.height - metrics.bearingY) * glyph.size / fontMetrics.unitsPerEm;
};

export const getWidth = (node: LayoutNode) => {
  switch (node.type) {
    case "Box": return node.width
    case "Glue": return node.size
    case "Glyph": return getCharAdvance(node)
    case "Kern": return node.size
    case "Rule": return node.width
    default: throw new UnreachableCaseError(node)
  }
}

export const getHeight = (node: LayoutNode) => {
  switch (node.type) {
    case "Box": return node.height - node.shift
    case "Glue": return 0
    case "Glyph": return getCharHeight(node)
    case "Kern": return 0
    case "Rule": return node.height
    default: throw new UnreachableCaseError(node)
  }
}

export const getDepth = (node: LayoutNode) => {
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
    case "Glyph": return getCharAdvance(node)
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

export const hlistWidth = (nodes: LayoutNode[]) => sum(nodes.map(getWidth));
const hlistHeight = (nodes: LayoutNode[]) => max(nodes.map(getHeight));
const hlistDepth = (nodes: LayoutNode[]) => max(nodes.map(getDepth))
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
    depth: vlistVsize(dnList) + getDepth(node),
    height: vlistVsize(upList) + getHeight(node),
  }
  const nodeList = [
    ...upList.reverse(),
    node,
    ...dnList,
  ]
  return makeBox("vbox", dim, nodeList)
}

const rebox = (newWidth: Dist, box: Box): Box => {
  let {kind, width, height, depth, content} = box;
  if (newWidth == width) {
    return box;
  } else if (content == []) {
    return hpackNat([makeKern(newWidth)])
  } else {
    const hl = kind === "hbox"
      ? content
      : [box]

    const glue: Glue = {
      type: "Glue",
      size: 0,
      stretch: 1,
      shrink: 1,
    }

    const result = makeBox("hbox", {width: newWidth, height, depth}, [glue, ...hl, glue])
    result.id = box.id;
    return result;
  }
}

const makeList = (size: Dist, box: Box): LayoutNode[] => [
  makeKern(size),
  {...box, shift: 0},
];

// TODO: compute width from numBox and denBox
export const makeFract = (thickness: Dist, numBox: Box, denBox: Box): Box => {
  const halfThickness = 0.5 * thickness

  const width = Math.max(getWidth(numBox), getWidth(denBox))
  const depth = halfThickness;
  const height = halfThickness;
  const stroke = makeRule({width, depth, height});

  const upList = makeList(2, rebox(width, numBox));
  const dnList = makeList(10, rebox(width, denBox));

  const fracBox = makeVBox(width, stroke, upList, dnList);
  // TODO: calculate this based on current font size
  fracBox.shift = -20;
  return fracBox;
};

export const makeSubSup = (multiplier: number, subBox?: Box, supBox?: Box): Box => {
  if (!supBox && !subBox) {
    throw new Error("at least one of supBox and subBox must be defined");
  }

  const width = Math.max(supBox ? getWidth(supBox) : 0, subBox ? getWidth(subBox) : 0);
  const upList = supBox ? makeList(10, supBox) : [];
  const dnList = subBox ? makeList(10, subBox) : [];
  // we can't have a non-zero kern b/c it has no height/depth
  const gap = makeKern(0);

  const subsupBox = makeVBox(width, gap, upList, dnList);
  // TODO: calculate this based on current font size
  subsupBox.shift = -20 * multiplier;
  return subsupBox;
};
