import * as builders from '../char/builders';

import * as util from './util';
import { verticalWork } from './vertical-work/reducer';

import type { Zipper, State } from './types';

// TODO: place cursor in lower limits
const LIMIT_CHARS = [
  '\u03a3', // \sum
  '\u03a0', // \prod
  '\u222B', // \int
  // TODO: handle \lim (need to make sure we exclude the upper limit)
];

export const insertChar = (state: State, char: string): State => {
  const zipper = state.zipper;
  const { left, selection } = zipper.row;
  let newNode;
  if (LIMIT_CHARS.includes(char)) {
    newNode = builders.limits(builders.char(char), [], []);
  } else {
    newNode = builders.char(char);
  }

  if (selection.length > 0) {
    // When inserting limits, we move the current selection to the right
    // of the new node.
    const newLeft = LIMIT_CHARS.includes(char)
      ? [...left, newNode, ...selection]
      : [...left, newNode];

    const newZipper: Zipper = {
      ...zipper,
      row: {
        ...zipper.row,
        selection: [],
        left: newLeft,
      },
    };
    return {
      startZipper: newZipper,
      endZipper: newZipper,
      zipper: newZipper,
      selecting: false,
    };
  }

  const { breadcrumbs } = state.zipper;
  const crumb = breadcrumbs[breadcrumbs.length - 1];
  if (crumb?.focus.type === 'ztable' && crumb.focus.subtype === 'algebra') {
    const result = verticalWork(state, { type: 'InsertChar', char: char });
    if (result !== state) {
      return result;
    }
  }

  const newZipper: Zipper = {
    ...zipper,
    row: {
      ...zipper.row,
      left: [...left, newNode],
    },
  };

  return util.zipperToState(newZipper);
};
