declare namespace JSX {
  type MathmlProps = {
    readonly class?: string;
    readonly id?: string;
    readonly key?: React.Key;
    readonly style?: React.CSSProperties;
    readonly children?: React.ReactNode;
  };

  interface IntrinsicElements {
    readonly mrow: MathmlProps;
    readonly mn: MathmlProps;
    readonly mi: MathmlProps;
    readonly mo: MathmlProps & {
      readonly fence?: 'true' | 'false';
      readonly form?: 'prefix' | 'infix' | 'postfix';
    };
    readonly mfrac: MathmlProps; // TODO: restrict to two children
    readonly msup: MathmlProps;
    readonly msub: MathmlProps;
    readonly msubsup: MathmlProps;
    readonly mroot: MathmlProps; // TODO: restrict to two children
    readonly msqrt: MathmlProps;
    readonly mover: MathmlProps & { readonly accent?: 'true' | 'false' };
    readonly munder: MathmlProps;
    readonly munderover: MathmlProps;
    readonly menclose: MathmlProps & { readonly notation?: string };
    readonly mtable: MathmlProps;
    readonly mtr: MathmlProps;
    readonly mtd: MathmlProps;
    readonly math: MathmlProps & {
      readonly xmlns: 'http://www.w3.org/1998/Math/MathML';
      readonly display?: 'block' | 'inline';
      readonly ref?: React.Ref<HTMLElement>;
    };
  }
}
