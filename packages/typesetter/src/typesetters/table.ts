import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from '../layout';
import { MathStyle } from '../enums';

import type { Context, HBox, VBox } from '../types';

const DEFAULT_GUTTER_WIDTH = 50;

const childContextForTable = (context: Context): Context => {
  const { mathStyle } = context;

  const childMathStyle =
    mathStyle === MathStyle.Display ? MathStyle.Text : context.mathStyle;

  const childContext: Context = {
    ...context,
    mathStyle: childMathStyle,
  };

  return childContext;
};

export const typesetTable = (
  typesetChild: (
    index: number,
    context: Context,
    padFirstOperator?: boolean,
  ) => HBox | null,
  node: Editor.types.CharTable,
  context: Context,
): HBox | VBox => {
  type Row = {
    children: Mutable<HBox>[];
    height: number;
    depth: number;
  };
  type Col = {
    children: Mutable<HBox>[];
    width: number;
  };

  const columns: Col[] = [];
  const rows: Row[] = [];
  const childContext = childContextForTable(context);
  const gutterWidth: number = DEFAULT_GUTTER_WIDTH;
  const children = node.children;

  const MIN_WIDTH = 0; // 32; // only use this for debugging purposes.

  // Group cells into rows and columns and determine the width of each
  // column and the depth/height of each row.
  for (let j = 0; j < node.rowCount; j++) {
    for (let i = 0; i < node.colCount; i++) {
      if (!columns[i]) {
        columns[i] = {
          children: [],
          width: MIN_WIDTH,
        };
      }
      if (!rows[j]) {
        rows[j] = {
          children: [],
          height: 0,
          depth: 0,
        };
      }

      const offset = j * node.colCount + i;
      // We want to add padding around the first operator if it's the only
      // character in the cell.
      const child = children[offset];
      const padFirstOperator =
        child?.children?.length === 1 &&
        child.children[0].type === 'char' &&
        ['+', '\u2212'].includes(child.children[0].value);

      let cell = typesetChild(offset, childContext, padFirstOperator);

      if (cell) {
        columns[i].width = Math.max(cell.width, columns[i].width);
        rows[j].height = Math.max(cell.height, rows[j].height);
        rows[j].depth = Math.max(cell.depth, rows[j].depth);
      } else {
        // Use an empty Layout.Box for children that were null
        cell = {
          type: 'HBox',
          shift: 0,
          content: {
            type: 'static',
            nodes: [],
          },
          // These values don't matter since the box is empty
          fontSize: 0,
          style: {},
          // These will get filled in later
          width: 0,
          height: 0,
          depth: 0,
        };
      }

      columns[i].children.push(cell);
      rows[j].children.push(cell);
    }
  }

  // Adjust the width of cells in the same column to be the same
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    for (let j = 0; j < col.children.length; j++) {
      // center the cell content
      const originalWidth = Layout.getWidth(col.children[j]);
      const baseKernSize = (col.width - originalWidth) / 2;
      const rightKernSize =
        i < columns.length - 1 ? baseKernSize + gutterWidth / 2 : baseKernSize;
      const leftKernSize =
        i > 0 ? baseKernSize + gutterWidth / 2 : baseKernSize;
      const cell = Layout.rebox(
        col.children[j],
        Layout.makeKern(leftKernSize, 'start'),
        Layout.makeKern(rightKernSize, 'end'),
      );
      col.children[j] = cell;
      // rows[] has its own references so we need to update it as well
      rows[j].children[i] = cell;
    }
  }

  // Adjust the height/depth of cells in the same row to be the same
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.children.length; j++) {
      row.children[j].height = row.height;
      row.children[j].depth = row.depth;
    }
  }

  const width =
    columns.reduce((sum, col) => sum + col.width, 0) +
    gutterWidth * (columns.length - 1);

  const { constants } = context.fontData.font.math;
  const fontSize = Layout.fontSizeForContext(context);

  const rowBoxes = rows.map((row, index) => {
    const result = Layout.makeStaticHBox(row.children, context);
    const style = node.rowStyles?.[index];
    if (style?.border === 'top') {
      const thickness = fontSize * constants.fractionRuleThickness;
      const stroke = Layout.makeStaticHBox(
        [Layout.makeHRule(thickness, width)],
        context,
      );

      const { mathStyle } = context;
      const useDisplayStyle = mathStyle === MathStyle.Display;

      const minDenGap = useDisplayStyle
        ? fontSize * constants.fractionDenomDisplayStyleGapMin
        : fontSize * constants.fractionDenominatorGapMin;

      const minNumGap = useDisplayStyle
        ? fontSize * constants.fractionNumDisplayStyleGapMin
        : fontSize * constants.fractionNumeratorGapMin;

      return Layout.makeVBox(
        width,
        stroke,
        [Layout.makeKern(minNumGap)],
        [Layout.makeKern(minDenGap), result],
        context,
      );
    }
    return result;
  });

  const inner = Layout.makeVBox(
    width,
    rowBoxes[0],
    [],
    rowBoxes.slice(1),
    context,
  ) as Mutable<VBox>;

  const shift = fontSize * constants.axisHeight;
  // Equalize the depth and height and then shift up so the center of the
  // table aligns with the central axis.
  const vsize = Layout.vsize(inner);
  inner.height = vsize / 2 + shift;
  inner.depth = vsize / 2 - shift;

  const thresholdOptions = {
    value: 'sum' as const,
    strict: true,
  };

  if (!node.delimiters) {
    inner.id = node.id;
    inner.style = node.style;

    return inner;
  }

  const open = Layout.makeDelimiter(
    node.delimiters.left.value,
    inner,
    thresholdOptions,
    context,
  );
  const close = Layout.makeDelimiter(
    node.delimiters.right.value,
    inner,
    thresholdOptions,
    context,
  );

  const table = Layout.makeStaticHBox(
    [open, inner, close],
    context,
  ) as Mutable<HBox>;

  table.id = node.id;
  table.style = node.style;

  return table;
};
