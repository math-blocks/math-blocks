declare namespace jest {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Matchers<R, T> {
    toHaveSubstepsLike(expected: readonly (readonly [string, string])[]): {
      readonly message: () => string;
      readonly pass: boolean;
    };
    toHaveFullStepsLike(expected: {
      readonly steps: readonly Step[];
      readonly expressions: readonly string[];
    }): { readonly message: () => string; readonly pass: boolean };
  }
}
