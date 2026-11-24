import { RuleTester } from 'oxlint/plugins-dev';

import plugin from '../index.js';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' } },
});

ruleTester.run('prefer-readonly-type', plugin.rules['prefer-readonly-type'], {
  valid: [
    'type T = { readonly items: readonly string[]; readonly count: number };',
    'interface I { readonly items: ReadonlyArray<string>; readonly [key: string]: unknown }',
    'type Pair = readonly [number, number];',
    'type M = ReadonlyMap<string, ReadonlySet<number>>;',
    'type R = { readonly [K in keyof T]: T[K] };',
    'class C { readonly x = 1; constructor(private readonly y: number) {} }',
    // allowLocalMutation
    'function f() { const xs: number[] = []; const m = new Map<string, number[]>(); type L = { n: number }; }',
    'const g = () => { let acc: Array<number> = []; };',
    // allowMutableReturnType
    'function f(): string[] { return []; }',
    'const g = (): { n: number; xs: number[] } => ({ n: 1, xs: [] });',
    'type F = () => [number, number];',
  ],
  invalid: [
    {
      code: 'type T = { items: string[]; count: number };',
      errors: [
        { messageId: 'property' },
        { messageId: 'array' },
        { messageId: 'property' },
      ],
    },
    {
      code: 'interface I { [key: string]: unknown }',
      errors: [{ messageId: 'property' }],
    },
    {
      code: 'type Pair = [number, number];',
      errors: [{ messageId: 'tuple' }],
    },
    {
      code: 'type C = Array<string> | Map<string, number> | Set<number>;',
      errors: [
        { message: 'Use ReadonlyArray instead of Array.' },
        { message: 'Use ReadonlyMap instead of Map.' },
        { message: 'Use ReadonlySet instead of Set.' },
      ],
    },
    {
      code: 'type R = { [K in keyof T]: T[K] }; type S = { -readonly [K in keyof T]: T[K] };',
      errors: [{ messageId: 'property' }, { messageId: 'property' }],
    },
    {
      code: 'class C { x = 1; constructor(private y: number) {} }',
      errors: [{ messageId: 'property' }, { messageId: 'property' }],
    },
    {
      // Parameters aren't local, even though they belong to a function.
      code: 'function f(xs: number[]): void {}',
      errors: [{ messageId: 'array' }],
    },
    {
      code: 'const f = (opts: { n: number }): void => {};',
      errors: [{ messageId: 'property' }],
    },
  ],
});
