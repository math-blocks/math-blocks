import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from '../layout';
import { MathStyle } from '../enums';

import type { Context, HBox, VBox } from '../types';

const DEFAULT_GUTTER_WIDTH = 50;

const isOperator = (cell: Editor.types.CharRow | null): boolean =>
  cell?.children.length === 1 &&
  Editor.util.isAtom(cell.children[0], ['+', '\u2212', '=', '<', '>']);

const childContextForTable = (context: Context): Context => {
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

export const typesetTable = (
  typesetChild: (
    index: number,
    context: Context,
    padFirstOperator?: boolean,
  ) => HBox | null,
  node: Editor.types.CharTable | Editor.ZTable,
  context: Context,
  zipper?: Editor.Zipper,
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

  const reboxColumn = (
    col: number,
    leftKernSize: number,
    rightKernSize: number,
  ): void => {
    for (let row = 0; row < node.rowCount; row++) {
      let cell = rows[row].children[col];
      cell = Layout.rebox(
        cell,
        Layout.makeKern(leftKernSize),
        Layout.makeKern(rightKernSize),
      );
      rows[row].children[col] = cell;
      columns[col].children[row] = cell;
      columns[col].width = Math.max(columns[col].width, cell.width);
    }
  };

  const gutterWidth: number =
    node.subtype === 'algebra' ? 0 : DEFAULT_GUTTER_WIDTH;

  const children =
    node.type === 'table'
      ? node.children
      : [
          ...node.left,
          // @ts-expect-error: zipper is always defined when
          // node is a ZTable
          Editor.zrowToRow(zipper.row),
          ...node.right,
        ];

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

      // We want to add padding around the first operator if it's the only
      // character in the cell.
      const child = children[j * node.colCount + i];
      const padFirstOperator =
        child?.children?.length === 1 &&
        child.children[0].type === 'char' &&
        ['+', '\u2212'].includes(child.children[0].value);

      let cell = typesetChild(
        j * node.colCount + i,
        childContext,
        padFirstOperator,
      );

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

  const cursorIndex =
    node.type === 'ztable'
      ? node.left.length
      : context.selection?.focus.path[1] ?? -1;

  if (node.subtype === 'algebra' && cursorIndex !== -1) {
    const col = cursorIndex % node.colCount;

    type Column = readonly Editor.types.CharRow[];
    const cellColumns: Column[] = [];
    for (let i = 0; i < node.colCount; i++) {
      const col: Editor.types.CharRow[] = [];
      for (let j = 0; j < node.rowCount; j++) {
        const index = j * node.colCount + i;
        // TODO: check that children[index] isn't null
        col.push(children[index] as Editor.types.CharRow);
      }
      cellColumns.push(col); // this is unsafe
    }

    if (cursorIndex !== -1) {
      if (col === 0 && !cellColumns[col + 1].some(isOperator)) {
        // Add right padding on every cell in the first column
        reboxColumn(col, 0, 16);
      } else if (
        col === node.colCount - 1 &&
        !cellColumns[col - 1].some(isOperator)
      ) {
        // Add left padding on every cell in the last column
        reboxColumn(col, 16, 0);
      } else if (
        col > 0 &&
        col < cellColumns.length - 1 &&
        Editor.isColumnEmpty(cellColumns[col])
      ) {
        // If the cursor is in an empty column, only add padding to one
        // side of the column if there's an operator in one of the
        // columns. The padding goes on the opposite side of the column
        // with the operator since operators have their own built-in
        // padding.
        if (
          cellColumns[col - 1].some(isOperator) &&
          !cellColumns[col + 1].some(isOperator)
        ) {
          reboxColumn(col, 0, 16);
        } else if (
          cellColumns[col + 1].some(isOperator) &&
          !cellColumns[col - 1].some(isOperator)
        ) {
          reboxColumn(col, 16, 0);
        }
      }
    }

    // If there are any columns with no operators on either side, add both
    // left and right padding regardless of whether the cursor is in the
    // column or not.
    for (let col = 0; col < node.colCount; col++) {
      if (
        col > 0 &&
        col < cellColumns.length - 1 &&
        Editor.isColumnEmpty(cellColumns[col]) &&
        !cellColumns[col - 1].some(isOperator) &&
        !cellColumns[col + 1].some(isOperator)
      ) {
        reboxColumn(col, 16, 16);
      }
    }
  }

  // Adjust the width of cells in the same column to be the same
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    for (let j = 0; j < col.children.length; j++) {
      // center the cell content
      const originalWidth = Layout.getWidth(col.children[j]);
      const baseKernSize = (col.width - originalWidth) / 2;
      let rightKernSize =
        i < columns.length - 1 ? baseKernSize + gutterWidth / 2 : baseKernSize;
      let leftKernSize = i > 0 ? baseKernSize + gutterWidth / 2 : baseKernSize;
      const child = children[j * node.colCount + i];
      // Right align any child that has content when showing work
      if (node.subtype === 'algebra' && child && child.children.length > 0) {
        leftKernSize = baseKernSize * 2;
        rightKernSize = 0;
      }
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
