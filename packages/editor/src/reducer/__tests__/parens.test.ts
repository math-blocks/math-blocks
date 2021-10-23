import { toEqualEditorNodes, row, delimited, zrow } from '../test-util';
import { parens } from '../parens';
import { moveLeft } from '../move-left';
import { moveRight } from '../move-right';
import * as builders from '../../char/builders';

import type { Zipper, State } from '../types';

expect.extend({ toEqualEditorNodes });

describe('parens', () => {
  describe('selection', () => {
    test("'(' wraps selection in non-pending parens", () => {
      const zipper: Zipper = {
        row: {
          id: 0,
          type: 'zrow',
          left: row('2').children,
          selection: [],
          right: row('x+5=10').children,
          style: {},
        },
        breadcrumbs: [],
      };
      let state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: true,
      };

      state = moveRight(moveRight(moveRight(state)));

      const { startZipper: result } = parens(state, '(');

      expect(result.row.left).toEqualEditorNodes([]);
      expect(result.row.right).toEqualEditorNodes(row('x+5').children);
      expect(result.breadcrumbs[0].row.left).toEqualEditorNodes([
        builders.char('2'),
      ]);
      expect(result.breadcrumbs[0].row.right).toEqualEditorNodes([
        builders.char('='),
        builders.char('1'),
        builders.char('0'),
      ]);
    });

    test("')' wraps selection in non-pending parens", () => {
      const zipper: Zipper = {
        row: {
          id: 0,
          type: 'zrow',
          left: row('2').children,
          selection: [],
          right: row('x+5=10').children,
          style: {},
        },
        breadcrumbs: [],
      };
      let state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: true,
      };

      state = moveRight(moveRight(moveRight(state)));

      const { startZipper: result } = parens(state, ')');

      expect(result.row.left).toEqualEditorNodes([
        builders.char('2'),
        builders.delimited(
          [builders.char('x'), builders.char('+'), builders.char('5')],
          builders.char('('),
          builders.char(')'),
        ),
      ]);
      expect(result.row.right).toEqualEditorNodes(row('=10').children);
    });
  });

  describe('no selection', () => {
    test("empty row, '('", () => {
      const zipper: Zipper = {
        row: zrow([], []),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(state, '(');

      expect(result.row.left).toEqualEditorNodes([]);
      expect(result.row.right).toEqualEditorNodes([]);
      expect(result.breadcrumbs).toHaveLength(1);
      expect(result.breadcrumbs[0].focus.type).toEqual('zdelimited');
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.leftDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[0].focus.leftDelim).toMatchInlineSnapshot(`
                Object {
                  "pending": undefined,
                  "style": Object {},
                  "type": "char",
                  "value": "(",
                }
            `);
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.rightDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[0].focus.rightDelim).toMatchInlineSnapshot(`
                Object {
                  "pending": true,
                  "style": Object {},
                  "type": "char",
                  "value": ")",
                }
            `);
    });

    test("empty row, ')'", () => {
      const zipper: Zipper = {
        row: zrow([], []),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(state, ')');

      expect(result.row.left).toEqualEditorNodes([
        builders.delimited([], builders.char('(', true), builders.char(')')),
      ]);
    });

    test("non-empty row, '(' at start", () => {
      const zipper: Zipper = {
        row: zrow([], row('2x+5').children),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(state, '(');

      expect(result.row.left).toEqualEditorNodes([]);
      expect(result.row.right).toEqualEditorNodes(row('2x+5').children);
      expect(result.breadcrumbs).toHaveLength(1);
      expect(result.breadcrumbs[0].focus.type).toEqual('zdelimited');
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.leftDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[0].focus.leftDelim).toMatchInlineSnapshot(`
                Object {
                  "pending": undefined,
                  "style": Object {},
                  "type": "char",
                  "value": "(",
                }
            `);
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.rightDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[0].focus.rightDelim).toMatchInlineSnapshot(`
                Object {
                  "pending": true,
                  "style": Object {},
                  "type": "char",
                  "value": ")",
                }
            `);
    });

    test("non-empty row, ')' at end", () => {
      const zipper: Zipper = {
        row: zrow(row('2x+5').children, []),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(state, ')');

      expect(result.row.left).toEqualEditorNodes([
        builders.delimited(
          row('2x+5').children,
          builders.char('(', true),
          builders.char(')'),
        ),
      ]);
      expect(result.row.right).toEqualEditorNodes([]);
    });

    test("inside existing parens, '(' at start", () => {
      const zipper: Zipper = {
        row: zrow([], [delimited('2x+5')]),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(moveRight(state), '(');

      expect(result.row.left).toEqualEditorNodes([]);
      expect(result.row.right).toEqualEditorNodes(row('2x+5').children);
      expect(result.breadcrumbs).toHaveLength(2);
      expect(result.breadcrumbs[0].focus.type).toEqual('zdelimited');
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.leftDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[1].focus.leftDelim).toMatchInlineSnapshot(`
                Object {
                  "id": 98,
                  "pending": undefined,
                  "style": Object {},
                  "type": "char",
                  "value": "(",
                }
            `);
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.rightDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[1].focus.rightDelim).toMatchInlineSnapshot(`
                Object {
                  "id": 99,
                  "pending": true,
                  "style": Object {},
                  "type": "char",
                  "value": ")",
                }
            `);
    });

    test("inside existing parens, ')' at end", () => {
      const zipper: Zipper = {
        row: zrow([delimited('2x+5')], []),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(moveLeft(state), ')');

      expect(result.row.left).toEqualEditorNodes([
        builders.delimited(
          row('2x+5').children,
          builders.char('(', true),
          builders.char(')'),
        ),
      ]);
      expect(result.breadcrumbs).toHaveLength(1);
      expect(result.breadcrumbs[0].focus.type).toEqual('zdelimited');
    });

    test("outside existing parens, '(' at start", () => {
      const zipper: Zipper = {
        row: zrow(
          [],
          [
            builders.char('2'),
            delimited('x+5'),
            builders.char('='),
            builders.char('1'),
            builders.char('0'),
          ],
        ),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(state, '(');

      expect(result.row.left).toEqualEditorNodes([]);
      expect(result.row.right).toEqualEditorNodes([
        builders.char('2'),
        delimited('x+5'),
        builders.char('='),
        builders.char('1'),
        builders.char('0'),
      ]);
      expect(result.breadcrumbs).toHaveLength(1);
      expect(result.breadcrumbs[0].focus.type).toEqual('zdelimited');
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.leftDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[0].focus.leftDelim).toMatchInlineSnapshot(`
                Object {
                  "pending": undefined,
                  "style": Object {},
                  "type": "char",
                  "value": "(",
                }
            `);
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.rightDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[0].focus.rightDelim).toMatchInlineSnapshot(`
                Object {
                  "pending": true,
                  "style": Object {},
                  "type": "char",
                  "value": ")",
                }
            `);
    });

    test("outside existing parens, ')' at end", () => {
      const zipper: Zipper = {
        row: zrow(
          [
            builders.char('2'),
            delimited('x+5'),
            builders.char('='),
            builders.char('1'),
            builders.char('0'),
          ],
          [],
        ),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(state, ')');

      expect(result.row.left).toEqualEditorNodes([
        builders.delimited(
          [
            builders.char('2'),
            delimited('x+5'),
            builders.char('='),
            builders.char('1'),
            builders.char('0'),
          ],
          builders.char('(', true),
          builders.char(')'),
        ),
      ]);
      expect(result.row.right).toEqualEditorNodes([]);
      expect(result.breadcrumbs).toHaveLength(0);
    });

    test("add matching paren, ')'", () => {
      const zipper: Zipper = {
        row: zrow(
          [
            builders.delimited(
              row('2x+5').children,
              builders.char('('),
              builders.char(')', true),
            ),
          ],
          [],
        ),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(state, ')');

      expect(result.row.left).toEqualEditorNodes([
        builders.delimited(
          row('2x+5').children,
          builders.char('('),
          builders.char(')', false),
        ),
      ]);
      expect(result.breadcrumbs).toHaveLength(0);
    });

    test("add matching paren, '('", () => {
      const zipper: Zipper = {
        row: zrow(
          [],
          [
            builders.delimited(
              row('2x+5').children,
              builders.char('(', true),
              builders.char(')'),
            ),
          ],
        ),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(state, '(');

      expect(result.row.left).toEqualEditorNodes([]);
      expect(result.row.right).toEqualEditorNodes(row('2x+5').children);
      expect(result.breadcrumbs).toHaveLength(1);
      expect(result.breadcrumbs[0].focus.type).toEqual('zdelimited');
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.leftDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[0].focus.leftDelim).toMatchInlineSnapshot(`
                Object {
                  "pending": false,
                  "style": Object {},
                  "type": "char",
                  "value": "(",
                }
            `);
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.rightDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[0].focus.rightDelim).toMatchInlineSnapshot(`
                Object {
                  "pending": undefined,
                  "style": Object {},
                  "type": "char",
                  "value": ")",
                }
            `);
    });

    test('start absolute value', () => {
      const zipper: Zipper = {
        row: zrow([], row('2x+5').children),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(moveRight(state), '|');

      expect(result.row.left).toEqualEditorNodes([]);
      expect(result.row.right).toEqualEditorNodes(row('x+5').children);
      expect(result.breadcrumbs).toHaveLength(1);
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.leftDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[0].focus.leftDelim).toMatchInlineSnapshot(`
                Object {
                  "pending": undefined,
                  "style": Object {},
                  "type": "char",
                  "value": "|",
                }
            `);
      // @ts-expect-error: we're not bothering to refine focus
      delete result.breadcrumbs[0].focus.rightDelim.id;
      // @ts-expect-error: we're not bothering to refine focus
      expect(result.breadcrumbs[0].focus.rightDelim).toMatchInlineSnapshot(`
                Object {
                  "pending": true,
                  "style": Object {},
                  "type": "char",
                  "value": "|",
                }
            `);
    });

    test('finish absolute value', () => {
      const zipper: Zipper = {
        row: zrow([], row('2x+5').children),
        breadcrumbs: [],
      };
      const state: State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
      };

      const { startZipper: result } = parens(
        moveRight(parens(moveRight(state), '|')),
        '|',
      );

      expect(result.row.left).toEqualEditorNodes([
        builders.char('2'),
        builders.delimited(
          [builders.char('x')],
          builders.char('|'),
          builders.char('|', false),
        ),
      ]);
      expect(result.row.right).toEqualEditorNodes(row('+5').children);
    });
  });
});
