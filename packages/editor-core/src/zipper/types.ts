import * as types from "../types";

// This formulation of a zipper is incorrect becuase everything is a ZNode, but
// really we need to include nodes from the tree type that we're creating a
// zipper for

// TODO: start by creating a zipper for a regular structure where everything
// is either an Atom or a Row.

export type ZRow = {
    id: number;
    type: "zrow";
    left: types.Node[];
    right: types.Node[];
};

// type ZFrac = {
//     type: "zfrac";
//     children:
//         | [left: [ZRow], focus: ZRow, right: []]
//         | [left: [], focus: ZRow, right: [ZRow]];
// };

// type ZFrac = {
//     type: "zfrac";
//     children:
//         | [types.Row, ZRow, undefined] // the middle `focus` element and `zipper.row` feel redundant
//         | [undefined, ZRow, types.Row]
// };

// type ZFrac = {
//     id: number;
//     type: "zfrac";
//     // TODO: replace children with `left` and `right`
//     // How do we enforce the number of children... what if we do:
//     // left?: types.Row
//     // right?: types.Row
//     children: [undefined, types.Row] | [types.Row, undefined]; // numerator, denominator
// };

type ZFrac = {
    id: number;
    type: "zfrac";
    left?: types.Row; // numerator
    right?: types.Row; // denominator
};

// TODO: consider splitting up SubSup into three different types.
// If both `sub` and `sup` are `null` then the node is invalid.
type ZSubSup = {
    id: number;
    type: "zsubsup";
    left?: types.Row | null; // numerator
    right?: types.Row | null; // denominator
};

type ZLimit = {
    id: number;
    type: "zlimit";
    children: // lower, upper
    [undefined, types.Row | null] | [types.Row, undefined];
};

type ZRoot = {
    id: number;
    type: "zroot";
    children: // index, radicand
    [undefined, types.Row] | [types.Row | null, undefined];
};

type ZAtom = {
    id: number;
    type: "zatom";
    value: Glyph;
};

// type ZNode = ZFrac | ZSubSup | ZLimit | ZRoot | ZAtom | ZRow;

export type Breadcrumb = {
    row: ZRow;
    focus: ZFrac | ZSubSup | ZLimit | ZRoot | ZAtom;
};

export type Zipper = {
    row: ZRow;
    // TODO: Consider making this a linked list where the "head" is the node
    // nearest to zipper.row in the path.
    path: Breadcrumb[]; // any ZRow in here should have a non-null `focus`
};

export type Glyph = {
    kind: "glyph";
    char: string;
    pending?: boolean;
};
