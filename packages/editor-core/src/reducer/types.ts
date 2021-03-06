import * as types from "../ast/types";

type Zipperize<T extends types.Node> = {
    readonly type: `z${T["type"]}`;
    readonly left: readonly (types.Row | null)[];
    readonly right: readonly (types.Row | null)[];
} & Omit<T, "children" | "type">;

type ZCommon = {readonly id: number; readonly style: types.Style};

export type ZRow = ZCommon & {
    readonly type: "zrow";
    readonly left: readonly types.Node[];
    readonly selection: readonly types.Node[];
    readonly right: readonly types.Node[];
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
    readonly type: "bcrow";
    readonly left: readonly types.Node[];
    readonly right: readonly types.Node[];
};

export type Breadcrumb<F extends Focus = Focus> = {
    readonly row: BreadcrumbRow;
    readonly focus: F; // The item from the row that the cursor is inside of
};

export type Zipper = {
    // NOTE: zipper.row.id is not stable since the current row can change as
    // a user navigates into child rows (e.g. numerator or denominator of a
    // fraction).
    readonly row: ZRow;
    // TODO: Consider making this a linked list where the "head" is the node
    // nearest to zipper.row in the breadrcumbs.
    readonly breadcrumbs: readonly Breadcrumb[]; // any ZRow in here should have a non-null `focus`
};

export type State = {
    readonly startZipper: Zipper;
    readonly endZipper: Zipper;
    readonly zipper: Zipper;
    readonly selecting: boolean;
};
