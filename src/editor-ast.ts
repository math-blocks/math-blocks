type Row = {
  id: number,
  type: "row",
  children: Node[],
};

type SubSup = {
  id: number,
  type: "subsup",
  sub?: Row,
  sup?: Row,
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
  | SubSup
  | Frac
  | Parens
  | Glyph
  ;

export type HasChildren =
  | Row
  | Parens
  ;