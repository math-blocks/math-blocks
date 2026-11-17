import builders from '../builders';
import { definitions } from '../node-defs';
import type { Node, SourceLocation } from '../types';

// builders.ts is generated from these definitions by codegen.ts.  These tests
// check that the two haven't drifted apart.

type AnyBuilder = (...args: readonly unknown[]) => Node;

const getBuilder = (key: string): AnyBuilder =>
  (builders as unknown as Record<string, AnyBuilder>)[key.toLowerCase()];

const x = builders.identifier('x');
const y = builders.identifier('y');
const loc: SourceLocation = { path: [], start: 0, end: 1 };

describe('node definitions', () => {
  test('every definition has a name and a kind', () => {
    for (const def of Object.values(definitions)) {
      expect(typeof def.name).toBe('string');
      expect([
        'number',
        'identifier',
        'function',
        'operation',
        'relation',
        'constant',
        'constructor',
      ]).toContain(def.kind);
    }
  });

  test('constants include the LaTeX used to render them', () => {
    expect(definitions.Pi).toEqual({
      kind: 'constant',
      argTypes: 'arith',
      name: 'Pi',
      latex: '\\pi',
    });
    expect(definitions.Reals).toMatchObject({ latex: '\\mathbb{R}' });
  });

  test('operations only include argNames and options when given', () => {
    expect(definitions.Add).toEqual({
      kind: 'operation',
      argTypes: 'arith',
      arity: 'nary',
      name: 'Add',
    });
    expect(definitions.Root).toEqual({
      kind: 'operation',
      argTypes: 'arith',
      arity: 'binary',
      name: 'Root',
      argNames: ['radicand', 'index'],
      options: { sqrt: 'boolean' },
    });
  });

  test('relations list the kinds of arguments they accept', () => {
    expect(definitions.Eq).toEqual({
      kind: 'relation',
      argTypes: ['arith', 'logic', 'set'],
      arity: 'nary',
      name: 'Equals',
      argNames: undefined,
    });
    expect(definitions.In).toMatchObject({ argNames: ['element', 'set'] });
  });

  test('constructors only include options when given', () => {
    expect(definitions.Set).toEqual({
      kind: 'constructor',
      name: 'Set',
      arity: 'nary',
    });
    expect(definitions.Vector).toEqual({
      kind: 'constructor',
      name: 'Vector',
      arity: 'nary',
      options: { dim: 'number' },
    });
  });

  describe('every definition has a matching builder', () => {
    test.each(Object.entries(definitions))('%s', (key, def) => {
      const build = getBuilder(key);
      expect(build).toBeInstanceOf(Function);

      switch (def.kind) {
        case 'number': {
          expect(build('5', loc)).toMatchObject({
            type: def.name,
            value: '5',
            loc,
          });
          return;
        }
        case 'identifier': {
          expect(build('a', undefined, loc)).toMatchObject({
            type: def.name,
            name: 'a',
            loc,
          });
          return;
        }
        case 'function': {
          expect(build(x, [y], loc)).toMatchObject({
            type: def.name,
            func: x,
            args: [y],
            loc,
          });
          return;
        }
        case 'constant': {
          expect(build(loc)).toEqual({
            type: def.name,
            id: expect.any(Number),
            loc,
          });
          return;
        }
      }

      // Operations, relations and constructors take their arguments first,
      // followed by a value for each option, followed by the location.
      const optionNames =
        'options' in def && def.options ? Object.keys(def.options) : [];
      const optionValues = optionNames.map((name) => `${name}-value`);

      const positional: unknown[] =
        def.arity === 'unary'
          ? [x]
          : def.arity === 'binary'
          ? [x, y]
          : [[x, y]];
      const node = build(
        ...positional,
        ...optionValues,
        loc,
      ) as unknown as Record<string, unknown>;

      expect(node.type).toBe(def.name);
      expect(typeof node.id).toBe('number');
      expect(node.loc).toBe(loc);

      if (def.arity === 'unary') {
        expect(node.arg).toBe(x);
      } else if ('argNames' in def && def.argNames) {
        expect(node[def.argNames[0]]).toBe(x);
        expect(node[def.argNames[1]]).toBe(y);
      } else {
        expect(node.args).toEqual([x, y]);
      }

      optionNames.forEach((name, i) => {
        expect(node[name]).toBe(optionValues[i]);
      });
    });
  });
});
