type OneOrMore<T> = readonly [T, ...(readonly T[])];
type TwoOrMore<T> = readonly [T, T, ...(readonly T[])];

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.otf' {
  export default string;
}
