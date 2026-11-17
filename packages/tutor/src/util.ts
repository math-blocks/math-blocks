import * as Semantic from '@math-blocks/semantic';

export class UnreachableCaseError extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${val}`);
  }
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Returns a node id that no existing node uses.
 *
 * Semantic's builders draw ids from a shared counter, so we get a fresh id by
 * building a throwaway node rather than keeping a second counter that could
 * hand out ids which collide with theirs.
 */
export const newId = (): number => Semantic.builders.number('0').id;
