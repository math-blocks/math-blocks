import builders from '../builders';
import { definitions } from '../node-defs';
import type { Node, SourceLocation } from '../types';

type Descriptor = (typeof definitions)[string];

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
    const entriesOfKind = (
      ...kinds: readonly Descriptor['kind'][]
    ): [string, Descriptor][] =>
      Object.entries(definitions).filter(([, def]) => kinds.includes(def.kind));

    test.each(Object.keys(definitions))('%s has a builder', (key) => {
      expect(getBuilder(key)).toBeInstanceOf(Function);
    });

    test('Number', () => {
      expect(getBuilder('Number')('5', loc)).toMatchObject({
        type: definitions.Number.name,
        value: '5',
        loc,
      });
    });

    test('Identifier', () => {
      expect(getBuilder('Identifier')('a', undefined, loc)).toMatchObject({
        type: definitions.Identifier.name,
        name: 'a',
        loc,
      });
    });

    test('Function', () => {
      expect(getBuilder('Function')(x, [y], loc)).toMatchObject({
        type: definitions.Function.name,
        func: x,
        args: [y],
        loc,
      });
    });

    test.each(entriesOfKind('constant'))('constant %s', (key, def) => {
      expect(getBuilder(key)(loc)).toEqual({
        type: def.name,
        id: expect.any(Number),
        loc,
      });
    });

    // Operations, relations and constructors take their arguments first,
    // followed by a value for each option, followed by the location.
    test.each(entriesOfKind('operation', 'relation', 'constructor'))(
      '%s',
      (key, def) => {
        const optionNames =
          'options' in def && def.options ? Object.keys(def.options) : [];
        const optionValues = optionNames.map((name) => `${name}-value`);

        const arity = 'arity' in def ? def.arity : undefined;
        const positional: unknown[] =
          arity === 'unary' ? [x] : arity === 'binary' ? [x, y] : [[x, y]];
        const node = getBuilder(key)(
          ...positional,
          ...optionValues,
          loc,
        ) as unknown as Record<string, unknown>;

        expect(node.type).toBe(def.name);
        expect(typeof node.id).toBe('number');
        expect(node.loc).toBe(loc);

        if (arity === 'unary') {
          expect(node.arg).toBe(x);
        } else if ('argNames' in def && def.argNames) {
          expect(node[def.argNames[0]]).toBe(x);
          expect(node[def.argNames[1]]).toBe(y);
        } else {
          expect(node.args).toEqual([x, y]);
        }

        // A name that ends in `?` is an optional property.
        optionNames.forEach((name, i) => {
          expect(node[name.replace(/\?$/, '')]).toBe(optionValues[i]);
        });
      },
    );
  });
});
