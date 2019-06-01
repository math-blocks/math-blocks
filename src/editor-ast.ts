type Row = {
  id: number,
  type: "row",
  children: Node[],
};

type Sup = {
  id: number,
  type: "sup",
  children: Node[],
};

type Sub = {
  id: number,
  type: "sub",
  children: Node[],
};

type Frac = {
  id: number,
  type: "frac",
  numerator: Row,
  denominator: Row,
};

// TODO: allow different types of parens
type Parens = {
  id: number,
  type: "parens",
  children: Node[],
};

export type Glyph = {
  id: number,
  type: "glyph",
  char: string,
};

export type Node =
  | Row
  | Sup
  | Sub
  | Frac
  | Parens
  | Glyph
  ;
