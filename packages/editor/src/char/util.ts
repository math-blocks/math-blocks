import * as builders from './builders';
import * as types from './types';

import { NodeType } from '../shared-types';

export const isEqual = (
  a: types.CharNode | null,
  b: types.CharNode | null,
): boolean => {
  if (a == null || b == null) {
    return a == b;
  }

  if (a.type !== b.type) {
    return false;
  } else if (a.type === 'char' && b.type === 'char') {
    return a.value === b.value;
  } else if (a.type === 'frac' && b.type === 'frac') {
    const [aNum, aDen] = a.children;
    const [bNum, bDen] = b.children;
    return isEqual(aNum, bNum) && isEqual(aDen, bDen);
  } else if (a.type === 'root' && b.type === 'root') {
    const [aIndex, aRad] = a.children;
    const [bIndex, bRad] = b.children;
    if (isEqual(aRad, bRad)) {
      return aIndex != null && bIndex != null
        ? isEqual(aIndex, bIndex)
        : aIndex === bIndex;
    } else {
      return false;
    }
  } else if (a.type === 'subsup' && b.type === 'subsup') {
    const [aSub, aSup] = a.children;
    const [bSub, bSup] = b.children;

    if (aSub == null || bSub == null) {
      if (aSub != bSub) {
        return false;
      }
    }
    if (aSup == null || bSup == null) {
      if (aSup != bSup) {
        return false;
      }
    }
    if (aSub != null && bSub != null) {
      if (!isEqual(aSub, bSub)) {
        return false;
      }
    }
    if (aSup != null && bSup != null) {
      if (!isEqual(aSup, bSup)) {
        return false;
      }
    }

    return true;
  } else if (a.type === 'row' && b.type === 'row') {
    if (a.children.length !== b.children.length) {
      return false;
    }
    return a.children.every((aChild, index) =>
      isEqual(aChild, b.children[index]),
    );
  } else if (a.type === 'delimited' && b.type === 'delimited') {
    const [aInner] = a.children;
    const [bInner] = b.children;
    return (
      isEqual(aInner, bInner) &&
      isEqual(a.leftDelim, b.leftDelim) &&
      isEqual(a.rightDelim, b.rightDelim)
    );
  } else if (a.type === 'accent' && b.type === 'accent') {
    const [aInner] = a.children;
    const [bInner] = b.children;
    return isEqual(aInner, bInner) && a.accent === b.accent;
  } else if (a.type === 'table' && b.type === 'table') {
    if (a.children.length !== b.children.length) {
      return false;
    }
    let delimsAreEqual = true;
    if (a.delimiters && b.delimiters) {
      delimsAreEqual =
        isEqual(a.delimiters.left, b.delimiters.left) &&
        isEqual(a.delimiters.right, b.delimiters.right);
    } else if (!a.delimiters && !b.delimiters) {
      delimsAreEqual = true;
    } else {
      delimsAreEqual = false;
    }

    return (
      a.children.every((aRow, index) => {
        const bRow = b.children[index];
        return isEqual(aRow, bRow);
      }) &&
      a.colCount === b.colCount &&
      a.rowCount === b.rowCount &&
      delimsAreEqual
    );
  } else {
    return false;
  }
};

export type ID = {
  readonly id: number;
};

export const row = (str: string): types.CharRow =>
  builders.row(
    str.split('').map((glyph) => {
      if (glyph === '-') {
        return builders.char('\u2212');
      }
      return builders.char(glyph);
    }),
  );

export const frac = (num: string, den: string): types.CharFrac =>
  builders.frac(
    num.split('').map((glyph) => builders.char(glyph)),
    den.split('').map((glyph) => builders.char(glyph)),
  );

export const sqrt = (radicand: string): types.CharRoot =>
  builders.root(
    null,
    radicand.split('').map((glyph) => builders.char(glyph)),
  );

export const root = (radicand: string, index: string): types.CharRoot =>
  builders.root(
    radicand.split('').map((glyph) => builders.char(glyph)),
    index.split('').map((glyph) => builders.char(glyph)),
  );

export const sup = (sup: string): types.CharSubSup =>
  builders.subsup(
    undefined,
    sup.split('').map((glyph) => builders.char(glyph)),
  );

export const sub = (sub: string): types.CharSubSup =>
  builders.subsup(
    sub.split('').map((glyph) => builders.char(glyph)),
    undefined,
  );

export const subsup = (sub: string, sup: string): types.CharSubSup =>
  builders.subsup(
    sub.split('').map((glyph) => builders.char(glyph)),
    sup.split('').map((glyph) => builders.char(glyph)),
  );

// Maybe we should return undefined if there isn't a node at the given path.
export function nodeAtPath(
  root: types.CharNode,
  path: readonly number[],
): types.CharNode {
  if (path.length === 0) {
    return root;
  } else {
    switch (root.type) {
      case 'char':
        throw new Error('invalid path');
      case NodeType.SubSup: {
        const [head, ...tail] = path;
        if (head > 1) {
          throw new Error('invalid path');
        }
        const headChild = root.children[head];
        if (!headChild) {
          throw new Error('invalid path');
        }
        return nodeAtPath(headChild, tail);
      }
      case NodeType.Limits: {
        const [head, ...tail] = path;
        if (head > 1) {
          throw new Error('invalid path');
        }
        const headChild = root.children[head];
        if (!headChild) {
          throw new Error('invalid path');
        }
        return nodeAtPath(headChild, tail);
      }
      case NodeType.Root: {
        const [head, ...tail] = path;
        if (head > 1) {
          throw new Error('invalid path');
        }
        const headChild = root.children[head];
        if (!headChild) {
          throw new Error('invalid path');
        }
        return nodeAtPath(headChild, tail);
      }
      case NodeType.Table: {
        const [head, ...tail] = path;
        if (head > root.children.length - 1) {
          throw new Error('invalid path');
        }
        const headChild = root.children[head];
        if (!headChild) {
          throw new Error('invalid path');
        }
        return nodeAtPath(headChild, tail);
      }
      default: {
        const [head, ...tail] = path;
        return nodeAtPath(root.children[head], tail);
      }
    }
  }
}

export function pathForNode(
  root: types.CharNode,
  node: types.CharNode,
  path: readonly number[] = [],
): readonly number[] | null {
  if (node === root) {
    return path;
  } else {
    switch (root.type) {
      case 'char':
        return null;
      default: {
        for (let i = 0; i < root.children.length; i++) {
          const child = root.children[i];
          if (child) {
            const result = pathForNode(child, node, [...path, i]);
            if (result) {
              return result;
            }
          }
        }
        return null;
      }
    }
  }
}

export type HasChildren = types.CharRow;

export const hasChildren = (node: types.CharNode): node is HasChildren => {
  return node.type === 'row';
};

export const isOperator = (atom: types.CharAtom): boolean => {
  const char = atom.value;

  const operators = [
    '+',
    '\u2212', // \minus
    '\u00B1', // \pm
    '\u00D7', // \times
    '\u22C5', // \cdot
    '=',
    '<',
    '>',
    '\u2260', // \neq
    '\u2265', // \geq
    '\u2264', // \leq
  ];

  if (operators.includes(char)) {
    return true;
  }

  const charCode = char.charCodeAt(0);

  // Arrows
  if (charCode >= 0x2190 && charCode <= 0x21ff) {
    return true;
  }

  return false;
};

export const isAtom = (
  node: types.CharNode,
  charOrChars: string | readonly string[],
): boolean => {
  if (node.type === 'char') {
    return Array.isArray(charOrChars)
      ? charOrChars.includes(node.value)
      : charOrChars === node.value;
  }
  return false;
};
