import * as sharedTypes from "../shared-types";

export type Char = {
    readonly kind: "char";
    readonly char: string;
    readonly pending?: boolean; // TODO: move this into Style
};

export type Style = {
    readonly color?: string;
    readonly cancel?: number; // The ID of the cancel notation
};

type Common = {readonly id: number; readonly style: Readonly<Style>};

export type CharRow = sharedTypes.Row<Char, Common>;
export type Delimited = sharedTypes.Delimited<Char, Common>;
export type Table = sharedTypes.Table<Char, Common>;
export type SubSup = sharedTypes.SubSup<Char, Common>;
export type Limits = sharedTypes.Limits<Char, Common>;
export type Frac = sharedTypes.Frac<Char, Common>;
export type Root = sharedTypes.Root<Char, Common>;
export type CharAtom = sharedTypes.Atom<Char, Common>;

// TODO: split the concept of Node and Children where Children doesn't include
// Row.
export type CharNode =
    | CharRow
    | Delimited
    | Table
    | SubSup
    | Limits
    | Frac
    | Root
    | CharAtom;

// The editor nodes need IDs so we can position the cursor relative to
// layout nodes which get their ID from the editor nodes.

export type HasChildren = CharRow;

export type Cursor = {
    readonly path: readonly number[];
    // these are indices of the node inside the parent
    readonly prev: number;
    readonly next: number;
};
