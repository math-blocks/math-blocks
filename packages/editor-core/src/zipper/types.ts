import * as types from "../types";

export type ZRow = {
    id: number;
    type: "zrow";
    left: types.Node[];
    right: types.Node[];
};

export type ZFrac = {
    id: number;
    type: "zfrac";
    left?: types.Row; // numerator
    right?: types.Row; // denominator
};

// TODO: consider splitting up SubSup into three different types.
// If both `sub` and `sup` are `null` then the node is invalid.
export type ZSubSup = {
    id: number;
    type: "zsubsup";
    left?: types.Row | null; // numerator
    right?: types.Row | null; // denominator
};

export type ZLimit = {
    id: number;
    type: "zlimits";
    left?: types.Row; // lower
    right?: types.Row | null; // upper
};

export type ZRoot = {
    id: number;
    type: "zroot";
    left?: types.Row | null; // index
    right?: types.Row; // radicand
};

export type Focus = ZFrac | ZSubSup | ZLimit | ZRoot;

export type Breadcrumb = {
    row: ZRow;
    focus: Focus;
};

export type Zipper = {
    row: ZRow;
    // TODO: Consider making this a linked list where the "head" is the node
    // nearest to zipper.row in the path.
    path: Breadcrumb[]; // any ZRow in here should have a non-null `focus`
};
