import type * as types from './char/types';

declare module 'vitest' {
  // oxlint-disable-next-line typescript/no-explicit-any
  interface Matchers<T = any> {
    toEqualEditorNodes(actual: readonly types.CharNode[]): void;
  }
}
