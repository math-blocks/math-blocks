import * as types from "../ast/types";

export type ZRow = {
    id: number;
    type: "zrow";
    left: readonly types.Node[];
    selection: readonly types.Node[];
    right: readonly types.Node[];
    style: types.Style;
};

export type ZFrac =
    | {
          id: number;
          type: "zfrac";
          left: readonly [];
          right: readonly [types.Row];
          style: types.Style;
      }
    | {
          id: number;
          type: "zfrac";
          left: readonly [types.Row];
          right: readonly [];
          style: types.Style;
      };

// TODO: consider splitting up SubSup into three different types.
// If both `sub` and `sup` are `null` then the node is invalid.
export type ZSubSup =
    | {
          id: number;
          type: "zsubsup";
          left: readonly [];
          right: readonly [types.Row | null];
          style: types.Style;
      }
    | {
          id: number;
          type: "zsubsup";
          left: readonly [types.Row | null];
          right: readonly [];
          style: types.Style;
      };

export type ZLimits =
    | {
          id: number;
          type: "zlimits";
          left: readonly [];
          right: readonly [types.Row | null];
          inner: types.Node;
          style: types.Style;
      }
    | {
          id: number;
          type: "zlimits";
          left: readonly [types.Row];
          right: readonly [];
          inner: types.Node;
          style: types.Style;
      };

export type ZRoot =
    | {
          id: number;
          type: "zroot";
          left: readonly [];
          right: readonly [types.Row];
          style: types.Style;
      }
    | {
          id: number;
          type: "zroot";
          left: readonly [types.Row | null];
          right: readonly [];
          style: types.Style;
      };

export type ZDelimited = {
    id: number;
    type: "zdelimited";
    left: readonly [];
    right: readonly [];
    leftDelim: types.Atom;
    rightDelim: types.Atom;
    style: types.Style;
};

// TODO: we need some way to convert this to a non-zippered node, right now we
// don't have a "columns" type as part of Editor.types.  Once we have a "columns"
// we'll also need a way for the parser to parse that to a regular expression.
export type ZColumns = {
    id: number;
    type: "zcolumns";
    left: readonly types.Row[];
    right: readonly types.Row[];
    style: types.Style;
};

export type Focus = ZFrac | ZSubSup | ZLimits | ZRoot | ZDelimited; // | ZColumns;

// TODO:
// - create functions to convert between ZRow and BreadcrumbRow and back
//   if the ZRow we're trying to convert has a selection, throw

export type BreadcrumbRow = {
    id: number;
    type: "bcrow";
    left: readonly types.Node[];
    right: readonly types.Node[];
    style: types.Style;
};

export type Breadcrumb = {
    row: BreadcrumbRow;
    focus: Focus; // The item from the row that the cursor is inside of
};

export type Zipper = {
    // NOTE: zipper.row.id is not stable since the current row can change as
    // a user navigates into child rows (e.g. numerator or denominator of a
    // fraction).
    row: ZRow;
    // TODO: Consider making this a linked list where the "head" is the node
    // nearest to zipper.row in the breadrcumbs.
    breadcrumbs: readonly Breadcrumb[]; // any ZRow in here should have a non-null `focus`
};

export type State = {
    startZipper: Zipper;
    endZipper: Zipper;
    zipper: Zipper;
    selecting: boolean;
};
