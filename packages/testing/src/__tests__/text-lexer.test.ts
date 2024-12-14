import { lex, Token } from '../text-lexer';

const printToken = (token: Token): string => {
  switch (token.type) {
    case 'identifier':
      return `${token.type}:${token.name}`;
    case 'number':
      return `${token.type}:${token.value}`;
    default:
      return token.type;
  }
};

const printTokens = (tokens: readonly Token[]): string => {
  return tokens.map(printToken).join(', ');
};

describe('TextLexer', () => {
  it('should parse numbers and plus signs', () => {
    const tokens = lex('1 + 2 + 3');
    expect(tokens.map(printToken)).toMatchInlineSnapshot(`
      [
        "number:1",
        "plus",
        "number:2",
        "plus",
        "number:3",
      ]
    `);
  });

  it('should parse identifiers and minus signs', () => {
    const tokens = lex('a - b');
    expect(tokens.map(printToken)).toMatchInlineSnapshot(`
      [
        "identifier:a",
        "minus",
        "identifier:b",
      ]
    `);
  });

  it('should parse parens', () => {
    const tokens = lex('(a + b)');
    expect(tokens.map(printToken)).toMatchInlineSnapshot(`
      [
        "lparen",
        "identifier:a",
        "plus",
        "identifier:b",
        "rparen",
      ]
    `);
  });

  it.each`
    input      | output
    ${'a = b'} | ${'identifier:a, eq, identifier:b'}
    ${'a < b'} | ${'identifier:a, lt, identifier:b'}
    ${'a ≤ b'} | ${'identifier:a, lte, identifier:b'}
    ${'a > b'} | ${'identifier:a, gt, identifier:b'}
    ${'a ≥ b'} | ${'identifier:a, gte, identifier:b'}
  `(
    'should parse numeric relations - $input -> $output',
    ({ input, output }) => {
      const tokens = lex(input);
      expect(printTokens(tokens)).toEqual(output);
    },
  );
});
