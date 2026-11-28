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
export type FunctionDef = {
  readonly build: UnaryBuilder;
  /**
   * The function's inverse, used for `f^{-1} x`.  Only the trig functions
   * have one here, which is why `\sin^{-1} x` is `arcsin(x)` but
   * `\ln^{-1} x` is `(ln x)^{-1}`, the same as any other superscript.
   */
  readonly inverse?: UnaryBuilder;
};

// Every function that takes a single argument, keyed by its name.
export const functions: Record<string, FunctionDef> = {
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
  name === 'log' || name in functions;

// Every name that's a single word, whether or not the parser supports it.
export const WORD_OPERATORS: readonly string[] = [
  ...Object.keys(functions),
  ...SPECIAL_NAMES,
  ...UNSUPPORTED_NAMES,
];
