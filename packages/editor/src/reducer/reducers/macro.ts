import * as b from '../../char/builders';
import * as t from '../../char/types';

import * as PathUtils from '../path-utils';
import * as SelectionUtils from '../selection-utils';

import type { State } from '../types';

export const startMacro = (state: State): State => {
  // case to handle:
  // - pressing '\' should insert a new macro node and move
  //   the cursor into it
  // - what about pressing '\' inside an existing macro

  // other thoughts:
  // - it would be nice for insert-char to not know about how
  //   to complete a macro, should we introduce the idea of modes?
  // - there's also the case of shared logic across many reducers
  //   when inserting a new node that replaces the existing selection

  const { row, selection } = state;
  const newNode = b.macro([]);

  const { focus } = selection;
  const { start, end } = SelectionUtils.getPathAndRange(selection);

  const newRow = PathUtils.updateRowAtPath(row, focus.path, (node) => {
    const beforeSelection = node.children.slice(0, start);
    const afterSelection = node.children.slice(end);
    return {
      ...node,
      children: [...beforeSelection, newNode, ...afterSelection],
    };
  });

  if (newRow === row) {
    return state;
  }

  const newFocus = {
    path: [...focus.path, start, 0],
    offset: 0,
  };
  console.log(newFocus);

  return {
    ...state,
    row: newRow,
    selection: { anchor: newFocus, focus: newFocus },
  };
};

const macros: Record<string, string> = {
  // greek uppercase
  Alpha: '\u0391',
  Beta: '\u0392',
  Gamma: '\u0393',
  Delta: '\u0394',
  Epsilon: '\u0395',
  Zeta: '\u0396',
  Eta: '\u0397',
  Theta: '\u0398',
  Iota: '\u0399',
  Kappa: '\u039A',
  Lambda: '\u039B',
  Mu: '\u039C',
  Nu: '\u039D',
  Xi: '\u039E',
  Omicron: '\u039F',
  Pi: '\u03A0',
  Rho: '\u03A1',
  Sigma: '\u03A3',
  Tau: '\u03A4',
  Upsilon: '\u03A5',
  Phi: '\u03A6',
  Chi: '\u03A7',
  Psi: '\u03A8',
  Omega: '\u03A9',

  // greek lowercase
  alpha: '\u03B1',
  beta: '\u03B2',
  gamma: '\u03B3',
  delta: '\u03B4',
  epsilon: '\u03B5',
  zeta: '\u03B6',
  eta: '\u03B7',
  theta: '\u03B8',
  iota: '\u03B9',
  kappa: '\u03BA',
  lambda: '\u03BB',
  mu: '\u03BC',
  nu: '\u03BD',
  xi: '\u03BE',
  omicron: '\u03BF',
  pi: '\u03C0',
  rho: '\u03C1',
  sigma: '\u03C3',
  tau: '\u03C4',
  upsilon: '\u03C5',
  phi: '\u03C6',
  chi: '\u03C7',
  psi: '\u03C8',
  omega: '\u03C9',

  // operators
  in: '\u2208',
  notin: '\u2209',
  ni: '\u220B',
  niton: '\u220C',
  infty: '\u221E',
  int: '\u222B',
  iint: '\u222C',
  iiint: '\u222D',
  neq: '\u2260',
  leq: '\u2264',
  geq: '\u2265',
  lt: '<',
  gt: '>',
  leftarrow: '\u2190',
  rightarrow: '\u2192',
  uparrow: '\u2191',
  downarrow: '\u2193',

  // operators (TODO):
  // - trig: sin, cos, tan, etc.
  // - logarithmic: log, ln, lg
  // For these we need to call out to the appropriate reducer
  // - sqrt
  // - frac
  // - sum
  // - prod
  // - lim
};

const isCharAtom = (node: t.CharNode): node is t.CharAtom => {
  return node.type === 'char';
};

export const completeMacro = (state: State): State => {
  // bail if we've got something selected
  if (!SelectionUtils.isCollapsed(state.selection)) {
    return state;
  }

  const path = state.selection.focus.path;
  if (path.length > 1) {
    const parentPath = path.slice(0, -1);
    const parentNode = PathUtils.getNodeAtPath(state.row, parentPath);

    if (parentNode?.type === 'macro') {
      const grandparentPath = path.slice(0, -2);
      const grandparentNode = PathUtils.getNodeAtPath(
        state.row,
        grandparentPath,
      );

      if (grandparentNode && 'children' in grandparentNode) {
        const index = grandparentNode.children.findIndex(
          (node) => parentNode === node,
        );

        const macroString = parentNode.children[0].children
          .filter(isCharAtom)
          .map((node) => node.value)
          .join('');

        const macroValue = macros[macroString];

        if (!macroValue) {
          return state;
        }

        const newRow = PathUtils.updateRowAtPath(
          state.row,
          grandparentPath,
          (node) => {
            const newNode = b.char(macroValue);
            const beforeMacro = node.children.slice(0, index);
            const afterMacro = node.children.slice(index + 1);
            return {
              ...node,
              children: [...beforeMacro, newNode, ...afterMacro],
            };
          },
        );

        if (newRow !== state.row) {
          const newFocus = {
            path: grandparentPath,
            offset: index + 1,
          };

          return {
            ...state,
            row: newRow,
            selection: { anchor: newFocus, focus: newFocus },
          };
        }
      }
    }
  }

  return state;
};
