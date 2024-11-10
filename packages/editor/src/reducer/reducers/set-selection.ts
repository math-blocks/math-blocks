import { traverseNode } from '../../char/transforms';

import type { State, Intersection, Path } from '../types';

export const setSelection = (
  state: State,
  intersections: readonly Intersection[],
  selecting: boolean,
): State => {
  const lastInt = intersections[intersections.length - 1];
  const secondLastInt = intersections[intersections.length - 2];

  if (lastInt?.type === 'content') {
    let newFocus: { path: Path; offset: number } | null = null;
    traverseNode(
      state.row,
      {
        exit(node, path) {
          if (node.id === lastInt.id) {
            newFocus = {
              path: path.slice(0, -1),
              offset: path[path.length - 1],
            };
            if (lastInt.side === 'right') {
              newFocus.offset += 1;
            }
          }
        },
      },
      [],
    );
    if (newFocus) {
      return {
        ...state,
        selection: selecting
          ? {
              anchor: state.selection.anchor,
              focus: newFocus,
            }
          : {
              anchor: newFocus,
              focus: newFocus,
            },
      };
    }
  } else if (lastInt?.type === 'padding' && secondLastInt?.type === 'content') {
    let newFocus: { path: Path; offset: number } | null = null;
    traverseNode(
      state.row,
      {
        exit(node, path) {
          if (node.id === secondLastInt.id && 'children' in node) {
            newFocus = {
              path: path,
              // TODO: make the Intersection type more consistent
              offset: lastInt.flag === 'start' ? 0 : node.children.length,
            };
          }
        },
      },
      [],
    );
    if (newFocus) {
      return {
        ...state,
        selection: selecting
          ? {
              anchor: state.selection.anchor,
              focus: newFocus,
            }
          : {
              anchor: newFocus,
              focus: newFocus,
            },
      };
    }
  }

  return state;
};
