import { UnreachableCaseError } from '@math-blocks/core';
import type { Font, GlyphMetrics } from '@math-blocks/opentype';

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
  InterpolatedGlyph,
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

export const makeInterpolatedGlyph = (
  char: string,
  glyphID1: number,
  glyphID2: number,
  amount: number,
  context: Context,
  isDelimiter = false,
): InterpolatedGlyph => {
  return {
    type: 'InterpolatedGlyph',
    char,
    glyphID1,
    glyphID2,
    amount,
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

const lerp = (a: number, b: number, amount: number): number => {
  return amount * b + (1 - amount) * a;
};

export const getInterpolatedCharAdvance = (
  glyph: InterpolatedGlyph,
): number => {
  const { font } = glyph.fontData;
  const metrics1 = font.getGlyphMetrics(glyph.glyphID1);
  const metrics2 = font.getGlyphMetrics(glyph.glyphID2);
  const unitsPerEm = font.head.unitsPerEm;
  if (!metrics1) {
    throw new Error(`metrics do not exist for "${glyph.char}"`);
  }
  const interpolatedAdvance = lerp(
    metrics1.advance,
    metrics2.advance,
    glyph.amount,
  );
  return (interpolatedAdvance * glyph.size) / unitsPerEm;
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

export const getInterpolatedCharHeight = (glyph: InterpolatedGlyph): number => {
  const { font } = glyph.fontData;
  const metrics1 = font.getGlyphMetrics(glyph.glyphID1);
  const metrics2 = font.getGlyphMetrics(glyph.glyphID2);
  const unitsPerEm = font.head.unitsPerEm;
  if (!metrics1 || !metrics2) {
    throw new Error(`metrics do not exist for "${glyph.char}"`);
  }
  const interpolatedHeight = lerp(
    metrics1.bearingY,
    metrics2.bearingY,
    glyph.amount,
  );
  return (interpolatedHeight * glyph.size) / unitsPerEm;
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

export const getInterpolatedCharDepth = (glyph: InterpolatedGlyph): number => {
  const { font } = glyph.fontData;
  const metrics1 = font.getGlyphMetrics(glyph.glyphID1);
  const metrics2 = font.getGlyphMetrics(glyph.glyphID2);
  const unitsPerEm = font.head.unitsPerEm;
  if (!metrics1 || !metrics2) {
    throw new Error(`metrics do not exist for "${glyph.char}"`);
  }
  const interpolatedDepth = lerp(
    metrics1.height - metrics1.bearingY,
    metrics2.height - metrics2.bearingY,
    glyph.amount,
  );
  return (interpolatedDepth * glyph.size) / unitsPerEm;
};

export const getWidth = (node: Node): number => {
  switch (node.type) {
    case 'HBox':
      return node.width;
    case 'VBox':
      return node.width;
    case 'Glyph':
      return getCharAdvance(node);
    case 'InterpolatedGlyph':
      return getInterpolatedCharAdvance(node);
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
    case 'InterpolatedGlyph':
      return getInterpolatedCharHeight(node);
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
    case 'InterpolatedGlyph':
      return getInterpolatedCharDepth(node);
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
    case 'InterpolatedGlyph':
      return getInterpolatedCharHeight(node) + getInterpolatedCharDepth(node);
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
const getDelimiters = (char: string, context: Context): number[] => {
  const { font } = context.fontData;

  const glyphID = font.getGlyphID(char);
  const construction = font.math.variants.getVertGlyphConstruction(glyphID);

  if (!construction) {
    return [glyphID];
  }

  return construction.mathGlyphVariantRecords.map(
    (record) => record.variantGlyph,
  );
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
): Glyph | InterpolatedGlyph => {
  const glyphIDs = getDelimiters(char, context);

  if (glyphIDs.length === 1) {
    return makeGlyph(char, glyphIDs[0], context, true);
  }

  const { font } = context.fontData;
  const fontSize = fontSizeForContext(context);

  if (canInterpolate(context, glyphIDs[0], glyphIDs[glyphIDs.length - 1])) {
    const amount = computeAmount(
      context,
      thresholdOptions,
      glyphIDs[0],
      glyphIDs[glyphIDs.length - 1],
      box,
    );

    return makeInterpolatedGlyph(
      char,
      glyphIDs[0],
      glyphIDs[glyphIDs.length - 1],
      amount,
      context,
      true,
    );
  }

  for (let i = 0; i < glyphIDs.length; i++) {
    const glyphID = glyphIDs[i];
    const glyphMetrics = font.getGlyphMetrics(glyphID);
    const height = (glyphMetrics.bearingY * fontSize) / font.head.unitsPerEm;
    const depth =
      ((glyphMetrics.height - glyphMetrics.bearingY) * fontSize) /
      font.head.unitsPerEm;

    const compare = thresholdOptions.strict
      ? (a: number, b: number) => a > b
      : (a: number, b: number) => a >= b;

    const isBigger =
      thresholdOptions.value === 'sum'
        ? compare(height + depth, box.height + box.depth)
        : compare(height, box.height) && compare(depth, box.depth);

    if (isBigger) {
      if (i > 0 && canInterpolate(context, glyphIDs[i - 1], glyphID)) {
        const amount = computeAmount(
          context,
          thresholdOptions,
          glyphIDs[i - 1],
          glyphID,
          box,
        );
        return makeInterpolatedGlyph(
          char,
          glyphIDs[i - 1],
          glyphID,
          amount,
          context,
          true,
        );
      }

      return makeGlyph(char, glyphID, context, true);
    }
  }

  // TODO: return a glyph assembly layout instead of the tallest delim
  return makeGlyph(char, glyphIDs[glyphIDs.length - 1], context, true);
};

const getGlyphHeight = (
  glyphMetrics: GlyphMetrics,
  font: Font,
  fontSize: number,
): number => {
  return (glyphMetrics.bearingY * fontSize) / font.head.unitsPerEm;
};

const getGlyphDepth = (
  glyphMetrics: GlyphMetrics,
  font: Font,
  fontSize: number,
): number => {
  return (
    ((glyphMetrics.height - glyphMetrics.bearingY) * fontSize) /
    font.head.unitsPerEm
  );
};

const canInterpolate = (
  context: Context,
  glyphID1: number,
  glyphID2: number,
): boolean => {
  const { font } = context.fontData;

  const path1 = font.getGlyph(glyphID1).path;
  const path2 = font.getGlyph(glyphID2).path;

  if (path1.length !== path2.length) {
    return false;
  }

  return path1.every((cmd1, i) => {
    const cmd2 = path2[i];
    return cmd1.type === cmd2.type;
  });
};

const computeAmount = (
  context: Context,
  thresholdOptions: ThresholdOptions,
  glyphID1: number,
  glyphID2: number,
  box: HBox | VBox,
): number => {
  const { font } = context.fontData;
  const fontSize = fontSizeForContext(context);

  const firstGlyphMetrics = font.getGlyphMetrics(glyphID1);
  const lastGlyphMetrics = font.getGlyphMetrics(glyphID2);

  let amount: number;

  if (thresholdOptions.value === 'sum') {
    const minSum =
      getGlyphHeight(firstGlyphMetrics, font, fontSize) +
      getGlyphDepth(firstGlyphMetrics, font, fontSize);
    const maxSum =
      getGlyphHeight(lastGlyphMetrics, font, fontSize) +
      getGlyphDepth(lastGlyphMetrics, font, fontSize);

    const thickness = fontSize * font.math.constants.radicalRuleThickness;
    const gap = fontSize * font.math.constants.radicalVerticalGap;
    const sum = box.height + box.depth + gap + thickness;

    if (sum > maxSum) {
      amount = 1;
    } else if (sum < minSum) {
      amount = 0;
    } else {
      amount = (sum - minSum) / (maxSum - minSum);
    }
  } else {
    const minDepth = getGlyphDepth(firstGlyphMetrics, font, fontSize);
    const minHeight = getGlyphHeight(firstGlyphMetrics, font, fontSize);
    const maxDepth = getGlyphDepth(lastGlyphMetrics, font, fontSize);
    const maxHeight = getGlyphHeight(lastGlyphMetrics, font, fontSize);

    if (box.height < minHeight && box.depth < minDepth) {
      amount = 0;
    } else if (box.height > maxHeight || box.depth > maxDepth) {
      amount = 1;
    } else {
      amount = Math.max(
        (box.height - minHeight) / (maxHeight - minHeight),
        (box.depth - minDepth) / (maxDepth - minDepth),
      );
    }
  }

  return amount;
};
