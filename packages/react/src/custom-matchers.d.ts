// export is necessary with --isolated-modules
export declare global {
    /* eslint-disable */
    namespace jest {
        interface Matchers<R, T> {
            toEqualEditorNodes(actual: readonly types.Node[]): R;
        }
    }
    /* eslint-enable */
}
