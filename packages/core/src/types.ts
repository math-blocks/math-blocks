/** A readonly array with at least one element. */
export type OneOrMore<T> = readonly [T, ...(readonly T[])];

/** A readonly array with at least two elements. */
export type TwoOrMore<T> = readonly [T, T, ...(readonly T[])];
