/**
 * The named functions and operators that the parser knows about.  This is
 * the one place each name is listed: the parser uses the builders, and the
 * lexer uses the names to recognize them when they're typed one letter at a
 * time.
 */
import * as Semantic from '@math-blocks/semantic';

import type { SourceLocation } from '../token/types';

export type UnaryBuilder = (
  arg: Semantic.types.Node,
  loc?: SourceLocation,
) => Semantic.types.Node;

const b = Semantic.builders;

/**
 * A function that takes a single argument, such as `sin` or `ln`.
 */
export type UnaryFunctionDef = {
  readonly build: UnaryBuilder;
  /**
   * The function's inverse, used for `f^{-1} x`.  Only the trig functions
   * have one here, which is why `\sin^{-1} x` is `arcsin(x)` but
   * `\ln^{-1} x` is `(ln x)^{-1}`, the same as any other superscript.
   */
  readonly inverse?: UnaryBuilder;
};

/**
 * The functions that take a single argument, keyed by name.
 *
 * - The parser (`parseFunction` in parser.ts) looks up a function's name
 *   here when it parses an application such as `\sin x`, `\ln(x+1)` or
 *   `\sin^2 x`.  It parses the argument, then calls `build` with it.  If the
 *   function has a superscript of exactly -1 and an `inverse`, it calls
 *   `inverse` instead, so `\sin^{-1} x` is `arcsin(x)`.  Any other
 *   superscript is a power of the result.
 * - The lexer recognizes each name, via `WORD_OPERATORS`, when it's typed
 *   one letter at a time, unless the `requireBackslash` option is set.
 *
 * `log` isn't here because it takes an optional base as a subscript, see
 * `SPECIAL_NAMES`.  Functions that take a list of arguments, such as `max`,
 * aren't here either.
 */
export const UNARY_FUNCTIONS: Record<string, UnaryFunctionDef> = {
  sin: { build: b.sin, inverse: b.arcsin },
  cos: { build: b.cos, inverse: b.arccos },
  tan: { build: b.tan, inverse: b.arctan },
  cot: { build: b.cot, inverse: b.arccot },
  sec: { build: b.sec, inverse: b.arcsec },
  csc: { build: b.csc, inverse: b.arccsc },
  arcsin: { build: b.arcsin },
  arccos: { build: b.arccos },
  arctan: { build: b.arctan },
  arccot: { build: b.arccot },
  arcsec: { build: b.arcsec },
  arccsc: { build: b.arccsc },
  ln: { build: b.ln },
  det: { build: b.determinant },
};

// Names that the parser handles itself rather than through a table: `log`
// takes an optional base, `mod` is a binary operator and `lim` takes a
// subscript such as `x→0`.
export const SPECIAL_NAMES: readonly string[] = ['log', 'mod', 'lim'];

// Named functions and operators that `Tex.parse` has macros for, but that
// have no semantic node yet.  The parser throws `'max' isn't supported yet`
// for these.
export const UNSUPPORTED_NAMES: readonly string[] = [
  // TODO(#888): min, max, limsup and liminf.
  'min',
  'max',
  'limsup',
  'liminf',
  // TODO(#883): gcd and lcm.
  'gcd',
  'lcm',
  // TODO(#912): arg and the linear-algebra operators.
  'arg',
  'span',
  'rank',
  'null',
  'adj',
  'proj',
  'ker',
  'dim',
];

export const isFunctionName = (name: string): boolean =>
  name === 'log' || name in UNARY_FUNCTIONS;

// Every name that's a single word, whether or not the parser supports it.
export const WORD_OPERATORS: readonly string[] = [
  ...Object.keys(UNARY_FUNCTIONS),
  ...SPECIAL_NAMES,
  ...UNSUPPORTED_NAMES,
];
