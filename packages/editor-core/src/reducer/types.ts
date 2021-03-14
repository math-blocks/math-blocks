import * as types from "../types";
import {Dir} from "./enums";

type Selection = {
    dir: Dir;
    nodes: readonly types.Node[];
};

export type ZRowWithoutSelection = {
    id: number;
    type: "zrow";
    left: readonly types.Node[];
    selection: null;
    right: readonly types.Node[];
};

export type ZRowWithSelection = {
    id: number;
    type: "zrow";
    left: readonly types.Node[];
    selection: Selection;
    right: readonly types.Node[];
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

// TODO: we need some way to convert this to a non-zippered node, right now we
// don't have a "columns" type as part of Editor.types.  Once we have a "columns"
// we'll also need a way for the parser to parse that to a regular expression.
export type ZColumns = {
    id: number;
    type: "zcolumns";
    left: readonly types.Row[];
    right: readonly types.Row[];
};

export type Focus = ZFrac | ZSubSup | ZLimits | ZRoot; // | ZColumns;

export type Breadcrumb = {
    row: ZRow;
    focus: Focus; // The item from the row that the cursor is inside of
};

export type Zipper = {
    row: ZRow;
    // TODO: Consider making this a linked list where the "head" is the node
    // nearest to zipper.row in the breadrcumbs.
    breadcrumbs: readonly Breadcrumb[]; // any ZRow in here should have a non-null `focus`
};
