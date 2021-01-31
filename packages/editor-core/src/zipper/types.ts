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
    dir: "left" | "right";
    other: types.Row; // what isn't being focused
};

// TODO: consider splitting up SubSup into three different types.
// If both `sub` and `sup` are `null` then the node is invalid.
export type ZSubSup = {
    id: number;
    type: "zsubsup";
    dir: "left" | "right";
    other: types.Row | null; // what isn't being focused
};

export type ZLimits =
    | {
          id: number;
          type: "zlimits";
          dir: "left";
          other: types.Row | null;
          inner: types.Node;
      }
    | {
          id: number;
          type: "zlimits";
          dir: "right";
          other: types.Row;
          inner: types.Node;
      };

export type ZRoot =
    | {
          id: number;
          type: "zroot";
          dir: "left";
          other: types.Row;
      }
    | {
          id: number;
          type: "zroot";
          dir: "right";
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
    // nearest to zipper.row in the path.
    path: Breadcrumb[]; // any ZRow in here should have a non-null `focus`
};
