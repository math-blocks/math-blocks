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
import { maybeAddOperatorPadding } from './typesetters/atom';

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
      return maybeAddOperatorPadding(
        prevEditNode,
        node,
        context,
        padFirstOperator,
      );
    }
    default:
      throw new UnreachableCaseError(node);
  }
};

const typesetNodes = (
  nodes: readonly Editor.types.CharNode[],
  path: Path,
  context: Context,
  prevChild?: Editor.types.CharNode,
  prevLayoutNode?: Node,
  padFirstOperator?: boolean,
): readonly Node[] => {
  return nodes.map((child, index) => {
    const result = typesetNode(
      child,
      [...path, index],
      context,
      prevChild,
      prevLayoutNode,
      index === 0 ? padFirstOperator : undefined,
    );
    prevLayoutNode = result;
    prevChild = child;
    return result;
  });
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
