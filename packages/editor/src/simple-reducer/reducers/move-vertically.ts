import type { Action, State } from '../types';

import { verticalWork } from './vertical-work/reducer';

export const moveVertically = (state: State, action: Action): State => {
  return verticalWork(state, action);
};
