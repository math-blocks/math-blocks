import type { types } from '@math-blocks/editor';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  interface Matchers<T = any> {
    toEqualEditorNodes(actual: readonly types.CharNode[]): void;
  }
}
