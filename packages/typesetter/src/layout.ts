import { UnreachableCaseError } from '@math-blocks/core';

import { MathStyle } from './enums';
import type {
  Context,
  Dim,
  Content,
  HBox,
  VBox,
  Kern,
  Dist,
  Glyph,
  Node,
  HRule,
} from './types';

const makeHBox = (dim: Dim, content: Content, context: Context): HBox => {
  return {
    type: 'HBox',
    ...dim,
    shift: 0,
    content,
    fontSize: fontSizeForContext(context),
    style: {},
  };
};

export const rebox = (box: HBox, before: Kern, after: Kern): HBox => {
  if (box.content.type === 'static') {
    return {
      ...box,
      width: before.size + box.width + after.size,
      content: {
        ...box.content,
        nodes: [before, ...box.content.nodes, after],
      },
    };
  } else {
    return {
      ...box,
      width: before.size + box.width + after.size,
      content: {
        ...box.content,
        left: [before, ...box.content.left],
        right: [...box.content.right, after],
      },
    };
  }
};

export const makeKern = (size: Dist, flag?: 'start' | 'end'): Kern => ({
  type: 'Kern',
  size,
  flag,
  style: {},
});

export const makeHRule = (thickness: number, width: number): HRule => ({
  type: 'HRule',
  thickness,
  width,
  style: {},
});

export const makeGlyph = (
  char: string,
  glyphID: number,
  context: Context,
  isDelimiter = false,
): Glyph => {
  return {
    type: 'Glyph',
    char,
    glyphID,
    size: fontSizeForContext(context),
    fontData: context.fontData,
    style: {},
    isDelimiter,
  };
};

export const getCharAdvance = (glyph: Glyph): number => {
  const { font } = glyph.fontData;
  const metrics = font.getGlyphMetrics(glyph.glyphID);
  const unitsPerEm = font.head.unitsPerEm;
  if (!metrics) {
    throw new Error(`metrics do not exist for "${glyph.char}"`);
  }
  return (metrics.advance * glyph.size) / unitsPerEm;
};

export const getCharBearingX = (glyph: Glyph): number => {
  const { font } = glyph.fontData;
  const metrics = font.getGlyphMetrics(glyph.glyphID);
  const unitsPerEm = font.head.unitsPerEm;
  if (!metrics) {
    throw new Error(`metrics do not exist for "${glyph.char}"`);
  }
  return (metrics.bearingX * glyph.size) / unitsPerEm;
};

export const getCharWidth = (glyph: Glyph): number => {
  const { font } = glyph.fontData;
  const metrics = font.getGlyphMetrics(glyph.glyphID);
  const unitsPerEm = font.head.unitsPerEm;
  if (!metrics) {
    throw new Error(`metrics do not exist for "${glyph.char}"`);
  }
  return (metrics.width * glyph.size) / unitsPerEm;
};

export const getCharHeight = (glyph: Glyph): number => {
  const { font } = glyph.fontData;
  const metrics = font.getGlyphMetrics(glyph.glyphID);
  const unitsPerEm = font.head.unitsPerEm;
  if (!metrics) {
    throw new Error(`metrics do not exist for "${glyph.char}"`);
  }
  return (metrics.bearingY * glyph.size) / unitsPerEm;
};

export const getCharDepth = (glyph: Glyph): number => {
  const { font } = glyph.fontData;
  const metrics = font.getGlyphMetrics(glyph.glyphID);
  const unitsPerEm = font.head.unitsPerEm;
  if (!metrics) {
    throw new Error(`metrics do not exist for "${glyph.char}"`);
  }
  return ((metrics.height - metrics.bearingY) * glyph.size) / unitsPerEm;
};

export const getWidth = (node: Node): number => {
  switch (node.type) {
    case 'HBox':
      return node.width;
    case 'VBox':
      return node.width;
    case 'Glyph':
      return getCharAdvance(node);
    case 'Kern':
      return node.size;
    case 'HRule':
      return node.width;
    default:
      throw new UnreachableCaseError(node);
  }
};

export const getHeight = (node: Node): number => {
  switch (node.type) {
    case 'HBox':
      return node.height - node.shift;
    case 'VBox':
      return node.height - node.shift;
    case 'Glyph':
      return getCharHeight(node);
    case 'Kern':
      return 0;
    case 'HRule':
      return node.thickness / 2;
    default:
      throw new UnreachableCaseError(node);
  }
};

export const getDepth = (node: Node): number => {
  switch (node.type) {
    case 'HBox':
      return node.depth + node.shift;
    case 'VBox':
      return node.depth + node.shift;
    case 'Glyph':
      return getCharDepth(node);
    case 'Kern':
      return 0;
    case 'HRule':
      return node.thickness / 2;
    default:
      throw new UnreachableCaseError(node);
  }
};

export const vsize = (node: Node): number => {
  switch (node.type) {
    case 'HBox':
      return node.height + node.depth;
    case 'VBox':
      return node.height + node.depth;
    case 'Glyph':
      return getCharHeight(node) + getCharDepth(node);
    case 'Kern':
      return node.size;
    case 'HRule':
      return node.thickness;
    default:
      throw new UnreachableCaseError(node);
  }
};

const add = (a: number, b: number): number => a + b;
const zero = 0;
const sum = (values: readonly number[]): number => values.reduce(add, zero);
const max = (values: readonly number[]): number => Math.max(...values);

export const hlistWidth = (nodes: readonly Node[]): number =>
  sum(nodes.map(getWidth));
const hlistHeight = (nodes: readonly Node[]): number =>
  max(nodes.map(getHeight));
const hlistDepth = (nodes: readonly Node[]): number => max(nodes.map(getDepth));
const vlistVsize = (nodes: readonly Node[]): number => sum(nodes.map(vsize));

export const makeStaticHBox = (
  nodes: readonly Node[],
  context: Context,
): HBox => {
  const dim = {
    width: hlistWidth(nodes),
    height: hlistHeight(nodes),
    depth: hlistDepth(nodes),
  };
  const content: Content = {
    type: 'static',
    nodes,
  };
  return makeHBox(dim, content, context);
};

export const makeCursorHBox = (
  left: readonly Node[],
  right: readonly Node[],
  context: Context,
): HBox => {
  const dim = {
    width: hlistWidth(left) + hlistWidth(right),
    height: Math.max(hlistHeight(left), hlistHeight(right)),
    depth: Math.max(hlistDepth(left), hlistDepth(right)),
  };
  const content: Content = {
    type: 'cursor',
    left,
    right,
  };
  return makeHBox(dim, content, context);
};

export const makeSelectionHBox = (
  left: readonly Node[],
  selection: readonly Node[],
  right: readonly Node[],
  context: Context,
): HBox => {
  const dim = {
    width: hlistWidth(left) + hlistWidth(selection) + hlistWidth(right),
    height: Math.max(
      hlistHeight(left),
      hlistHeight(selection),
      hlistHeight(right),
    ),
    depth: Math.max(hlistDepth(left), hlistDepth(selection), hlistDepth(right)),
  };
  const content: Content = {
    type: 'selection',
    left,
    selection,
    right,
  };
  return makeHBox(dim, content, context);
};

export const makeVBox = (
  width: Dist,
  node: Node,
  upList: readonly Node[],
  dnList: readonly Node[],
  context: Context,
): VBox => {
  const dim = {
    width,
    depth:
      dnList.length > 0 ? vlistVsize(dnList) + getDepth(node) : getDepth(node),
    height:
      upList.length > 0
        ? vlistVsize(upList) + getHeight(node)
        : getHeight(node),
  };
  const upListCopy = [...upList];
  // TODO: get rid of the need to reverse the uplist
  const nodeList = [...upListCopy.reverse(), node, ...dnList];

  return {
    type: 'VBox',
    ...dim,
    shift: 0,
    content: nodeList,
    fontSize: fontSizeForContext(context),
    style: {},
  };
};

export const getConstantValue = (
  constant: number,
  context: Context,
): number => {
  return constant * fontSizeForContext(context);
};

// TODO: return the font size instead of the multiplier
export const multiplierForContext = (context: Context): number => {
  const { constants } = context.fontData.font.math;
  const { mathStyle } = context;

  switch (mathStyle) {
    case MathStyle.Display:
    case MathStyle.Text:
      return 1.0;
    case MathStyle.Script:
      return constants.scriptPercentScaleDown / 100;
    case MathStyle.ScriptScript:
      return constants.scriptScriptPercentScaleDown / 100;
  }
};

export const fontSizeForContext = (context: Context): number => {
  const multiplier = multiplierForContext(context);
  const { baseFontSize } = context;
  const fontSize = multiplier * baseFontSize;
  return fontSize;
};

type ThresholdOptions = {
  readonly value: 'both' | 'sum';
  readonly strict: boolean;
};

// TODO: special case how we compute the delimiters for rows including "y" or
// other deep descenders so that we get the same font size as the rest of the
// glyphs on that row.
const getDelimiter = (
  char: string,
  box: HBox | VBox,
  thresholdOptions: ThresholdOptions,
  context: Context,
): number => {
  const { font } = context.fontData;

  const glyphID = font.getGlyphID(char);
  const construction = font.math.variants.getVertGlyphConstruction(glyphID);

  if (!construction) {
    return glyphID;
  }

  const fontSize = fontSizeForContext(context);

  for (let i = 0; i < construction.mathGlyphVariantRecords.length; i++) {
    const record = construction.mathGlyphVariantRecords[i];

    const glyphMetrics = font.getGlyphMetrics(record.variantGlyph);
    const height = (glyphMetrics.bearingY * fontSize) / font.head.unitsPerEm;
    const depth =
      ((glyphMetrics.height - glyphMetrics.bearingY) * fontSize) /
      font.head.unitsPerEm;

    const compare = thresholdOptions.strict
      ? (a: number, b: number) => a > b
      : (a: number, b: number) => a >= b;

    // TODO: add an option to configure whether these inequalities are
    // strict or not.
    switch (thresholdOptions.value) {
      case 'both': {
        if (compare(height, box.height) && compare(depth, box.depth)) {
          // HACK: this is to ensure that we're using the same size
          // glyph as the row when it contains deep descenders like "y"
          if (i === 1 && char !== '\u221a') {
            return glyphID;
          }
          return record.variantGlyph;
        }
        break;
      }
      case 'sum': {
        if (compare(height + depth, box.height + box.depth)) {
          // HACK: this is to ensure that we're using the same size
          // glyph as the row when it contains deep descenders like "y"
          if (i === 1 && char !== '\u221a') {
            return glyphID;
          }
          return record.variantGlyph;
        }
        break;
      }
    }
  }

  if (construction.mathGlyphVariantRecords.length > 0) {
    // TODO: return a glyph assembly layout instead of the tallest delim
    return construction.mathGlyphVariantRecords[
      construction.mathGlyphVariantRecords.length - 1
    ].variantGlyph;
  }

  return glyphID;
};

/**
 * Returns the smallest delimiter whose depth and height exceed the that of the
 * box passed in.  `thresholdOptions` controls how this comparison is made.
 *
 * @param {string} char
 * @param {Box} box layout encompassed by the delimiter
 * @param {ThresholdOptions} options
 * @param {Context} context
 * @returns {Glyph}
 */
export const makeDelimiter = (
  char: string,
  box: HBox | VBox,
  thresholdOptions: ThresholdOptions,
  context: Context,
): Glyph => {
  const glyphID = getDelimiter(char, box, thresholdOptions, context);

  return makeGlyph(char, glyphID, context, true);
};
