import * as sharedTypes from "./shared-types";

export type Glyph = {
    kind: "glyph";
    char: string;
    pending?: boolean;
};

type Common = {id: number};

export type Row = sharedTypes.Row<Glyph, Common>;
export type SubSup = sharedTypes.SubSup<Glyph, Common>;
export type Limits = sharedTypes.Limits<Glyph, Common>;
export type Frac = sharedTypes.Frac<Glyph, Common>;
export type Root = sharedTypes.Root<Glyph, Common>;
export type Atom = sharedTypes.Atom<Glyph, Common>;

export type Node = Row | SubSup | Limits | Frac | Root | Atom;

// The editor nodes need IDs so we can position the cursor relative to
// layout nodes which get their ID from the editor nodes.

export type HasChildren = Row;

export type Cursor = {
    path: number[];
    // these are indices of the node inside the parent
    prev: number;
    next: number;
};
