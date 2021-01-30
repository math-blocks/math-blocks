import * as types from "../types";

export type ZRow = {
    id: number;
    type: "zrow";
    left: types.Node[];
    right: types.Node[];
};

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
    type: "zlimits";
    left?: types.Row; // lower
    right?: types.Row | null; // upper
};

type ZRoot = {
    id: number;
    type: "zroot";
    left?: types.Row | null; // index
    right?: types.Row; // radicand
};

export type Breadcrumb = {
    row: ZRow;
    focus: ZFrac | ZSubSup | ZLimit | ZRoot;
};

export type Zipper = {
    row: ZRow;
    // TODO: Consider making this a linked list where the "head" is the node
    // nearest to zipper.row in the path.
    path: Breadcrumb[]; // any ZRow in here should have a non-null `focus`
};
