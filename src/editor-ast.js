// @flow
export type Row = $ReadOnly<{|
  id: number,
  type: "row",
  children: Node[],
|}>;

type SubSup = $ReadOnly<{|
  id: number,
  type: "subsup",
  sub?: Row,
  sup?: Row,
|}>;

type Frac = $ReadOnly<{|
  id: number,
  type: "frac",
  numerator: Row,
  denominator: Row,
|}>;

// TODO: allow different types of parens
type Parens = $ReadOnly<{|
  id: number,
  type: "parens",
  children: Node[],
|}>;

export type Glyph = $ReadOnly<{|
  id: number,
  type: "glyph",
  char: string,
|}>;

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

const findNode = (root: Node, id: number): Node | void => {
  // base case
  if (root.id === id) {
    return root;
  }

  switch (root.type) {
    case "frac": 
      return [root.denominator, root.numerator].map(node => findNode(node, id)).find(Boolean);
    case "subsup":
      // @ts-ignore: switch to flow
      return [root.sub, root.sub].filter(Boolean).map(node => findNode(node, id)).find(Boolean);
    case "row":
      return root.children.map(node => findNode(node, id)).find(Boolean);
    default:
      // remaining nodes are leaf nodes
      return undefined;
  }
};

const findNode_ = (root: Node, id: number): Node => {
  const result = findNode(root, id);
  if (!result) {
    throw new Error(`node with id ${id} could not be found`);
  }
  return result;
}

export {findNode, findNode_};
