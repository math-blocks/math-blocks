import * as types from './types';

export const traverseNodes = (
  nodes: readonly types.CharNode[],
  callback: {
    readonly enter?: <U extends types.CharNode>(
      node: U,
      path: readonly number[],
    ) => void;
    readonly exit: <U extends types.CharNode>(
      node: U,
      path: readonly number[],
    ) => U | void;
  },
  path: readonly number[],
  offset: number,
): readonly types.CharNode[] =>
  nodes.map((node, index) =>
    traverseNode(node, callback, [...path, offset + index]),
  );

const traverseRow = (
  row: types.CharRow,
  callback: {
    readonly enter?: <U extends types.CharNode>(
      node: U,
      path: readonly number[],
    ) => void;
    readonly exit: <U extends types.CharNode>(
      node: U,
      path: readonly number[],
    ) => U | void;
  },
  path: readonly number[],
): types.CharRow => {
  callback.enter?.(row, path);

  const newChildren = traverseNodes(row.children, callback, path, 0);
  const changed = newChildren.some(
    (child, index: number) => child !== row.children[index],
  );

  if (changed) {
    const newRow = {
      ...row,
      children: newChildren,
    };
    return callback.exit(newRow, path) || newRow;
  }

  return callback.exit(row, path) || row;
};

export const traverseNode = <T extends types.CharNode>(
  node: T,
  callback: {
    readonly enter?: <U extends types.CharNode>(
      node: U,
      path: readonly number[],
    ) => void;
    readonly exit: <U extends types.CharNode>(
      node: U,
      path: readonly number[],
    ) => U | void;
  },
  path: readonly number[],
): T => {
  if (node.type === 'char') {
    callback.enter?.(node, path);
    return callback.exit(node, path) || node;
  }

  // The top-level node is a row
  if (node.type === 'row') {
    const result = traverseRow(node, callback, path);
    // @ts-expect-error: TypeScript doesn't realize that T is equivalent to types.Row here
    return result;
  }

  callback.enter?.(node, path);
  const newChildren = node.children.map((row, index) => {
    return row && traverseRow(row, callback, [...path, index]);
  });

  const changed = newChildren.some(
    (child, index) => child !== node.children[index],
  );

  if (changed) {
    const newNode = {
      ...node,
      children: newChildren,
    };
    return callback.exit(newNode, path) || newNode;
  }

  return callback.exit(node, path) || node;
};

type ColorMap = ReadonlyMap<number, string>;

export const applyColorMapToEditorNode = (
  node: types.CharNode,
  colorMap: ColorMap,
): types.CharNode => {
  return traverseNode(
    node,
    {
      exit: (node, path) => {
        const color = colorMap.get(node.id);
        return color
          ? {
              ...node,
              style: {
                ...node.style,
                color,
              },
            }
          : node;
      },
    },
    [],
  );
};
