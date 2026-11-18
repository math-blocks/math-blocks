import type { Mutable } from 'utility-types';

import { parseTopDictData } from '../tables/cff';
import type { TopDict } from '../tables/cff-types';

const emptyStringIndex = {
  count: 0,
  offSize: 1,
  offsets: [1],
  data: new Uint8Array(),
};

// Each entry is one operand or operator, as the bytes it's encoded with.
const parseDict = (
  entries: readonly (readonly number[])[],
): Mutable<TopDict> => {
  const dict = {} as Mutable<TopDict>;
  parseTopDictData(new Uint8Array(entries.flat()), dict, emptyStringIndex);
  return dict;
};

describe('parseTopDictData', () => {
  describe('operand 28 (int16)', () => {
    test('negative values are sign-extended', () => {
      // This is how fontTools encodes STIX Two Math's FontBBox when it
      // subsets the font.
      const dict = parseDict([
        [28, 0xfc, 0x2e], // -978
        [28, 0xf9, 0x97], // -1641
        [28, 0x0c, 0x00], // 3072
        [28, 0x0a, 0x43], // 2627
        [5], // FontBBox
      ]);

      expect(dict.FontBBox).toEqual([-978, -1641, 3072, 2627]);
    });

    test('the int16 range limits are decoded correctly', () => {
      const dict = parseDict([
        [28, 0x80, 0x00], // -32768
        [20], // defaultWidthX
        [28, 0x7f, 0xff], // 32767
        [21], // nominalWidthX
      ]);

      expect(dict.defaultWidthX).toEqual(-32768);
      expect(dict.nominalWidthX).toEqual(32767);
    });
  });
});
