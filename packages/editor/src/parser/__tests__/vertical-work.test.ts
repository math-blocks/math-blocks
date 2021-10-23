import * as types from '../../token/types';
import * as builders from '../../char/builders';
import { coalesceColumns } from '../vertical-work';
import { lexRow } from '../lexer';

const strToTokenRow = (str: string): types.TokenRow => {
  const chars = [...str].map((char) => builders.char(char));
  return lexRow(builders.row(chars));
};

describe('coalesceColumns', () => {
  it('should coalesce operator columns with the next column', () => {
    const result = coalesceColumns([
      [strToTokenRow('2x'), strToTokenRow(''), strToTokenRow('2x')],
      [strToTokenRow('+'), strToTokenRow('\u2212'), strToTokenRow('')],
      [strToTokenRow('5'), strToTokenRow('5'), strToTokenRow('')],
    ]);

    expect(result).toHaveLength(2);
    // NOTE: we don't use strToTokenRow("+5") since that'll affect the `loc` values
    expect(result[1][0].children).toEqual([
      ...strToTokenRow('+').children,
      ...strToTokenRow('5').children,
    ]);
    expect(result[1][1].children).toEqual([
      ...strToTokenRow('\u2212').children,
      ...strToTokenRow('5').children,
    ]);
  });

  it('should ignore empty columns', () => {
    const result = coalesceColumns([
      [strToTokenRow('2x'), strToTokenRow(''), strToTokenRow('2x')],
      [strToTokenRow(''), strToTokenRow(''), strToTokenRow('')],
      [strToTokenRow('5'), strToTokenRow('5'), strToTokenRow('')],
    ]);

    expect(result).toHaveLength(2);
  });

  it('should handle operations in the first column', () => {
    const result = coalesceColumns([
      [strToTokenRow(''), strToTokenRow('\u2212'), strToTokenRow('')],
      [strToTokenRow('2x'), strToTokenRow('2x'), strToTokenRow('')],
    ]);

    expect(result).toHaveLength(1);
    expect(result[0][0].children).toEqual(strToTokenRow('2x').children);
    expect(result[0][1].children).toEqual([
      ...strToTokenRow('\u2212').children,
      ...strToTokenRow('2x').children,
    ]);
  });

  it("should not create a cell with a lone `+` when 'actions' starts with `5 + `", () => {
    const result = coalesceColumns([
      [strToTokenRow(''), strToTokenRow('5'), strToTokenRow('5')],
      [strToTokenRow(''), strToTokenRow('+'), strToTokenRow('+')],
      [strToTokenRow('2x'), strToTokenRow(''), strToTokenRow('2x')],
    ]);

    expect(result).toHaveLength(2);
    expect(result[0][1].children).toEqual(strToTokenRow('5').children);
    expect(result[1][1].children).toEqual(strToTokenRow('').children);
  });
});
