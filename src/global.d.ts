type OneOrMore<T> = readonly [T, ...(readonly T[])];
type TwoOrMore<T> = readonly [T, T, ...(readonly T[])];
