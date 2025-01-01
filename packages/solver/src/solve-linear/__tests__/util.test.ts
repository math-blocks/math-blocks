import { builders } from '@math-blocks/semantic';

import { parse, print } from '../../test-util';

import { getCoeff, isTermOfIdent } from '../util';

describe('getCoeff', () => {
  test('x -> 1', () => {
    const ast = parse('x');
    const coeff = getCoeff(ast);

    expect(print(coeff)).toMatchInlineSnapshot(`"1"`);
  });

  test('2x -> 2', () => {
    const ast = parse('2x');
    const coeff = getCoeff(ast);

    expect(print(coeff)).toMatchInlineSnapshot(`"2"`);
  });

  test('-x -> -1', () => {
    const ast = parse('-x');
    const coeff = getCoeff(ast);

    expect(print(coeff)).toMatchInlineSnapshot(`"-1"`);
  });

  test('-2x -> -2', () => {
    const ast = parse('-2x');
    const coeff = getCoeff(ast);

    expect(print(coeff)).toMatchInlineSnapshot(`"-2"`);
  });

  // Doesn't handle non-canonicalized terms yet
  test.skip('(x)(2) -> 2', () => {
    const ast = parse('(x)(2)');
    const coeff = getCoeff(ast);

    expect(print(coeff)).toMatchInlineSnapshot('2');
  });

  test('x / 2', () => {
    const ast = parse('x / 2');
    const coeff = getCoeff(ast);

    expect(print(coeff)).toMatchInlineSnapshot(`"\\frac{1}{2}"`);
  });

  test('3x / 2', () => {
    const ast = parse('3x / 2');
    const coeff = getCoeff(ast);

    expect(print(coeff)).toMatchInlineSnapshot(`"\\frac{3}{2}"`);
  });
});

describe('isTermOfIdent', () => {
  test('x', () => {
    const ast = parse('x');
    const ident = builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('2x', () => {
    const ast = parse('2x');
    const ident = builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('-x', () => {
    const ast = parse('-x');
    const ident = builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('-2x', () => {
    const ast = parse('-x');
    const ident = builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('(1/2)x', () => {
    const ast = parse('(1/2)x');
    const ident = builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('(2+3)x', () => {
    const ast = parse('(2+3)x');
    const ident = builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  // Doesn't handle non-canonicalized terms yet
  test.skip('(x)(2)', () => {
    const ast = parse('(x)(2)');
    const ident = builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('x / 2', () => {
    const ast = parse('x / 2');
    const ident = builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });
});
