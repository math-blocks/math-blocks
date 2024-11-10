import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from '../layout';
import { MathStyle } from '../enums';

import type { Context, Dist, HBox, VBox, Node } from '../types';

const makeList = (size: Dist, box: HBox): readonly Node[] => [
  Layout.makeKern(size),
  box,
];

const childContextForFrac = (context: Context): Context => {
  const { mathStyle } = context;

  const childMathStyle = {
    [MathStyle.Display]: MathStyle.Text,
    [MathStyle.Text]: MathStyle.Script,
    [MathStyle.Script]: MathStyle.ScriptScript,
    [MathStyle.ScriptScript]: MathStyle.ScriptScript,
  }[mathStyle];

  const childContext: Context = {
    ...context,
    mathStyle: childMathStyle,
  };

  return childContext;
};

export const typesetFrac = (
  typesetChild: (index: number, context: Context) => HBox | null,
  node: Editor.types.CharFrac,
  context: Context,
): VBox => {
  const childContext = childContextForFrac(context);
  let numBox = typesetChild(0, childContext);
  let denBox = typesetChild(1, childContext);

  if (!numBox || !denBox) {
    throw new Error('The numerator and denominator must both be defined');
  }

  const { mathStyle } = context;
  const { constants } = context.fontData.font.math;

  const fontSize = Layout.fontSizeForContext(context);
  const thickness = fontSize * constants.fractionRuleThickness;
  const shift = fontSize * constants.axisHeight;

  // If useDisplayStyle is false then we need to reduce the font size of
  // numerators and denominators
  const useDisplayStyle = mathStyle === MathStyle.Display;

  const minDenGap = useDisplayStyle
    ? fontSize * constants.fractionDenomDisplayStyleGapMin
    : fontSize * constants.fractionDenominatorGapMin;

  const minNumGap = useDisplayStyle
    ? fontSize * constants.fractionNumDisplayStyleGapMin
    : fontSize * constants.fractionNumeratorGapMin;

  const multiplier = Layout.multiplierForContext(context);
  const endPadding = thickness; // add extra space around the numerator and denominator
  const width =
    Math.max(
      Math.max(Layout.getWidth(numBox), Layout.getWidth(denBox)),
      fontSize * multiplier * 0.5, // empty numerator/denominator width
    ) +
    2 * endPadding;

  // center the numerator
  if (Layout.getWidth(numBox) < width) {
    const kernSize = (width - Layout.getWidth(numBox)) / 2;
    numBox = Layout.rebox(
      numBox,
      Layout.makeKern(kernSize, 'start'),
      Layout.makeKern(kernSize, 'end'),
    );
  }

  // center the denominator
  if (Layout.getWidth(denBox) < width) {
    const kernSize = (width - Layout.getWidth(denBox)) / 2;
    denBox = Layout.rebox(
      denBox,
      Layout.makeKern(kernSize, 'start'),
      Layout.makeKern(kernSize, 'end'),
    );
  }

  const upList = makeList(minNumGap, numBox);
  const dnList = makeList(minDenGap, denBox);
  const stroke = Layout.makeStaticHBox(
    [Layout.makeHRule(thickness, width)],
    context,
  );

  const fracBox = Layout.makeVBox(
    width,
    stroke,
    upList,
    dnList,
    context,
  ) as Mutable<VBox>;
  fracBox.shift = -shift;

  fracBox.id = node.id;
  fracBox.style = node.style;

  return fracBox;
};
