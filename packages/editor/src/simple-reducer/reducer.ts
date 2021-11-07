import { UnreachableCaseError, getId } from '@math-blocks/core';

import * as builders from '../char/builders';

import { moveLeft } from './reducers/move-left';
import { moveRight } from './reducers/move-right';
import { backspace } from './reducers/backspace';
import { frac } from './reducers/frac';
import { matrix } from './reducers/matrix';
import { moveVertically } from './reducers/move-vertically';
import { parens } from './reducers/parens';
import { cancel } from './reducers/cancel';
import { subsup } from './reducers/subsup';
import { root } from './reducers/root';
import { insertChar } from './reducers/insert-char';
import { color } from './reducers/color';
import { setSelection } from './reducers/set-selection';

import type { Action, State } from './types';

const initialState: State = {
  row: builders.row([]),
  selecting: false,
  selection: {
    anchor: {
      path: [],
      offset: 0,
    },
    focus: {
      path: [],
      offset: 0,
    },
  },
};

export const reducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case 'ArrowLeft':
      return moveLeft(state);
    case 'ArrowRight':
      return moveRight(state);
    case 'ArrowUp':
    case 'ArrowDown':
      return moveVertically(state, action);
    case 'Backspace':
      return backspace(state);
    case 'Subscript':
      return subsup(state, 0);
    case 'Superscript':
      return subsup(state, 1);
    case 'Parens':
      return parens(state, action.char);
    case 'Fraction':
      return frac(state);
    // TODO: use "Sqrt" and "NthRoot" to differentiate the two possibilities
    case 'Root':
      return root(state, false);
    case 'Color':
      return color(state, action.color);
    // Split this into cancel and uncancel
    case 'Cancel':
      return cancel(state, getId());
    case 'Uncancel':
      return cancel(state);
    // We don't handle any other actions yet so ignore them and return the
    // current startZipper.
    case 'InsertChar':
      return insertChar(state, action.char);
    case 'StartSelecting':
      return state.selecting
        ? state
        : {
            ...state,
            selecting: true,
          };
    case 'StopSelecting':
      return state.selecting
        ? {
            ...state,
            selecting: false,
          }
        : state;
    case 'UpdateSelection':
      return setSelection(state, action.intersections, action.selecting);
    case 'InsertMatrix':
    case 'AddRow':
    case 'AddColumn':
    case 'DeleteRow':
    case 'DeleteColumn':
      return matrix(state, action);
    default:
      throw new UnreachableCaseError(action);
  }

  return state;
};
