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

export type Action =
  | { readonly type: 'ArrowLeft' }
  | { readonly type: 'ArrowRight' }
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
