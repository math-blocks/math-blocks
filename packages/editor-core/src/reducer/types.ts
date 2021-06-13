import * as types from "../ast/types";

type ZCommon = {id: number; style: types.Style};

export type ZRow = ZCommon & {
    type: "zrow";
    left: readonly types.Node[];
    selection: readonly types.Node[];
    right: readonly types.Node[];
};

export type ZFrac =
    | (ZCommon & {
          type: "zfrac";
          left: readonly [];
          right: readonly [types.Row];
      })
    | (ZCommon & {
          type: "zfrac";
          left: readonly [types.Row];
          right: readonly [];
      });

// TODO: consider splitting up SubSup into three different types.
// If both `sub` and `sup` are `null` then the node is invalid.
export type ZSubSup =
    | (ZCommon & {
          type: "zsubsup";
          left: readonly [];
          right: readonly [types.Row | null];
      })
    | (ZCommon & {
          type: "zsubsup";
          left: readonly [types.Row | null];
          right: readonly [];
      });

export type ZLimits =
    | (ZCommon & {
          type: "zlimits";
          left: readonly [];
          right: readonly [types.Row | null];
          inner: types.Node;
      })
    | (ZCommon & {
          type: "zlimits";
          left: readonly [types.Row];
          right: readonly [];
          inner: types.Node;
      });

export type ZRoot =
    | (ZCommon & {
          type: "zroot";
          left: readonly [];
          right: readonly [types.Row];
      })
    | (ZCommon & {
          type: "zroot";
          left: readonly [types.Row | null];
          right: readonly [];
      });

export type ZDelimited = ZCommon & {
    type: "zdelimited";
    left: readonly [];
    right: readonly [];
    leftDelim: types.Atom;
    rightDelim: types.Atom;
};

export type ZTable = ZCommon & {
    type: "ztable";
    left: readonly (types.Row | null)[];
    right: readonly (types.Row | null)[];
    rowCount: number;
    colCount: number;
};

export type Focus = ZFrac | ZSubSup | ZLimits | ZRoot | ZDelimited | ZTable;

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

export type Action =
    | {
          type: "ArrowLeft";
      }
    | {
          type: "ArrowRight";
      }
    | {
          type: "Backspace";
      }
    | {
          type: "Subscript";
      }
    | {
          type: "Superscript";
      }
    | {
          type: "Parens";
          char: "(" | ")" | "[" | "]" | "{" | "}";
      }
    | {
          type: "Fraction";
      }
    | {
          // TODO: add support for an index
          type: "Root";
      }
    | {
          type: "Color";
          color: string;
      }
    | {
          type: "Cancel";
      }
    | {
          type: "Uncancel";
      }
    | {
          type: "InsertChar";
          char: string;
      }
    | {
          type: "StartSelecting";
      }
    | {
          type: "StopSelecting";
      }
    | {
          type: "PositionCursor";
          cursor: Zipper;
      };
