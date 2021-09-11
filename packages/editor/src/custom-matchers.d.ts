/// <reference types="jest" />

declare namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<R, T> {
        toEqualEditorNodes(actual: readonly types.Node[]): R;
    }
}
