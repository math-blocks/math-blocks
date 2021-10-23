import type { MatrixActions } from './matrix';
import type { Zipper } from './types';

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
  | { readonly type: 'Fraction' }
  | {
      // TODO: add support for an index
      readonly type: 'Root';
    }
  | {
      readonly type: 'InsertChar';
      readonly char: string;
    }
  | { readonly type: 'StartSelecting' }
  | { readonly type: 'StopSelecting' }
  | {
      readonly type: 'PositionCursor';
      readonly cursor: Zipper;
    }
  // Formatting actions
  | {
      readonly type: 'Color';
      readonly color: string;
    }
  | { readonly type: 'Cancel' }
  | { readonly type: 'Uncancel' }
  | MatrixActions;
