import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from '../layout';
import { MathStyle } from '../enums';

import type { Context, Node, HBox, VBox, Kern } from '../types';

const childContextForSubsup = (context: Context): Context => {
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

export const typesetSubsup = (
  typesetChild: (index: number, context: Context) => HBox | null,
  node: Editor.types.CharSubSup | Editor.ZSubSup,
  context: Context,
  prevEditNode?: Editor.types.CharNode | Editor.Focus,
  prevLayoutNode?: Node,
): VBox => {
  const childContext = childContextForSubsup(context);
  const subBox = typesetChild(0, childContext);
  const supBox = typesetChild(1, childContext);

  if (!supBox && !subBox) {
    throw new Error('at least one of supBox and subBox must be defined');
  }

  const { font } = context.fontData;

  const width = Math.max(
    supBox ? Layout.getWidth(supBox) : 0,
    subBox ? Layout.getWidth(subBox) : 0,
  );

  // Some atoms gets wrapped in a box to add padding to them so we need to
  // filter them out.  Anything else that's in a box is some sort of compound
  // layout structure (frac, delimited, etc.) and should have its subscript
  // and/or superscript positioned based on the size of the box.
  if (prevEditNode?.type !== 'char' && prevLayoutNode) {
    const superscriptBaselineDropMax = Layout.getConstantValue(
      font.math.constants.superscriptBaselineDropMax,
      context,
    );
    const subscriptBaselineDropMin = Layout.getConstantValue(
      font.math.constants.subscriptBaselineDropMin,
      context,
    );

    const upList = [];
    const dnList = [];

    if (supBox) {
      const shift = Layout.getHeight(prevLayoutNode);
      const kernShift = shift - superscriptBaselineDropMax;

      upList.push(Layout.makeKern(kernShift));
      upList.push(supBox);
    }

    if (subBox) {
      const shift = Layout.getDepth(prevLayoutNode);
      const kernSize = shift - subscriptBaselineDropMin;

      dnList.push(Layout.makeKern(kernSize));
      dnList.push(subBox);
    }

    const referenceNode = Layout.makeKern(0); // empty reference node
    const subsupBox = Layout.makeVBox(
      width,
      referenceNode,
      upList,
      dnList,
      context,
    ) as Mutable<VBox>;

    subsupBox.id = node.id;
    subsupBox.style = node.style;

    return subsupBox;
  }

  const upList = [];

  const fontSize = Layout.fontSizeForContext(context);
  const childFontSize = Layout.fontSizeForContext(childContext);
  const parenMetrics = font.getGlyphMetrics(font.getGlyphID(')'));
  const overshoot = (font.head.unitsPerEm - parenMetrics.height) / 2;

  if (supBox) {
    const xMetrics = font.getGlyphMetrics(font.getGlyphID('x'));
    const xHeight = (xMetrics.bearingY * fontSize) / font.head.unitsPerEm;

    const maxDepth =
      ((parenMetrics.height - parenMetrics.bearingY + overshoot) *
        childFontSize) /
      font.head.unitsPerEm;

    // Compute shift in baseline of superscript.
    // The baseline is at the same height as the xHeight of the parent.
    let kernSize = -supBox.depth + xHeight;
    if (supBox.depth > maxDepth) {
      // If the superscript's depth is greater that of a row without any non-atom
      // childre, then push the superscript up by whatever the difference is.
      kernSize += supBox.depth - maxDepth;
    }

    upList.push(Layout.makeKern(kernSize) as Mutable<Kern>);
    upList.push(supBox as Mutable<HBox>);
  }

  const dnList = [];

  if (subBox) {
    const xMetrics = font.getGlyphMetrics(font.getGlyphID('x'));
    const xHeight = (xMetrics.bearingY * childFontSize) / font.head.unitsPerEm;

    const maxHeight =
      ((parenMetrics.bearingY + overshoot) * childFontSize) /
      font.head.unitsPerEm;

    // Compute shift in baseline of subscript.
    // The x-height of the subscript is the same as baseline of the character to
    // the left of the subsup.
    let kernSize = -subBox.height + xHeight;
    if (subBox.height > maxHeight) {
      // If the subscript's height is greater that of a row without any non-atom
      // childre, then push the subscript down by whatever the difference is.
      kernSize += subBox.height - maxHeight;
    }

    dnList.push(Layout.makeKern(kernSize));
    dnList.push(subBox);
  }

  const referenceNode = Layout.makeKern(0); // empty reference node
  const subsupBox = Layout.makeVBox(
    width,
    referenceNode,
    upList,
    dnList,
    context,
  ) as Mutable<VBox>;

  subsupBox.id = node.id;
  subsupBox.style = node.style;

  return subsupBox;
};
