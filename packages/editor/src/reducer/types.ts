import * as types from '../char/types';

type Zipperize<T extends types.CharNode> = {
  readonly type: `z${T['type']}`;
  readonly left: readonly (types.CharRow | null)[];
  readonly right: readonly (types.CharRow | null)[];
} & Omit<T, 'children' | 'type'>;

type ZCommon = { readonly id: number; readonly style: types.Style };

export type ZRow = ZCommon & {
  readonly type: 'zrow';
  readonly left: readonly types.CharNode[];
  readonly selection: readonly types.CharNode[];
  readonly right: readonly types.CharNode[];
};

export type ZFrac = Zipperize<types.CharFrac>;
export type ZSubSup = Zipperize<types.CharSubSup>;
export type ZLimits = Zipperize<types.CharLimits>;
export type ZRoot = Zipperize<types.CharRoot>;
export type ZDelimited = Zipperize<types.CharDelimited>;
export type ZTable = Zipperize<types.CharTable>;

export type Focus = ZFrac | ZSubSup | ZLimits | ZRoot | ZDelimited | ZTable;

// TODO:
// - create functions to convert between ZRow and BreadcrumbRow and back
//   if the ZRow we're trying to convert has a selection, throw

export type BreadcrumbRow = ZCommon & {
  readonly type: 'bcrow';
  readonly left: readonly types.CharNode[];
  readonly right: readonly types.CharNode[];
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
