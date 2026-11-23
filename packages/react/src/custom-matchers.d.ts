import type { types } from '@math-blocks/editor';

declare module 'vitest' {
  // oxlint-disable-next-line typescript/no-explicit-any
  interface Matchers<T = any> {
    toEqualEditorNodes(actual: readonly types.CharNode[]): void;
  }
}
