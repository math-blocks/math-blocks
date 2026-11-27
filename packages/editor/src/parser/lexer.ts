/**
 * Lexer - converts an editor node tree with char leaves to one with token leaves.
 *
 * Each char contains a single character string whereas tokens can be one of the following:
 * - numbers
 * - identifiers
 * - symbols
 */
import { UnreachableCaseError } from '@math-blocks/core';
import type { OneOrMore } from '@math-blocks/core';

import * as types from '../char/types';

import { WORD_OPERATORS } from './functions';

import { TokenKind } from '../token/types';
import { NodeType } from '../shared-types';

import {
  Token,
  TokenNode,
  TokenRow,
  TokenAtom,
  SourceLocation,
} from '../token/types';

export const location = (
  path: readonly number[],
  start: number,
  end: number,
): SourceLocation => ({
  path,
  start,
  end,
});

export const atom = (token: Token, loc: SourceLocation): TokenAtom => ({
  ...token,
  loc,
});

export const identifier = (name: string, loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Identifier, value: name }, loc);

export const number = (value: string, loc: SourceLocation): TokenAtom => {
  if (isNaN(parseFloat(value))) {
    throw new Error(`${value} is not a number`);
  }
  return atom({ type: 'token', name: TokenKind.Number, value }, loc);
};

export const plus = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Plus }, loc);

export const minus = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Minus }, loc);

export const plusminus = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.PlusMinus }, loc);

export const times = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Times }, loc);

export const lparens = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.LeftParens }, loc);

export const rparens = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.RightParens }, loc);

export const ellipsis = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Ellipsis }, loc);

export const eq = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Equal }, loc);

export const lt = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.LessThan }, loc);

export const lte = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.LessThanOrEqual }, loc);

export const gt = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.GreaterThan }, loc);

export const gte = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.GreaterThanOrEqual }, loc);

export const comma = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Comma }, loc);

export const divide = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Divide }, loc);

export const neq = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.NotEqual }, loc);

export const verticalbar = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.VerticalBar }, loc);

export const minusplus = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.MinusPlus }, loc);

export const elementOf = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.ElementOf }, loc);

export const notElementOf = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.NotElementOf }, loc);

export const contains = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Contains }, loc);

export const notContains = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.NotContains }, loc);

export const subset = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Subset }, loc);

export const properSubset = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.ProperSubset }, loc);

export const superset = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Superset }, loc);

export const properSuperset = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.ProperSuperset }, loc);

export const union = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Union }, loc);

export const intersection = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.Intersection }, loc);

export const rightArrow = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.RightArrow }, loc);

export const summation = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.SummationOperator }, loc);

export const product = (loc: SourceLocation): TokenAtom =>
  atom({ type: 'token', name: TokenKind.ProductOperator }, loc);

type TokenBuilder = (loc: SourceLocation) => TokenAtom;

// Every single char that becomes a token with no value.  This is the only
// place such a symbol is listed.  `⊂` and `⊃` are proper subsets and
// supersets, and `⊆` and `⊇` are subsets and supersets that may be equal, as
// in OpenMath's set1 content dictionary.
const SYMBOL_TOKENS: ReadonlyMap<string, TokenBuilder> = new Map([
  ['+', plus],
  // Both the minus sign (U+2212) and the ASCII hyphen-minus are lexed as
  // minus.
  ['\u2212', minus], // −
  ['-', minus],
  ['\u00B1', plusminus], // ±
  ['\u2213', minusplus], // ∓
  ['*', times],
  ['\u00B7', times], // · middle dot (interpunct)
  ['\u00D7', times], // × multiplication sign
  ['\u22C5', times], // ⋅ dot operator
  ['\u00F7', divide], // ÷
  ['=', eq],
  ['\u2260', neq], // ≠
  ['<', lt],
  ['\u2264', lte], // ≤
  ['>', gt],
  ['\u2265', gte], // ≥
  [',', comma],
  ['(', lparens],
  [')', rparens],
  ['\u2208', elementOf], // ∈
  ['\u2209', notElementOf], // ∉
  ['\u220B', contains], // ∋
  ['\u220C', notContains], // ∌
  ['\u2286', subset], // ⊆
  ['\u2282', properSubset], // ⊂
  ['\u2287', superset], // ⊇
  ['\u2283', properSuperset], // ⊃
  ['\u222A', union], // ∪
  ['\u2229', intersection], // ∩
  ['\u2192', rightArrow], // →
  // `Tex.parse` and the editor use the n-ary summation and product signs,
  // but the Greek capitals Σ and Π are also accepted as the operator of a
  // limits node, see `lex`.
  ['\u2211', summation], // ∑
  ['\u220F', product], // ∏
  // Three `.` chars in a row are also an ellipsis, see `tokenizeChars`.
  ['\u2026', ellipsis], // … (\ldots)
  ['\u22EF', ellipsis], // ⋯ (\cdots)
]);

/**
 * Throws an error saying that `symbol` isn't supported yet, with an optional
 * `hint` on what to use instead.  This is for symbols that are valid math,
 * but that the parser can't turn into a semantic node.
 */
export const unsupported = (symbol: string, hint?: string): never => {
  throw new Error(
    hint
      ? `'${symbol}' isn't supported yet, ${hint}`
      : `'${symbol}' isn't supported yet`,
  );
};

// Chars that are valid math but that the parser doesn't support yet, along
// with a hint for some of them.
const UNSUPPORTED_CHARS: Record<string, string | undefined> = {
  '/': 'use a fraction (\\frac in TeX) instead',
  '!': undefined,
  "'": undefined,
  '%': undefined,
  ':': undefined,
  ';': undefined,
  '[': undefined,
  ']': undefined,
  '{': undefined,
  '}': undefined,
  '\u2190': undefined, // ← \leftarrow
  '\u2191': undefined, // ↑ \uparrow
  '\u2193': undefined, // ↓ \downarrow
  '\u210D': undefined, // ℍ \H
  '\u2119': undefined, // ℙ \P
  '\u222B': undefined, // ∫ \int
  '\u222C': undefined, // ∬ \iint
  '\u222D': undefined, // ∭ \iiint
  '\u2248': undefined, // ≈ \approx
  '\u22A5': undefined, // ⊥ \perp
  '\u2225': undefined, // ∥ \parallel
  '\u2218': undefined, // ∘ \circ
};

/**
 * Options for lexing, see `ParseOptions` in parser.ts.
 */
export type LexOptions = {
  readonly requireBackslash?: boolean;
};

// The names of functions and operators, such as `sin`, `ln` or `mod`, that
// are recognized when they're typed one letter at a time, longest first.
// They're matched case-sensitively, and the longest name that matches wins,
// so `arcsin` isn't `a`, `r`, `c`, `sin`.  A name in a single char, such as
// the char that `Tex.parse` creates for `\ln`, is always a word.
const WORD_NAMES: readonly string[] = [...WORD_OPERATORS].sort(
  (a, b) => [...b].length - [...a].length,
);

// Symbols for constants that are lexed as identifiers: ∞, ∅, and the number
// sets ℕ, ℤ, ℚ, ℝ and ℂ.  The parser decides what each one means.
const CONSTANT_CHARS: ReadonlySet<string> = new Set([
  '\u221E', // ∞
  '\u2205', // ∅
  '\u2115', // ℕ
  '\u2124', // ℤ
  '\u211A', // ℚ
  '\u211D', // ℝ
  '\u2102', // ℂ
]);

/**
 * Returns whether `value` is a char that's lexed as a single-letter
 * identifier: a latin letter, a lowercase Greek letter, or a constant.
 * Capital Greek letters aren't identifiers.  Σ and Π are only accepted as
 * the operator of a limits node.
 */
const isIdentifierChar = (value: string): boolean =>
  /^[a-zA-Z\u03B1-\u03C9]$/.test(value) || CONSTANT_CHARS.has(value);

const isDigit = (value: string | undefined): boolean =>
  value !== undefined && /^[0-9]$/.test(value);

const isWhitespace = (value: string): boolean => /^\s$/.test(value);

/**
 * Throws an error naming `char`, a character the lexer doesn't recognize, or
 * saying that it isn't supported yet if it's valid math.  This is the only
 * place the lexer reports an unknown char.
 */
const unexpectedChar = (char: string): never => {
  if (char in UNSUPPORTED_CHARS) {
    unsupported(char, UNSUPPORTED_CHARS[char]);
  }
  const codePoint = char.codePointAt(0) ?? 0;
  const hex = codePoint.toString(16).toUpperCase().padStart(4, '0');
  throw new Error(`Unexpected character '${char}' (U+${hex})`);
};

// The operators of a limits node that are lexed as summation and product
// operators: the n-ary signs that `Tex.parse` and the editor create, and the
// Greek capitals.
const SUMMATION_CHARS = ['\u2211', '\u03a3'];
const PRODUCT_CHARS = ['\u220f', '\u03a0'];

// TODO: include ids of source chars in parsed tokens
// TODO: allow different decimal and list separators

/**
 * Converts a run of chars to tokens by scanning the chars one at a time.
 * Each token's location is the range of indices of its chars, plus `offset`,
 * the index of the first char in the run.
 *
 * - Whitespace ends a number or a word, but is never required between
 *   tokens, e.g. `sinx` is `sin`, `x` and `sin hx` is `sin`, `h`, `x`.
 * - A number is a run of digits with at most one decimal point, e.g. `12`,
 *   `1.5`, `.5` or `1.`.  A `.` that starts an ellipsis isn't part of the
 *   number, so `1...` is `1` followed by an ellipsis.
 * - Three `.` chars in a row are an ellipsis.
 * - Each symbol in `SYMBOL_TOKENS` is a token.
 * - Letters are single-letter identifiers, except that the longest name in
 *   `wordNames` that matches is a single identifier.  `wordNames` is empty
 *   when the `requireBackslash` option is set.
 *
 * Most chars hold a single character, but `Tex.parse` creates a single char
 * for each named function, e.g. "\\sin" becomes a char with the value "sin".
 * Those become a single identifier token.  The parser decides whether the
 * identifier is a function it knows about.
 */
const tokenizeChars = (
  chars: readonly types.Char[],
  path: readonly number[],
  offset: number,
  wordNames: readonly string[],
): readonly TokenAtom[] => {
  const tokens: TokenAtom[] = [];
  const valueAt = (index: number): string | undefined => chars[index]?.value;
  const loc = (start: number, end: number): SourceLocation =>
    location(path, offset + start, offset + end);
  const isEllipsisAt = (index: number): boolean =>
    valueAt(index) === '.' &&
    valueAt(index + 1) === '.' &&
    valueAt(index + 2) === '.';

  /**
   * Returns the index after the end of the number that starts at `start`.
   */
  const scanNumber = (start: number): number => {
    let i = start;
    while (isDigit(valueAt(i))) {
      i++;
    }
    // A `.` followed by another `.` might start an ellipsis, so the number
    // ends before it.
    if (valueAt(i) === '.' && valueAt(i + 1) !== '.') {
      i++;
      while (isDigit(valueAt(i))) {
        i++;
      }
      // Any `.` after the decimal point that doesn't start an ellipsis
      // would be a second decimal point, e.g. `1.2.3`.  Lexing that as
      // `1.2` followed by `.3` would silently change its meaning.
      if (valueAt(i) === '.' && !isEllipsisAt(i)) {
        let end = i;
        while (isDigit(valueAt(end)) || valueAt(end) === '.') {
          end++;
        }
        const text = chars
          .slice(start, end)
          .map((char) => char.value)
          .join('');
        throw new Error(`'${text}' has more than one decimal point`);
      }
    }
    return i;
  };

  /**
   * Returns the longest name in `wordNames` spelled out by the chars starting
   * at `start`, or undefined if there isn't one.  `wordNames` is sorted
   * longest first.
   */
  const matchFunctionName = (start: number): string | undefined =>
    wordNames.find((name) =>
      [...name].every((letter, j) => valueAt(start + j) === letter),
    );

  let i = 0;
  while (i < chars.length) {
    const { value } = chars[i];

    // Count code points rather than UTF-16 code units, so that a single char
    // outside the BMP, such as U+1D465, isn't mistaken for a function name.
    if ([...value].length > 1) {
      if (!/^[a-z]+$/i.test(value)) {
        throw new Error(`Unexpected symbol '${value}'`);
      }
      tokens.push(identifier(value, loc(i, i + 1)));
      i++;
      continue;
    }

    if (isWhitespace(value)) {
      i++;
      continue;
    }

    if (isDigit(value) || (value === '.' && isDigit(valueAt(i + 1)))) {
      const end = scanNumber(i);
      const text = chars
        .slice(i, end)
        .map((char) => char.value)
        .join('');
      tokens.push(number(text, loc(i, end)));
      i = end;
      continue;
    }

    if (isEllipsisAt(i)) {
      tokens.push(ellipsis(loc(i, i + 3)));
      i += 3;
      continue;
    }

    const symbol = SYMBOL_TOKENS.get(value);
    if (symbol) {
      tokens.push(symbol(loc(i, i + 1)));
      i++;
      continue;
    }

    const name = matchFunctionName(i);
    if (name !== undefined) {
      const end = i + [...name].length;
      tokens.push(identifier(name, loc(i, end)));
      i = end;
      continue;
    }

    if (isIdentifierChar(value)) {
      tokens.push(identifier(value, loc(i, i + 1)));
      i++;
      continue;
    }

    unexpectedChar(value);
  }
  return tokens;
};

const lexChildren = (
  nodes: readonly types.CharNode[],
  path: readonly number[],
  options: LexOptions,
): TokenNode[] => {
  const wordNames = options.requireBackslash ? [] : WORD_NAMES;
  // TODO: assert that nodes.length > 0

  const tokens: TokenNode[] = [];

  let chars: types.Char[] = [];

  nodes.forEach((node, index) => {
    if (node.type === 'char') {
      chars.push(node);
    } else {
      const offset = index - chars.length;
      tokens.push(...tokenizeChars(chars, path, offset, wordNames));
      tokens.push(lex(node, path, index, options));
      chars = [];
    }
  });

  const offset = nodes.length - chars.length;
  tokens.push(...tokenizeChars(chars, path, offset, wordNames));

  return tokens;
};

function assertOneOrMore<T>(
  array: readonly T[],
  msg: string,
): asserts array is OneOrMore<T> {
  if (array.length === 0) {
    throw new Error(msg);
  }
}

export const lexRow = (
  row: types.CharRow,
  path: readonly number[] = [],
  options: LexOptions = {},
): TokenRow => {
  // assertOneOrMore(row.children, "rows cannot be empty");
  return {
    type: NodeType.Row,
    children: lexChildren(row.children, path, options),
    loc: location(path, 0, row.children.length),
  };
};

const lex = (
  node: types.CharNode,
  path: readonly number[],
  offset: number,
  options: LexOptions,
): TokenNode => {
  switch (node.type) {
    case NodeType.Row:
      // This never gets called because rows must be children of
      // either: subsup, frac, or root.
      assertOneOrMore(node.children, 'rows cannot be empty');
      return {
        type: node.type,
        children: lexChildren(node.children, path, options),
        loc: location(path, offset, offset + 1),
      };
    case NodeType.SubSup: {
      const [sub, sup] = node.children;
      return {
        type: node.type,
        // TODO: use null-coalescing
        children: [
          sub ? lexRow(sub, [...path, offset, 0], options) : null,
          sup ? lexRow(sup, [...path, offset, 1], options) : null,
        ],
        loc: location(path, offset, offset + 1),
      };
    }
    case NodeType.Limits: {
      const [lower, upper] = node.children;
      const loc = location(path, offset, offset + 1);

      let inner: TokenNode;
      if (
        node.inner.type === 'char' &&
        SUMMATION_CHARS.includes(node.inner.value)
      ) {
        inner = summation(loc);
      } else if (
        node.inner.type === 'char' &&
        PRODUCT_CHARS.includes(node.inner.value)
      ) {
        inner = product(loc);
      } else if (node.inner.type === 'row') {
        // TODO: check that the row corresponds to "lim"
        inner = atom({ type: 'token', name: TokenKind.Lim }, loc);
      } else if (
        node.inner.type === 'char' &&
        node.inner.value in UNSUPPORTED_CHARS
      ) {
        // e.g. an integral
        return unsupported(node.inner.value);
      } else {
        throw new Error('Invalid inner for limits');
      }

      return {
        type: node.type,
        children: [
          lexRow(lower, [...path, offset, 0], options),
          upper ? lexRow(upper, [...path, offset, 1], options) : null,
        ],
        inner,
        loc,
      };
    }
    case NodeType.Frac: {
      const [numerator, denominator] = node.children;
      return {
        type: node.type,
        children: [
          lexRow(numerator, [...path, offset, 0], options),
          lexRow(denominator, [...path, offset, 1], options),
        ],
        loc: location(path, offset, offset + 1),
      };
    }
    case NodeType.Root: {
      const [index, radicand] = node.children;
      return {
        type: node.type,
        children: [
          index ? lexRow(index, [...path, offset, 1], options) : null,
          lexRow(radicand, [...path, offset, 0], options),
        ],
        loc: location(path, offset, offset + 1),
      };
    }
    case NodeType.Delimited: {
      // Brackets and braces would otherwise be parsed as parentheses.
      for (const delim of [node.leftDelim, node.rightDelim]) {
        if (!['(', ')', '|'].includes(delim.value)) {
          unsupported(delim.value);
        }
      }
      const delimLoc = location(path, offset, offset);
      const leftDelim =
        node.leftDelim.value === '|'
          ? verticalbar(delimLoc)
          : lparens(delimLoc);
      const rightDelim =
        node.rightDelim.value === '|'
          ? verticalbar(delimLoc)
          : rparens(delimLoc);
      return {
        type: node.type,
        children: [lexRow(node.children[0], [...path, offset, 0], options)],
        leftDelim: leftDelim,
        rightDelim: rightDelim,
        loc: location(path, offset, offset + 1),
      };
    }
    case NodeType.Table: {
      return {
        type: node.type,
        colCount: node.colCount,
        rowCount: node.rowCount,
        children: node.children.map(
          (child, index) =>
            child && lexRow(child, [...path, offset, index], options),
        ),
        loc: location(path, offset, offset + 1),
      };
    }
    case NodeType.Macro:
      return {
        type: node.type,
        children: [lexRow(node.children[0], [...path, offset, 0], options)],
        loc: location(path, offset, offset + 1),
      };
    case NodeType.Accent:
      return {
        type: node.type,
        accent: node.accent,
        wide: false,
        children: [lexRow(node.children[0], [...path, offset, 0], options)],
        loc: location(path, offset, offset + 1),
      };
    case 'char':
      throw new Error('lexChildren coalesces chars, use it instead');
    default:
      throw new UnreachableCaseError(node);
  }
};
