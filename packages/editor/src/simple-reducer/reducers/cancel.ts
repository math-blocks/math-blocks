import * as transforms from '../../char/transforms';
import type { State } from '../types';

import { isPrefix } from '../path-utils';
import { getPathAndRange } from '../selection-utils';

export const cancel = (state: State, cancelId?: number): State => {
  const { selection } = state;
  const { path, start, end } = getPathAndRange(selection);

  if (end - start > 0) {
    const newRow = transforms.traverseNode(
      state.row,
      {
        exit: (node, nodePath) => {
          if (isPrefix(path, nodePath)) {
            const remainder = nodePath.slice(path.length);
            const head = remainder[0];
            if (head >= start && head < end && remainder.length === 1) {
              return {
                ...node,
                style: {
                  ...node.style,
                  cancel: cancelId,
                },
              };
            }
          }
          return node;
        },
      },
      [],
    );

    return {
      ...state,
      row: newRow,
    };
  }

  return state;
};
