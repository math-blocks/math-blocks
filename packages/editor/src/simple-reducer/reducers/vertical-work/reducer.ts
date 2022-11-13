import { insertChar } from './insert-char';
import { moveUp, moveDown } from './move-vertically';
import { backspace } from './backspace';

import type { Action, State } from '../../types';

export const verticalWork = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ArrowUp':
      return moveUp(state);
    case 'ArrowDown':
      return moveDown(state);
    case 'InsertChar':
      return insertChar(state, action.char);
    case 'Backspace':
      return backspace(state);
    default:
      return state;
  }
};
