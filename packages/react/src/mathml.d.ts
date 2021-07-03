declare namespace JSX {
    type MathmlProps = {
        readonly class?: string;
        readonly id?: string;
        readonly style?: React.CSSProperties;
        readonly children?: React.ReactNode;
    };

    interface IntrinsicElements {
        readonly mrow: MathmlProps;
        readonly mn: MathmlProps;
        readonly mi: MathmlProps;
        readonly mo: MathmlProps;
        readonly mfrac: MathmlProps; // TODO: restrict to two children
        readonly msup: MathmlProps;
        readonly msub: MathmlProps;
        readonly mroot: MathmlProps; // TODO: restrict to two children
        readonly msqrt: MathmlProps;
        readonly math: MathmlProps & {
            readonly xmlns: "http://www.w3.org/1998/Math/MathML";
            readonly ref?: React.Ref<HTMLElement>;
        };
    }
}
