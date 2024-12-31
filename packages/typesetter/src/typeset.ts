import { UnreachableCaseError } from '@math-blocks/core';
import * as Editor from '@math-blocks/editor';
import type { Mutable } from 'utility-types';

import * as Layout from './layout';
import { processBox } from './scene-graph';
import { RenderMode } from './enums';

import { typesetDelimited } from './typesetters/delimited';
import { typesetMacro } from './typesetters/macro';
import { typesetFrac } from './typesetters/frac';
import { typesetLimits } from './typesetters/limits';
import { typesetRoot } from './typesetters/root';
import { typesetSubsup } from './typesetters/subsup';
import { typesetTable } from './typesetters/table';
import { typesetAtom } from './typesetters/atom';

import type { Path } from '@math-blocks/editor';
import type { Context, HBox, Dim, Node } from './types';
import type { Scene } from './scene-graph';
import { typesetAccent } from './typesetters/accent';

const { NodeType, SelectionUtils, PathUtils } = Editor;

const typesetRow = (
  row: Editor.types.CharRow,
  path: Path,
  context: Context,
  padFirstOperator?: boolean,
): HBox => {
  const output = typesetNodes(
    row.children,
    path,
    context,
    undefined,
    undefined,
    padFirstOperator,
  ) as Node[];

  // If there are no children, then we need to add a box with dimensions so that
  // the parent node can be typeset correctly.
  if (output.length === 0) {
    const box: Mutable<HBox> = Layout.makeStaticHBox([], context);
    ensureMinDepthAndHeight(box, context);
    const fontSize = Layout.fontSizeForContext(context);
    box.width = fontSize / 2; // hack
    output.push(box);
  }

  const { selection } = context;

  if (selection) {
    const {
      path: selectionPath,
      start,
      end,
    } = SelectionUtils.getPathAndRange(selection);

    if (PathUtils.equals(path, selectionPath)) {
      const left = output.slice(0, start);
      const middle = output.slice(start, end);
      const right = output.slice(end);

      const box = (
        SelectionUtils.isCollapsed(selection)
          ? Layout.makeCursorHBox(left, right, context)
          : Layout.makeSelectionHBox(left, middle, right, context)
      ) as Mutable<HBox>;

      box.id = row.id;
      box.style = {
        ...box.style,
        color: row.style.color,
      };

      if (context.renderMode === RenderMode.Dynamic) {
        ensureMinDepthAndHeight(box, context);
      }

      return box;
    }
  }

  const box = Layout.makeStaticHBox(output, context) as Mutable<HBox>;
  box.id = row.id;
  box.style = {
    ...box.style,
    color: row.style.color,
  };

  if (context.renderMode === RenderMode.Dynamic) {
    ensureMinDepthAndHeight(box, context);
  }

  return box;
};

/**
 * This function is used to guarantee a certain depth/height for a box that is
 * equal to the depth/height of the cursor or selection rectangle.  This is
 * useful for typesetting while editing since it minimize changes to vertical
 * size of the rendered math.
 *
 * WARNING: This function mutates `box`.
 *
 * TODO: add originalDepth and originalHeight so that getDelimiter can make its
 * decisions based on the original dimensions of the box.
 *
 * @param {Mutable<Dim>} dim
 * @param {Context} context
 * @return {void}
 */
const ensureMinDepthAndHeight = (dim: Mutable<Dim>, context: Context): void => {
  const {
    fontData: { font },
  } = context;
  const fontSize = Layout.fontSizeForContext(context);
  const parenMetrics = font.getGlyphMetrics(font.getGlyphID(')'));

  // This assumes that parenMetrics.height < font.head.unitsPerEm
  const overshoot = (font.head.unitsPerEm - parenMetrics.height) / 2;

  const depth =
    ((parenMetrics.height - parenMetrics.bearingY + overshoot) * fontSize) /
    font.head.unitsPerEm;
  dim.depth = Math.max(dim.depth, depth);

  const height =
    ((parenMetrics.bearingY + overshoot) * fontSize) / font.head.unitsPerEm;
  dim.height = Math.max(dim.height, height);
};

const getTypesetChildFromNodes = <
  T extends readonly (Editor.types.CharRow | null)[],
>(
  children: T,
  path: Path,
): ((index: number, context: Context) => HBox | null) => {
  return (
    index: number,
    context: Context,
    padFirstOperator?: boolean,
  ): HBox | null => {
    const child = children[index];
    console.log('child =', child);
    return (
      child && typesetRow(child, [...path, index], context, padFirstOperator)
    );
  };
};

const typesetNode = (
  node: Editor.types.CharNode,
  path: Path,
  context: Context,
  prevEditNode?: Editor.types.CharNode,
  prevLayoutNode?: Node,
  padFirstOperator?: boolean,
): Node => {
  switch (node.type) {
    case NodeType.Row: {
      // The only time this can happen is if limits.inner is a row
      return typesetRow(node, path, context);
    }
    case NodeType.Frac: {
      const typesetChild = getTypesetChildFromNodes(node.children, path);
      return typesetFrac(typesetChild, node, context);
    }
    case NodeType.SubSup: {
      return typesetSubsup(
        getTypesetChildFromNodes(node.children, path),
        node,
        context,
        prevLayoutNode,
      );
    }
    case NodeType.Root: {
      const typesetChild = getTypesetChildFromNodes(node.children, path);
      return typesetRoot(typesetChild, node, context);
    }
    case NodeType.Limits: {
      const typesetChild = getTypesetChildFromNodes(node.children, path);
      return typesetLimits(typesetChild, node, path, context, typesetNode);
    }
    case NodeType.Delimited: {
      const typesetChild = getTypesetChildFromNodes(node.children, path);
      return typesetDelimited(typesetChild, node, context);
    }
    case NodeType.Accent: {
      const typesetChild = getTypesetChildFromNodes(node.children, path);
      return typesetAccent(typesetChild, node, context);
    }
    case NodeType.Macro: {
      const typesetChild = getTypesetChildFromNodes(node.children, path);
      return typesetMacro(typesetChild, node, context);
    }
    case NodeType.Table: {
      const typesetChild = getTypesetChildFromNodes(node.children, path);
      return typesetTable(typesetChild, node, context);
    }
    case 'char': {
      return typesetAtom(node, context);
    }
    default:
      throw new UnreachableCaseError(node);
  }
};

const findSequencePositions = (
  operators: readonly string[],
  arr: readonly string[],
): { start: number; end: number }[] => {
  // Initialize the result array with empty arrays for each sequence
  const positions: { start: number; end: number }[] = [];

  // Loop over the array once
  for (let i = 0; i <= arr.length - 1; i++) {
    // For each sequence, check if it matches at this position
    for (let j = 0; j < operators.length; j++) {
      const sequence = operators[j];

      // Check if there are enough elements left in the array for this sequence
      if (i + sequence.length <= arr.length) {
        // Check if the sequence matches starting at index i
        if (
          arr
            .slice(i, i + sequence.length)
            .every((val, idx) => val === sequence.charAt(idx))
        ) {
          // Store both start and end positions for the found sequence
          positions.push({ start: i, end: i + sequence.length - 1 });
          i += sequence.length - 1; // account for i++ in the outer loop
        }
      }
    }
  }

  return positions;
};

const typesetNodes = (
  nodes: readonly Editor.types.CharNode[],
  path: Path,
  context: Context,
  prevChild?: Editor.types.CharNode,
  prevLayoutNode?: Node,
  padFirstOperator?: boolean,
): readonly Node[] => {
  const chars = nodes.map((node) => {
    return node.type === 'char' ? node.value : '';
  });
  const positions = findSequencePositions(context.operators, chars);

  return nodes.map((child, index) => {
    const isOperator = positions.some((pos) => {
      return pos.start <= index && pos.end >= index;
    });
    const isOperatorStart = positions.some((pos) => {
      return pos.start === index;
    });
    const isOperatorEnd = positions.some((pos) => {
      return pos.end === index;
    });

    const result = typesetNode(
      child,
      [...path, index],
      isOperator ? { ...context, operator: true } : context,
      prevChild,
      prevLayoutNode,
      index === 0 ? padFirstOperator : undefined,
    ) as Mutable<Node>;

    const glyph = result;
    const padOperator = index === 0 ? padFirstOperator : undefined;
    const nextChild = nodes[index + 1];

    if (child.type === 'char' && glyph.type === 'Glyph') {
      const fontSize = Layout.fontSizeForContext(context);
      const hbox: Node[] = [glyph];

      // TODO(kevinb): Base padding off of page 170 in the TeXbook.
      // thin space = 3/18 em
      // medium space = 4/18 em
      // thick space = 5/18 em
      if (isOperatorStart) {
        hbox.unshift(Layout.makeKern(fontSize / 6));
      }
      if (isOperatorEnd && nextChild?.type === 'char') {
        hbox.push(Layout.makeKern(fontSize / 6));
      }
      if (
        (padOperator && Editor.util.isOperator(child)) ||
        shouldHavePadding(prevChild, child, context)
      ) {
        hbox.unshift(Layout.makeKern(fontSize / 4));
        hbox.push(Layout.makeKern(fontSize / 4));
      }

      const result =
        hbox.length > 1
          ? (Layout.makeStaticHBox(hbox, context) as Mutable<HBox>)
          : glyph;

      if (result !== glyph) {
        result.id = glyph.id;
        delete glyph.id;
        // Move the style to the result so that cancel overlays are
        // continuous even when they include an operator with padding.
        result.style = glyph.style;
        glyph.style = {};
      }

      prevLayoutNode = result;
      prevChild = child;
      return result;
    }

    prevLayoutNode = result;
    prevChild = child;
    return result;
  });
};

const shouldHavePadding = (
  prevNode: Editor.types.CharNode | undefined,
  currentNode: Editor.types.CharAtom,
  context: Context,
): boolean => {
  const currentChar = currentNode.value;

  // We only add padding around operators, so if we get a non-operator char
  // we can return early.
  if (!Editor.util.isOperator(currentNode)) {
    return false;
  }

  // No operators get padding when `cramped` is true
  if (context.cramped) {
    return false;
  }

  // If the currentChar can be unary we check a number of situations where it
  // should be unary and don't give it any padding in those situations.
  if (canBeUnary(currentChar)) {
    if (
      !prevNode ||
      (prevNode.type === 'char' && Editor.util.isOperator(prevNode)) ||
      prevNode.type === 'limits'
    ) {
      return false;
    }
  }

  // All other operators should have padding around them.
  return true;
};

const canBeUnary = (char: string): boolean => {
  const unaryOperators = [
    '+',
    '\u2212', // \minus
    '\u00B1', // \pm
    '\u2213', // \mp
  ];

  return unaryOperators.includes(char);
};

export type Options = {
  readonly showCursor?: boolean;
};

export const typeset = (
  node: Editor.types.CharNode,
  context: Context,
  options: Options = {},
): Scene => {
  const path: Path = [];
  const box = typesetNode(node, path, context) as HBox;
  return processBox(box, context.fontData, options);
};
