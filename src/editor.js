// @flow
import {getId} from "./unique-id";

export type Row<T> = {|
  id: number,
  type: "row",
  children: Node<T>[],
|};

export type SubSup<T> = {|
  id: number,
  type: "subsup",
  sub?: Row<T>,
  sup?: Row<T>,
|};

export type Frac<T> = {|
  id: number,
  type: "frac",
  numerator: Row<T>,
  denominator: Row<T>,
|};

// TODO: allow different types of parens
export type Parens<T> = {|
  id: number,
  type: "parens",
  children: Node<T>[],
|};

export type Glyph = {|
  id: number,
  type: "glyph",
  char: string,
|};

export type Node<T: {+id: number, +type: string}> =
  | Row<T>
  | SubSup<T>
  | Frac<T>
  | Parens<T>
  | T // leaf node
  ;

export type HasChildren<T> =
  | Row<T>
  | Parens<T>
  ;

export function row<T>(children: Node<T>[]): Row<T> {
  return {
    id: getId(),
    type: "row",
    children,
  };
}

export function subsup<T>(sub?: Row<T>, sup?: Row<T>): SubSup<T> {
  return {
    id: getId(),
    type: "subsup",
    sub,
    sup,
  };
}

export function frac<T>(numerator: Row<T>, denominator: Row<T>): Frac<T> {
  return {
    id: getId(),
    type: "frac",
    numerator,
    denominator,
  };
}

export function parens<T>(children: Node<T>[]): Parens<T> {
  return {
    id: getId(),
    type: "parens",
    children,
  };
}

export const glyph = (char: string): Glyph => ({
  id: getId(),
  type: "glyph",
  char,
});

export function findNode<T: {+id: number, +type: "glyph"}>(root: Node<T>, id: number): Node<T> | void {
  // base case
  if (root.id === id) {
    return root;
  }

  switch (root.type) {
    case "frac": 
      return [root.denominator, root.numerator].map(node => findNode(node, id)).find(Boolean);
    case "subsup":
      // @ts-ignore: switch to flow
      return [root.sub, root.sup].filter(Boolean).map(node => findNode(node, id)).find(Boolean);
    case "row":
      return root.children.map(node => findNode(node, id)).find(Boolean);
    default:
      // remaining nodes are leaf nodes
      return undefined;
  }
};

export function findNode_<T: {+id: number, +type: "glyph"}>(root: Node<T>, id: number): Node<T> {
  const result = findNode(root, id);
  if (!result) {
    throw new Error(`node with id ${id} could not be found`);
  }
  return result;
};

export type Cursor = {|
  path: $ReadOnlyArray<number>,
  // these are indices of the node inside the parent
  prev: ?number,
  next: ?number,
|};
