declare namespace jest {
    // eslint-disable-next-line @typescript-eslint/interface-name-prefix
    interface Matchers<R, T> {
        toParseLike(math: string): R;
    }
}
