import * as builders from '../../../char/builders';
import { State } from '../../types';
import { moveVertically } from '../move-vertically';

type Cursor = {
  readonly offset: number;
  readonly path: readonly number[];
};

describe('moveVertically', () => {
  describe('frac', () => {
    it('should move down from numerator to denominator in a fraction', () => {
      const row = builders.row([
        builders.frac([builders.char('a')], [builders.char('b')]),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [0, 0],
      };
      const state: State = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowDown' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 0,
        path: [0, 1],
      });
    });

    it('should move up from denominator to numerator in a fraction', () => {
      const row = builders.row([
        builders.frac([builders.char('a')], [builders.char('b')]),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [0, 1],
      };
      const state: State = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowUp' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 0,
        path: [0, 0],
      });
    });

    it('should use the original offset when moving down', () => {
      const row = builders.row([
        builders.frac([builders.char('a')], [builders.char('b')]),
      ]);
      const cursor: Cursor = {
        offset: 1,
        path: [0, 0],
      };
      const state: State = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowDown' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 1,
        path: [0, 1],
      });
    });

    it('should use the original offset when moving up', () => {
      const row = builders.row([
        builders.frac([builders.char('a')], [builders.char('b')]),
      ]);
      const cursor: Cursor = {
        offset: 1,
        path: [0, 1],
      };
      const state: State = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowUp' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 1,
        path: [0, 0],
      });
    });

    it('should not change state if it cannot move down', () => {
      const row = builders.row([
        builders.frac([builders.char('a')], [builders.char('b')]),
      ]);
      const cursor: Cursor = {
        offset: 1,
        path: [0, 1],
      };
      const state: State = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowDown' });

      expect(newState).toBe(state);
    });

    it('should not change state if it cannot move up', () => {
      const row = builders.row([
        builders.frac([builders.char('a')], [builders.char('b')]),
      ]);
      const cursor: Cursor = {
        offset: 1,
        path: [0, 0],
      };
      const state: State = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowUp' });

      expect(newState).toBe(state);
    });
  });

  describe('table (matrix)', () => {
    it('should move down in a matrix', () => {
      const row = builders.row([
        builders.matrix(
          [
            builders.row([builders.char('a')]),
            builders.row([builders.char('b')]),
            builders.row([builders.char('c')]),
            builders.row([builders.char('d')]),
          ],
          2,
          2,
        ),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [0, 0],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowDown' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 0,
        path: [0, 2],
      });
    });

    it('should move up in a matrix', () => {
      const row = builders.row([
        builders.matrix(
          [
            builders.row([builders.char('a')]),
            builders.row([builders.char('b')]),

            builders.row([builders.char('c')]),
            builders.row([builders.char('d')]),
          ],
          2,
          2,
        ),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [0, 2],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowUp' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 0,
        path: [0, 0],
      });
    });

    it('should not move down if the cursor is in the bottom row', () => {
      const row = builders.row([
        builders.matrix(
          [
            builders.row([builders.char('a')]),
            builders.row([builders.char('b')]),
            builders.row([builders.char('c')]),
            builders.row([builders.char('d')]),
          ],
          2,
          2,
        ),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [0, 2],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowDown' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 0,
        path: [0, 2],
      });
    });

    it('should not move up if the cursor is in the top row', () => {
      const row = builders.row([
        builders.matrix(
          [
            builders.row([builders.char('a')]),
            builders.row([builders.char('b')]),
            builders.row([builders.char('c')]),
            builders.row([builders.char('d')]),
          ],
          2,
          2,
        ),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [0, 0],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowUp' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 0,
        path: [0, 0],
      });
    });
  });

  describe('sub', () => {
    it('moving up should place the cursor before the sub', () => {
      const row = builders.row([
        builders.row([builders.char('x')]),
        builders.subsup([builders.char('n')]),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [1, 0],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowUp' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 1,
        path: [],
      });
    });

    it('moving up should place the cursor after the sub', () => {
      const row = builders.row([
        builders.row([builders.char('x')]),
        builders.subsup([builders.char('n')]),
      ]);
      const cursor: Cursor = {
        offset: 1,
        path: [1, 0],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowUp' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 2,
        path: [],
      });
    });

    it('should do nothing if you cannot move down', () => {
      const row = builders.row([
        builders.row([builders.char('x')]),
        builders.subsup([builders.char('n')]),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [1, 0],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowDown' });

      expect(newState).toBe(state);
    });
  });

  describe('sup', () => {
    it('moving down should place the cursor before the sub', () => {
      const row = builders.row([
        builders.row([builders.char('x')]),
        builders.subsup(undefined, [builders.char('2')]),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [1, 1],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowDown' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 1,
        path: [],
      });
    });

    it('moving down should place the cursor after the sub', () => {
      const row = builders.row([
        builders.row([builders.char('x')]),
        builders.subsup(undefined, [builders.char('2')]),
      ]);
      const cursor: Cursor = {
        offset: 1,
        path: [1, 1],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowDown' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 2,
        path: [],
      });
    });

    it('should do nothing if you cannot move up', () => {
      const row = builders.row([
        builders.row([builders.char('x')]),
        builders.subsup(undefined, [builders.char('2')]),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [1, 1],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowUp' });

      expect(newState).toBe(state);
    });
  });

  describe('subsup', () => {
    it('moving down should move the cursor to the start of the sub', () => {
      const row = builders.row([
        builders.row([builders.char('x')]),
        builders.subsup([builders.char('n')], [builders.char('2')]),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [1, 1],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowDown' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 0,
        path: [1, 0],
      });
    });

    it('moving down should place the cursor at the end of the sub', () => {
      const row = builders.row([
        builders.row([builders.char('x')]),
        builders.subsup([builders.char('n')], [builders.char('2')]),
      ]);
      const cursor: Cursor = {
        offset: 1,
        path: [1, 1],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowDown' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 1,
        path: [1, 0],
      });
    });

    it('moving up should move the cursor to the start of the sup', () => {
      const row = builders.row([
        builders.row([builders.char('x')]),
        builders.subsup([builders.char('n')], [builders.char('2')]),
      ]);
      const cursor: Cursor = {
        offset: 0,
        path: [1, 0],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowUp' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 0,
        path: [1, 1],
      });
    });

    it('moving up should place the cursor at the end of the sup', () => {
      const row = builders.row([
        builders.row([builders.char('x')]),
        builders.subsup([builders.char('n')], [builders.char('2')]),
      ]);
      const cursor: Cursor = {
        offset: 1,
        path: [1, 0],
      };
      const state = {
        row,
        selection: { anchor: cursor, focus: cursor },
        selecting: false,
      };

      const newState = moveVertically(state, { type: 'ArrowUp' });

      expect(newState.selection.focus).toEqual<Cursor>({
        offset: 1,
        path: [1, 1],
      });
    });
  });
});
