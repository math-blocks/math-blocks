declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.otf' {
  // The URL of the font file. (`export default string;` would export a value
  // named `string`, which doesn't exist, so imports were typed as an error.)
  const url: string;
  export default url;
}
