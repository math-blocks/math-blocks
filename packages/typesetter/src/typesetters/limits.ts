import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from '../layout';
import { MathStyle } from '../enums';
import { typesetSubsup } from './subsup';

import type { Path } from '@math-blocks/editor';
import type { Context, HBox, VBox, Node } from '../types';

const childContextForLimits = (context: Context): Context => {
  const { mathStyle } = context;

  const childMathStyle = {
    [MathStyle.Display]: MathStyle.Script,
    [MathStyle.Text]: MathStyle.Script,
    [MathStyle.Script]: MathStyle.ScriptScript,
    [MathStyle.ScriptScript]: MathStyle.ScriptScript,
  }[mathStyle];

  const childContext: Context = {
    ...context,
    mathStyle: childMathStyle,
    cramped: true,
  };

  return childContext;
};

// TODO: render as a subsup if context.mathStyle isn't MathStyle.Display
export const typesetLimits = (
  typesetChild: (index: number, context: Context) => HBox | null,
  node: Editor.types.CharLimits | Editor.ZLimits,
  path: Path,
  context: Context,
  typesetNode: (
    node: Editor.types.CharNode,
    path: Path,
    context: Context,
  ) => Node,
): VBox | HBox => {
  if (context.mathStyle !== MathStyle.Display && node.type === 'limits') {
    const subsup: Editor.types.CharSubSup = {
      type: Editor.NodeType.SubSup,
      children: node.children,
      id: node.id,
      style: node.style,
    };

    const inner = typesetNode(node.inner, path, {
      ...context,
      operator: true,
    });
    const output = [inner, typesetSubsup(typesetChild, subsup, context, inner)];

    return Layout.makeStaticHBox(output, context) as Mutable<HBox>;
  }

  const childContext = childContextForLimits(context);
  const lowerBox = typesetChild(0, childContext) as Mutable<HBox> | null;
  const upperBox = typesetChild(1, childContext) as Mutable<HBox> | null;

  if (!lowerBox) {
    throw new Error('Lower limit should always be defined');
  }

  // TODO: Use subsup for integrals directly.
  let inner: Mutable<Node>;
  if (
    node.type === 'limits' &&
    node.inner.type === 'char' &&
    node.inner.value === '\u222B'
  ) {
    const { font } = context.fontData;

    const char = node.inner.value;
    let glyphID = font.getGlyphID(char);
    const construction = font.math.variants.getVertGlyphConstruction(glyphID);
    if (construction) {
      glyphID = construction.mathGlyphVariantRecords[1].variantGlyph;
    }

    inner = Layout.makeGlyph(char, glyphID, context, true);

    const subsup: Editor.types.CharSubSup = {
      type: Editor.NodeType.SubSup,
      children: node.children,
      id: node.id,
      style: node.style,
    };

    const output = [inner, typesetSubsup(typesetChild, subsup, context, inner)];

    return Layout.makeStaticHBox(output, context) as Mutable<HBox>;
  } else {
    // TODO: figure out what the path should be for `inner`
    inner = typesetNode(node.inner, path, {
      ...context,
      operator: true,
    });
  }

  inner.id = node.inner.id;
  inner.style = {
    ...inner.style,
    color: node.inner.style.color,
  };

  const innerWidth = Layout.getWidth(inner);
  const width = Math.max(innerWidth, lowerBox.width || 0, upperBox?.width || 0);

  const newInner =
    innerWidth < width
      ? (Layout.makeStaticHBox(
          [
            Layout.makeKern((width - innerWidth) / 2),
            inner,
            Layout.makeKern((width - innerWidth) / 2),
          ],
          context,
        ) as Mutable<HBox>)
      : inner;
  if (lowerBox.width < width) {
    lowerBox.shift = (width - lowerBox.width) / 2;
  }
  if (upperBox && upperBox.width < width) {
    upperBox.shift = (width - upperBox.width) / 2;
  }

  const limits = Layout.makeVBox(
    width,
    newInner,
    upperBox ? [Layout.makeKern(6), upperBox] : [],
    [Layout.makeKern(4), lowerBox],
    context,
  ) as Mutable<VBox>;

  limits.id = node.id;
  limits.style = node.style;

  return limits;
};
