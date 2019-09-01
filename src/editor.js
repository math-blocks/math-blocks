// @flow
import {getId} from "./unique-id";

export type Row = {|
  id: number,
  type: "row",
  children: Node[],
|};

export type SubSup = {|
  id: number,
  type: "subsup",
  sub?: Row,
  sup?: Row,
|};

export type Frac = {|
  id: number,
  type: "frac",
  numerator: Row,
  denominator: Row,
|};

// TODO: allow different types of parens
export type Parens = {|
  id: number,
  type: "parens",
  children: Node[],
|};

export type Glyph = {|
  id: number,
  type: "glyph",
  char: string,
|};

export type Node =
  | Row
  | SubSup
  | Frac
  | Parens
  | Glyph
  ;

export type HasChildren =
  | Row
  | Parens
  ;

export const row = (children: Node[]): Row => ({
  id: getId(),
  type: "row",
  children,
});

export const subsup = (sub?: Row, sup?: Row): SubSup => ({
  id: getId(),
  type: "subsup",
  sub,
  sup,
});

export const frac = (numerator: Row, denominator: Row): Frac => ({
  id: getId(),
  type: "frac",
  numerator,
  denominator,
});

export const parens = (children: Node[]): Parens => ({
  id: getId(),
  type: "parens",
  children,
});

export const glyph = (char: string): Glyph => ({
  id: getId(),
  type: "glyph",
  char,
});

export const findNode = (root: Node, id: number): Node | void => {
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

export const findNode_ = (root: Node, id: number): Node => {
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
