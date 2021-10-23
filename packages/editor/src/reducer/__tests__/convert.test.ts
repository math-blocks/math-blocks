import * as builders from '../../char/builders';

import { zipperToRow } from '../convert';
import { row, toEqualEditorNodes, zrow } from '../test-util';

import type { Zipper } from '../types';

expect.extend({ toEqualEditorNodes });

describe('zipperToRow', () => {
  describe('no breadcrumbs', () => {
    test('empty zipper', () => {
      const zipper: Zipper = {
        row: zrow([], []),
        breadcrumbs: [],
      };

      const row = zipperToRow(zipper);

      expect(row.children).toEqualEditorNodes([]);
    });

    test('zipper with no breadcrumbs and no selection', () => {
      const zipper: Zipper = {
        row: zrow(row('1+').children, row('2').children),
        breadcrumbs: [],
      };

      const result = zipperToRow(zipper);

      expect(result.children).toEqualEditorNodes(row('1+2').children);
    });

    test('zipper with selection but no breadcrumbs', () => {
      const zipper: Zipper = {
        row: {
          id: 0,
          type: 'zrow',
          left: row('1').children,
          selection: row('+').children,
          right: row('2').children,
          style: {},
        },
        breadcrumbs: [],
      };

      const result = zipperToRow(zipper);

      expect(result.children).toEqualEditorNodes(row('1+2').children);
    });
  });

  describe('with breadcrumbs', () => {
    test('no selection', () => {
      const zipper: Zipper = {
        // numerator
        row: zrow(row('2').children, []),
        breadcrumbs: [
          {
            // root row
            row: {
              id: 0,
              type: 'bcrow',
              left: row('1+').children,
              right: row('+4').children,
              style: {},
            },
            // denominator
            focus: {
              id: 2,
              type: 'zfrac',
              left: [],
              right: [row('3')],
              style: {},
            },
          },
        ],
      };

      const result = zipperToRow(zipper);

      expect(result.children).toEqualEditorNodes(
        builders.row([
          builders.char('1'),
          builders.char('+'),
          builders.frac(row('2').children, row('3').children),
          builders.char('+'),
          builders.char('4'),
        ]).children,
      );
    });
  });
});
