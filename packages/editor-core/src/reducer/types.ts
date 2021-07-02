import * as types from "../ast/types";

type Zipperize<T extends types.Node> = {
    type: `z${T["type"]}`;
    left: readonly (types.Row | null)[];
    right: readonly (types.Row | null)[];
} & Omit<T, "children" | "type">;

type ZCommon = {id: number; style: types.Style};

export type ZRow = ZCommon & {
    type: "zrow";
    left: readonly types.Node[];
    selection: readonly types.Node[];
    right: readonly types.Node[];
};

export type ZFrac = Zipperize<types.Frac>;
export type ZSubSup = Zipperize<types.SubSup>;
export type ZLimits = Zipperize<types.Limits>;
export type ZRoot = Zipperize<types.Root>;
export type ZDelimited = Zipperize<types.Delimited>;
export type ZTable = Zipperize<types.Table>;

export type Focus = ZFrac | ZSubSup | ZLimits | ZRoot | ZDelimited | ZTable;

// TODO:
// - create functions to convert between ZRow and BreadcrumbRow and back
//   if the ZRow we're trying to convert has a selection, throw

export type BreadcrumbRow = ZCommon & {
    type: "bcrow";
    left: readonly types.Node[];
    right: readonly types.Node[];
};

export type Breadcrumb<F extends Focus = Focus> = {
    row: BreadcrumbRow;
    focus: F; // The item from the row that the cursor is inside of
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
