declare namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R, T> {
        toParseLike(math: string): R;
        toHaveStepsLike(steps: [string, string][]): R;
        toHaveMessages(messages: readonly string[]): R;
    }
}
