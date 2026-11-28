import * as types from '../char/types';

export type Path = readonly number[];

export type Selection = {
  readonly anchor: {
    readonly path: Path;
    readonly offset: number;
  };
  readonly focus: {
    readonly path: Path;
    readonly offset: number;
  };
};

export type State = {
  readonly row: types.CharRow;
  readonly selecting: boolean;
  readonly selection: Selection;
};

export type MatrixActions =
  | {
      readonly type: 'InsertMatrix';
      readonly delimiters: 'brackets' | 'parens';
    }
  | {
      readonly type: 'AddRow';
      readonly side: 'above' | 'below';
    }
  | {
      readonly type: 'AddColumn';
      readonly side: 'left' | 'right';
    }
  | {
      readonly type: 'DeleteRow';
    }
  | {
      readonly type: 'DeleteColumn';
    };

/**
 * Which row `MoveToStart` and `MoveToEnd` move within: the row the cursor is
 * in (`'row'`), such as a numerator or an exponent, or the whole formula
 * (`'formula'`).
 */
export type MoveScope = 'row' | 'formula';

export type Action =
  // `extend: true` moves the selection's focus and keeps its anchor, as when
  // `selecting` is set. Otherwise the selection collapses, as for a plain
  // arrow key.
  | { readonly type: 'ArrowLeft'; readonly extend?: boolean }
  | { readonly type: 'ArrowRight'; readonly extend?: boolean }
  // Move to the start or end of the current row or of the whole formula.
  | {
      readonly type: 'MoveToStart';
      readonly scope: MoveScope;
      readonly extend?: boolean;
    }
  | {
      readonly type: 'MoveToEnd';
      readonly scope: MoveScope;
      readonly extend?: boolean;
    }
  // Move out of the row the cursor is in, to just after (`'forward'`) or just
  // before (`'backward'`) the node that contains it, such as a fraction. Does
  // nothing, and returns the same state, when the cursor is in the top-level
  // row.
  | { readonly type: 'ExitRow'; readonly direction: 'forward' | 'backward' }
  // Select the whole formula.
  | { readonly type: 'SelectAll' }
  | { readonly type: 'ArrowUp' }
  | { readonly type: 'ArrowDown' }
  | { readonly type: 'Backspace' }
  | { readonly type: 'Subscript' }
  | { readonly type: 'Superscript' }
  | {
      readonly type: 'Parens';
      readonly char: '(' | ')' | '[' | ']' | '{' | '}' | '|';
    }
  | { readonly type: 'Backslash' }
  | { readonly type: 'Space' }
  | { readonly type: 'Fraction' }
  | { readonly type: 'Root' } // TODO: add support for an index
  | {
      readonly type: 'InsertChar';
      readonly char: string;
    }
  | { readonly type: 'StartSelecting' }
  | { readonly type: 'StopSelecting' }
  | {
      readonly type: 'UpdateSelection';
      readonly intersections: readonly Intersection[];
      readonly selecting: boolean;
    }
  // Formatting actions
  | {
      readonly type: 'Color';
      readonly color: string;
    }
  | { readonly type: 'Cancel' }
  | { readonly type: 'Uncancel' }
  | MatrixActions;

type Side = 'left' | 'right';
export type Intersection =
  | { readonly type: 'content'; readonly id: number; readonly side: Side }
  | { readonly type: 'padding'; readonly flag: 'start' | 'end' };
