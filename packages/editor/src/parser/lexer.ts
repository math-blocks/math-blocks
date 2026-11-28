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

// Single chars that each become a token with no value.  `⊂` and `⊃` are
// proper subsets and supersets, and `⊆` and `⊇` are subsets and supersets
// that may be equal, as in OpenMath's set1 content dictionary.
const SYMBOL_TOKENS: Record<string, (loc: SourceLocation) => TokenAtom> = {
  '\u2213': minusplus, // ∓
  '\u2208': elementOf, // ∈
  '\u2209': notElementOf, // ∉
  '\u220B': contains, // ∋
  '\u220C': notContains, // ∌
  '\u2286': subset, // ⊆
  '\u2282': properSubset, // ⊂
  '\u2287': superset, // ⊇
  '\u2283': properSuperset, // ⊃
  '\u222A': union, // ∪
  '\u2229': intersection, // ∩
  '\u2192': rightArrow, // →
  // `Tex.parse` and the editor use the n-ary summation and product signs,
  // but the Greek capitals Σ and Π are also accepted as the operator of a
  // limits node, see `lex`.
  '\u2211': summation, // ∑
  '\u220F': product, // ∏
  '\u2026': ellipsis, // … (\ldots)
  '\u22EF': ellipsis, // ⋯ (\cdots)
};

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

// TODO: allow different decimal and list separators
// Both the minus sign (U+2212) and the ASCII hyphen-minus are lexed as minus.
// Identifiers are single latin or greek letters, the names of some functions
// spelled out one char at a time, or symbols for constants: ∞, ∅, and the
// number sets ℕ, ℤ, ℚ, ℝ and ℂ.  The parser decides what each identifier
// means.
const TOKEN_REGEX =
  /([1-9]*[0-9]\.?[0-9]*|\.[0-9]+)|(,|<|>|≤|≥|\u2260|\*|\u00B7|\u00D7|\u22C5|\u00F7|\u00B1|\+|\u2212|-|=|\(|\)|\.\.\.|[\u2213\u2208\u2209\u220B\u220C\u2286\u2282\u2287\u2283\u222A\u2229\u2192\u2211\u220F\u2026\u22EF])|(sin|cos|tan|[a-z]|[\u03B1-\u03C9]|[\u221E\u2205\u2115\u2124\u211A\u211D\u2102])/gi;

/**
 * Throws an error naming `char`, a character the lexer doesn't recognize, or
 * saying that it isn't supported yet if it's valid math.
 */
const unexpectedChar = (char: string): never => {
  if (char in UNSUPPORTED_CHARS) {
    unsupported(char, UNSUPPORTED_CHARS[char]);
  }
  const codePoint = char.codePointAt(0) ?? 0;
  const hex = codePoint.toString(16).toUpperCase().padStart(4, '0');
  throw new Error(`Unexpected character '${char}' (U+${hex})`);
};

/**
 * Throws if `str.slice(start, end)`, the text between two token matches (or
 * before the first or after the last one), contains anything other than
 * whitespace.  Without
 * this check the lexer would silently drop chars it doesn't recognize, e.g.
 * parsing "a?b" as "ab".
 */
const assertOnlyWhitespace = (
  str: string,
  start: number,
  end: number,
): void => {
  // Iterating the string, rather than indexing it, gives whole code points,
  // so a char outside the BMP such as U+1D465 isn't split into surrogates.
  for (const char of str.slice(start, end)) {
    if (!/\s/.test(char)) {
      unexpectedChar(char);
    }
  }
};

// The operators of a limits node that are lexed as summation and product
// operators: the n-ary signs that `Tex.parse` and the editor create, and the
// Greek capitals.
const SUMMATION_CHARS = ['\u2211', '\u03a3'];
const PRODUCT_CHARS = ['\u220f', '\u03a0'];

// TODO: include ids of source chars in parsed tokens

/**
 * Converts a run of chars to tokens.
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
): readonly TokenAtom[] => {
  const tokens: TokenAtom[] = [];
  let runStart = 0;
  chars.forEach((char, index) => {
    // Count code points rather than UTF-16 code units, so that a single char
    // outside the BMP, such as U+1D465, isn't mistaken for a function name.
    if ([...char.value].length > 1) {
      tokens.push(
        ...tokenizeRun(chars.slice(runStart, index), path, offset + runStart),
      );
      if (!/^[a-z]+$/i.test(char.value)) {
        throw new Error(`Unexpected symbol '${char.value}'`);
      }
      const loc = location(path, offset + index, offset + index + 1);
      tokens.push(identifier(char.value, loc));
      runStart = index + 1;
    }
  });
  tokens.push(...tokenizeRun(chars.slice(runStart), path, offset + runStart));
  return tokens;
};

/**
 * Converts a run of chars that each hold a single character to tokens.
 */
const tokenizeRun = (
  chars: readonly types.Char[],
  path: readonly number[],
  offset: number,
): readonly TokenAtom[] => {
  const tokens: TokenAtom[] = [];
  if (chars.length > 0) {
    const str = chars.map((char) => char.value).join('');
    const matches = str.matchAll(TOKEN_REGEX);
    let prevEnd = 0;

    for (const match of matches) {
      const [, value, sym, name] = match;
      const { index } = match;
      if (typeof index !== 'number') {
        // Should we throw if there's match?
        continue;
      }
      assertOnlyWhitespace(str, prevEnd, index);
      prevEnd = index + match[0].length;
      if (value) {
        const loc = location(
          path,
          offset + index,
          offset + index + value.length,
        );
        tokens.push(number(value, loc));
      } else if (sym) {
        const loc = location(path, offset + index, offset + index + sym.length);
        switch (sym) {
          case ',':
            tokens.push(comma(loc));
            break;
          case '=':
            tokens.push(eq(loc));
            break;
          case '<':
            tokens.push(lt(loc));
            break;
          case '≤':
            tokens.push(lte(loc));
            break;
          case '>':
            tokens.push(gt(loc));
            break;
          case '≥':
            tokens.push(gte(loc));
            break;
          case '+':
            tokens.push(plus(loc));
            break;
          case '*':
          case '\u00B7': // middle dot (interpunct)
          case '\u00D7': // multiplication sign
          case '\u22C5': // dot operator
            tokens.push(times(loc));
            break;
          case '\u2212':
          case '-':
            tokens.push(minus(loc));
            break;
          case '\u00F7':
            tokens.push(divide(loc));
            break;
          case '\u2260':
            tokens.push(neq(loc));
            break;
          case '\u00B1':
            tokens.push(plusminus(loc));
            break;
          case '...':
            tokens.push(ellipsis(loc));
            break;
          case '(':
            tokens.push(lparens(loc));
            break;
          case ')':
            tokens.push(rparens(loc));
            break;
          default:
            if (sym in SYMBOL_TOKENS) {
              tokens.push(SYMBOL_TOKENS[sym](loc));
              break;
            }
            throw new Error(`Unexpected symbol token: ${sym}`);
        }
      } else if (name) {
        const loc = location(
          path,
          offset + index,
          offset + index + name.length,
        );
        tokens.push(identifier(name, loc));
      }
    }
    assertOnlyWhitespace(str, prevEnd, str.length);
    chars = [];
  }

  return tokens;
};

const lexChildren = (
  nodes: readonly types.CharNode[],
  path: readonly number[],
): TokenNode[] => {
  // TODO: assert that nodes.length > 0

  const tokens: TokenNode[] = [];

  let chars: types.Char[] = [];

  nodes.forEach((node, index) => {
    if (node.type === 'char') {
      chars.push(node);
    } else {
      const offset = index - chars.length;
      tokens.push(...tokenizeChars(chars, path, offset));
      tokens.push(lex(node, path, index));
      chars = [];
    }
  });

  const offset = nodes.length - chars.length;
  tokens.push(...tokenizeChars(chars, path, offset));

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
): TokenRow => {
  // assertOneOrMore(row.children, "rows cannot be empty");
  return {
    type: NodeType.Row,
    children: lexChildren(row.children, path),
    loc: location(path, 0, row.children.length),
  };
};

const lex = (
  node: types.CharNode,
  path: readonly number[],
  offset: number,
): TokenNode => {
  switch (node.type) {
    case NodeType.Row:
      // This never gets called because rows must be children of
      // either: subsup, frac, or root.
      assertOneOrMore(node.children, 'rows cannot be empty');
      return {
        type: node.type,
        children: lexChildren(node.children, path),
        loc: location(path, offset, offset + 1),
      };
    case NodeType.SubSup: {
      const [sub, sup] = node.children;
      return {
        type: node.type,
        // TODO: use null-coalescing
        children: [
          sub ? lexRow(sub, [...path, offset, 0]) : null,
          sup ? lexRow(sup, [...path, offset, 1]) : null,
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
          lexRow(lower, [...path, offset, 0]),
          upper ? lexRow(upper, [...path, offset, 1]) : null,
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
          lexRow(numerator, [...path, offset, 0]),
          lexRow(denominator, [...path, offset, 1]),
        ],
        loc: location(path, offset, offset + 1),
      };
    }
    case NodeType.Root: {
      const [index, radicand] = node.children;
      return {
        type: node.type,
        children: [
          index ? lexRow(index, [...path, offset, 1]) : null,
          lexRow(radicand, [...path, offset, 0]),
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
        children: [lexRow(node.children[0], [...path, offset, 0])],
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
          (child, index) => child && lexRow(child, [...path, offset, index]),
        ),
        loc: location(path, offset, offset + 1),
      };
    }
    case NodeType.Macro:
      return {
        type: node.type,
        children: [lexRow(node.children[0], [...path, offset, 0])],
        loc: location(path, offset, offset + 1),
      };
    case NodeType.Accent:
      return {
        type: node.type,
        accent: node.accent,
        wide: false,
        children: [lexRow(node.children[0], [...path, offset, 0])],
        loc: location(path, offset, offset + 1),
      };
    case 'char':
      throw new Error('lexChildren coalesces chars, use it instead');
    default:
      throw new UnreachableCaseError(node);
  }
};
