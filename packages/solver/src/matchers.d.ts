declare namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R, T> {
        toHaveSubstepsLike(
            expected: [string, string][],
        ): {message: () => string; pass: boolean};
        toHaveFullStepsLike(expected: {
            steps: readonly Step[];
            expressions: string[];
        }): {message: () => string; pass: boolean};
    }
}
