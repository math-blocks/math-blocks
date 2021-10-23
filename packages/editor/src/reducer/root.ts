import { getId } from '@math-blocks/core';

import * as builders from '../char/builders';

import * as util from './util';
import type { Zipper, Focus, Breadcrumb, State } from './types';

export const root = (state: State, withIndex: boolean): State => {
  const zipper = state.zipper;
  const { selection } = zipper.row;

  const focus: Focus = withIndex
    ? {
        id: getId(),
        type: 'zroot',
        left: [],
        right: [builders.row([])],
        style: {},
      }
    : {
        id: getId(),
        type: 'zroot',
        left: [null],
        right: [],
        style: {},
      };

  const crumb: Breadcrumb = {
    row: {
      type: 'bcrow',
      id: zipper.row.id,
      left: zipper.row.left,
      right: zipper.row.right,
      style: zipper.row.style,
    },
    focus,
  };

  const newZipper: Zipper = {
    ...zipper,
    breadcrumbs: [...zipper.breadcrumbs, crumb],
    row: util.zrow(getId(), selection, []),
  };

  return {
    startZipper: newZipper,
    endZipper: newZipper,
    zipper: newZipper,
    selecting: false,
  };
};
