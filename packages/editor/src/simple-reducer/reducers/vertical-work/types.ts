import * as types from '../../../char/types';

export type Column = readonly types.CharRow[];

export type VerticalWork = {
  readonly columns: readonly Column[];
  readonly colCount: number;
  readonly rowCount: number;
  readonly cursorId: number; // id of the cell that the cursor resides in
  readonly cursorIndex: number; // index of the cursor in its cell's row
  // readonly cursorRowIndex: number;
  // readonly cursorColIndex: number;

  readonly delimiters?: types.CharTable['delimiters'];
  readonly rowStyles?: types.CharTable['rowStyles'];
  readonly colStyles?: types.CharTable['colStyles'];

  readonly id: types.CharTable['id'];
  readonly type: types.CharTable['type'];
  readonly subtype: types.CharTable['subtype'];
  readonly style: types.CharTable['style'];
};
