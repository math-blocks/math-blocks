import * as Semantic from '@math-blocks/semantic';

import * as Testing from '../../test-util';

import { getCoeff, isTermOfIdent } from '../util';

describe('getCoeff', () => {
  test('x -> 1', () => {
    const ast = Testing.parse('x') as Semantic.types.Node;
    const coeff = getCoeff(ast);

    expect(Testing.print(coeff)).toEqual('1');
  });

  test('2x -> 2', () => {
    const ast = Testing.parse('2x') as Semantic.types.Node;
    const coeff = getCoeff(ast);

    expect(Testing.print(coeff)).toEqual('2');
  });

  test('-x -> -1', () => {
    const ast = Testing.parse('-x') as Semantic.types.Node;
    const coeff = getCoeff(ast);

    expect(Testing.print(coeff)).toEqual('-1');
  });

  test('-2x -> -2', () => {
    const ast = Testing.parse('-2x') as Semantic.types.Node;
    const coeff = getCoeff(ast);

    expect(Testing.print(coeff)).toEqual('-2');
  });

  // Doesn't handle non-canonicalized terms yet
  test.skip('(x)(2) -> 2', () => {
    const ast = Testing.parse('(x)(2)') as Semantic.types.Node;
    const coeff = getCoeff(ast);

    expect(Testing.print(coeff)).toEqual('2');
  });

  test('x / 2', () => {
    const ast = Testing.parse('x / 2') as Semantic.types.Node;
    const coeff = getCoeff(ast);

    expect(Testing.print(coeff)).toEqual('1 / 2');
  });

  test('3x / 2', () => {
    const ast = Testing.parse('3x / 2') as Semantic.types.Node;
    const coeff = getCoeff(ast);

    expect(Testing.print(coeff)).toEqual('3 / 2');
  });
});

describe('isTermOfIdent', () => {
  test('x', () => {
    const ast = Testing.parse('x');
    const ident = Semantic.builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('2x', () => {
    const ast = Testing.parse('2x');
    const ident = Semantic.builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('-x', () => {
    const ast = Testing.parse('-x');
    const ident = Semantic.builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('-2x', () => {
    const ast = Testing.parse('-x');
    const ident = Semantic.builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('(1/2)x', () => {
    const ast = Testing.parse('(1/2)x');
    const ident = Semantic.builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('(2+3)x', () => {
    const ast = Testing.parse('(2+3)x');
    const ident = Semantic.builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  // Doesn't handle non-canonicalized terms yet
  test.skip('(x)(2)', () => {
    const ast = Testing.parse('(x)(2)');
    const ident = Semantic.builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });

  test('x / 2', () => {
    const ast = Testing.parse('x / 2');
    const ident = Semantic.builders.identifier('x');

    expect(isTermOfIdent(ast, ident)).toBeTruthy();
  });
});
