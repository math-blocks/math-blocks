declare namespace JSX {
    type MathmlProps = {
        class?: string;
        id?: string;
        style?: React.CSSProperties;
        children?: React.ReactNode;
    };

    interface IntrinsicElements {
        mrow: MathmlProps;
        mn: MathmlProps;
        mi: MathmlProps;
        mo: MathmlProps;
        mfrac: MathmlProps; // TODO: restrict to two children
        msup: MathmlProps;
        msub: MathmlProps;
        mroot: MathmlProps; // TODO: restrict to two children
        msqrt: MathmlProps;
        math: MathmlProps & {
            xmlns: "http://www.w3.org/1998/Math/MathML";
            ref?: React.Ref<HTMLElement>;
        };
    }
}
