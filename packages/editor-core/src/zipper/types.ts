import * as types from "../types";
import {Dir} from "./constants";

type Selection = {
    dir: Dir;
    nodes: types.Node[];
};

export type ZRowWithoutSelection = {
    id: number;
    type: "zrow";
    left: types.Node[];
    selection: null;
    right: types.Node[];
};

export type ZRowWithSelection = {
    id: number;
    type: "zrow";
    left: types.Node[];
    selection: Selection;
    right: types.Node[];
};

export type ZRow = ZRowWithoutSelection | ZRowWithSelection;

export type ZFrac = {
    id: number;
    type: "zfrac";
    dir: Dir; // what is focused, left = 0, right = 1
    other: types.Row; // what isn't being focused
};

// TODO: consider splitting up SubSup into three different types.
// If both `sub` and `sup` are `null` then the node is invalid.
export type ZSubSup = {
    id: number;
    type: "zsubsup";
    dir: Dir;
    other: types.Row | null; // what isn't being focused
};

export type ZLimits =
    | {
          id: number;
          type: "zlimits";
          dir: Dir.Left;
          other: types.Row | null;
          inner: types.Node;
      }
    | {
          id: number;
          type: "zlimits";
          dir: Dir.Right;
          other: types.Row;
          inner: types.Node;
      };

export type ZRoot =
    | {
          id: number;
          type: "zroot";
          dir: Dir.Left;
          other: types.Row;
      }
    | {
          id: number;
          type: "zroot";
          dir: Dir.Right;
          other: types.Row | null;
      };

export type Focus = ZFrac | ZSubSup | ZLimits | ZRoot;

export type Breadcrumb = {
    row: ZRow;
    focus: Focus; // How does focus differ from selection?
};

export type Zipper = {
    row: ZRow;
    // TODO: Consider making this a linked list where the "head" is the node
    // nearest to zipper.row in the breadrcumbs.
    breadcrumbs: Breadcrumb[]; // any ZRow in here should have a non-null `focus`
};
