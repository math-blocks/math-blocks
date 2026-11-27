/**
 * The named functions that the parser knows about.  This is the one place
 * each function is listed.
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

export const isFunctionName = (name: string): boolean =>
  name === 'log' || name in functions;
