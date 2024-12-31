import type { Mutable } from 'utility-types';

type Arity = 'unary' | 'binary' | 'nary';

type IdentifierDesc = {
  readonly kind: 'identifier';
  readonly name: 'Identifier';
};

type NumberDesc = {
  readonly kind: 'number';
  readonly name: 'Number';
};

type FunctionDesc = {
  readonly kind: 'function';
  readonly name: 'Function';
  readonly arity: 'nary';
};

type OperationDesc = {
  readonly kind: 'operation';
  readonly argTypes: 'arith' | 'logic' | 'set' | 'lin-alg';
  readonly name: string;
  readonly arity: Arity;
  readonly argNames?: readonly string[];
  readonly options?: Record<string, string>;
};

type RelationDesc = {
  readonly kind: 'relation';
  readonly argTypes: readonly ('arith' | 'logic' | 'set')[];
  readonly name: string;
  readonly arity: Arity;
  readonly argNames?: readonly string[];
};

type ConstantDesc = {
  readonly kind: 'constant';
  readonly argTypes: 'arith' | 'logic' | 'set';
  readonly name: string;
  readonly latex: string;
};

type ConstructorDesc = {
  readonly kind: 'constructor';
  readonly name: string;
  readonly arity: Arity;
  readonly options?: Record<string, 'boolean' | 'number' | 'string'>;
};

type Descriptor =
  | IdentifierDesc
  | NumberDesc
  | FunctionDesc
  | OperationDesc
  | RelationDesc
  | ConstantDesc
  | ConstructorDesc;

// TODO: find a better home for this
// Func: { cls: 'func', name: 'Func', arity: 'nary' },
// TODO:
// - Func

const Operation = <Name extends string>(
  name: Name,
  arity: Arity,
  argTypes: 'arith' | 'logic' | 'set' | 'lin-alg',
  argNames?: readonly string[],
  options?: Record<string, string>,
): OperationDesc => {
  const result: Mutable<OperationDesc> = {
    kind: 'operation',
    argTypes,
    arity,
    name,
  };

  if (options) {
    result.options = options;
  }

  if (argNames) {
    result.argNames = argNames;
  }

  return result;
};

const Relation = <Name extends string>(
  name: Name,
  arity: Arity,
  argTypes: readonly ('arith' | 'logic' | 'set')[], // TODO: replace with `eval: (args: Node[]) => Node`
  argNames?: readonly string[],
): RelationDesc => ({
  kind: 'relation',
  argTypes,
  arity,
  name,
  argNames,
});

const Constant = <Name extends string>(
  name: Name,
  argTypes: 'arith' | 'logic' | 'set',
  latex: string,
): ConstantDesc => ({
  kind: 'constant',
  argTypes,
  name,
  latex,
});

const Constructor = <Name extends string>(
  name: Name,
  arity: Arity,
  options?: Record<string, 'boolean' | 'number' | 'string'>,
): ConstructorDesc => {
  const result: Mutable<ConstructorDesc> = {
    kind: 'constructor',
    name,
    arity,
  };

  if (options) {
    result.options = options;
  }

  return result;
};

// TODO: unify the property names with the 'name' field in each node
// TODO: update the names to match the names from openmath.org
export const definitions: Record<string, Descriptor> = {
  Number: { kind: 'number', name: 'Number' },
  Identifier: { kind: 'identifier', name: 'Identifier' },
  Function: { kind: 'function', name: 'Function', arity: 'nary' },

  // Arithmetic
  Add: Operation('Add', 'nary', 'arith'), // Rename to Plus
  Mul: Operation('Mul', 'nary', 'arith', undefined, { implicit: 'boolean' }), // Rename to Times
  PlusMinus: Operation('PlusMinus', 'nary', 'arith'),
  MinusPlus: Operation('MinusPlus', 'nary', 'arith'),
  UnaryPlusMinus: Operation('UnaryPlusMinus', 'unary', 'arith'),
  UnaryMinusPlus: Operation('UnaryMinusPlus', 'unary', 'arith'),

  Div: Operation('Div', 'binary', 'arith'), // Rename to Divide
  Mod: Operation('Modulo', 'binary', 'arith'),
  Pow: Operation('Power', 'binary', 'arith', ['base', 'exp']), // Rename to Power
  Root: Operation('Root', 'binary', 'arith', ['radicand', 'index'], {
    sqrt: 'boolean',
  }),

  Abs: Operation('AbsoluteValue', 'unary', 'arith'),
  Neg: Operation('Neg', 'unary', 'arith', undefined, {
    subtraction: 'boolean',
  }),

  Sin: Operation('Sin', 'unary', 'arith'),
  Cos: Operation('Cos', 'unary', 'arith'),
  Tan: Operation('Tan', 'unary', 'arith'),
  Cot: Operation('Cot', 'unary', 'arith'),
  Sec: Operation('Sec', 'unary', 'arith'),
  Csc: Operation('Csc', 'unary', 'arith'),
  ArcSin: Operation('ArcSin', 'unary', 'arith'),
  ArcCos: Operation('ArcCos', 'unary', 'arith'),
  ArcTan: Operation('ArcTan', 'unary', 'arith'),
  ArcCot: Operation('ArcCot', 'unary', 'arith'),
  ArcSec: Operation('ArcSec', 'unary', 'arith'),
  ArcCsc: Operation('ArcCsc', 'unary', 'arith'),

  Log: Operation('Log', 'binary', 'arith', ['base', 'arg']),
  Ln: Operation('Ln', 'unary', 'arith'),
  Exp: Operation('Exp', 'unary', 'arith'),

  Gt: Relation('GreaterThan', 'nary', ['arith']),
  Gte: Relation('GreaterThanOrEquals', 'nary', ['arith']),
  Lt: Relation('LessThan', 'nary', ['arith']),
  Lte: Relation('LessThanOrEquals', 'nary', ['arith']),

  Infinity: Constant('Infinity', 'arith', '\\infty'),
  Pi: Constant('Pi', 'arith', '\\pi'),
  E: Constant('E', 'arith', 'e'),
  Ellipsis: Constant('Ellipsis', 'arith', '\\ldots'),

  // Logic
  And: Operation('LogicalAnd', 'nary', 'logic'),
  Or: Operation('LogicalOr', 'nary', 'logic'),
  Xor: Operation('ExclusiveOr', 'nary', 'logic'),
  Not: Operation('LogicalNot', 'unary', 'logic'),
  Implies: Operation('Conditional', 'binary', 'logic'),
  Equivalent: Relation('Biconditional', 'binary', ['logic']), // rename to Equivalent

  True: Constant('True', 'logic', '\\text{T}'),
  False: Constant('False', 'logic', '\\text{F}'),

  // Set
  // TODO: add support for suchthat, see https://openmath.org/cd/set1.html#suchthat
  Set: Constructor('Set', 'nary'),

  Union: Operation('Union', 'nary', 'set'),
  Intersection: Operation('SetIntersection', 'nary', 'set'),
  CartesianProduct: Operation('CartesianProduct', 'nary', 'set'),

  SetDiff: Operation('SetDifference', 'binary', 'set'),

  Subset: Relation('Subset', 'nary', ['set']),
  ProperSubset: Relation('ProperSubset', 'nary', ['set']),
  Superset: Relation('Superset', 'nary', ['set']),
  ProperSuperset: Relation('ProperSuperset', 'nary', ['set']),
  NotSubset: Relation('NotSubset', 'binary', ['set']),
  NotProperSubset: Relation('NotProperSubset', 'binary', ['set']),
  NotSuperset: Relation('NotSuperset', 'binary', ['set']),
  NotProperSuperset: Relation('NotProperSuperset', 'binary', ['set']),

  In: Relation('ElementOf', 'binary', ['set'], ['element', 'set']),
  NotIn: Relation('NotElementOf', 'binary', ['set'], ['element', 'set']),

  EmptySet: Constant('EmptySet', 'set', '\\emptyset'),
  Naturals: Constant('Naturals', 'set', '\\mathbb{N}'),
  Integers: Constant('Integers', 'set', '\\mathbb{Z}'),
  Rationals: Constant('Rationals', 'set', '\\mathbb{Q}'),
  Reals: Constant('Reals', 'set', '\\mathbb{R}'),
  Complexes: Constant('Complexes', 'set', '\\mathbb{C}'),

  // Linear Algebra
  Matrix: Constructor('Matrix', 'nary', { rows: 'number', cols: 'number' }),
  // TODO: include whether it's a row or column vector
  Vector: Constructor('Vector', 'nary', { dim: 'number' }),

  Determinant: Operation('Determinant', 'unary', 'lin-alg'),
  Transpose: Operation('Transpose', 'unary', 'lin-alg'),
  VectorProduct: Operation('VectorProduct', 'binary', 'lin-alg'),
  ScalarProduct: Operation('ScalarProduct', 'binary', 'lin-alg'), // dot product

  // Calculus
  Limit: Operation('Limit', 'unary', 'arith', undefined, {
    bvar: "NodeTypes['Identifier']",
    to: "NodeTypes['Number'] | NodeTypes['Neg']",
    approach: "'left' | 'right' | 'both'",
  }),
  Integral: Operation('Integral', 'unary', 'arith', undefined, {
    bvar: "NodeTypes['Identifier']",
  }),
  DefInt: Operation('DefiniteIntegral', 'unary', 'arith', undefined, {
    bvar: "NodeTypes['Identifier']",
    lower: 'Node',
    upper: 'Node',
  }),
  Diff: Operation('Derivative', 'unary', 'arith', undefined, {
    bvar: "NodeTypes['Identifier']",
    degree: 'Node',
  }),
  PartialDiff: Operation('PartialDerivative', 'unary', 'arith', undefined, {
    bvars: "readonly NodeTypes['Identifier'][]",
    degrees: 'readonly Node[]',
  }),

  // Sequences and Series
  Sequence: Constructor('Sequence', 'nary'),
  Sum: Operation('Sum', 'unary', 'arith', undefined, {
    bvar: "NodeTypes['Identifier']",
    lower: 'Node',
    upper: 'Node',
  }),
  Product: Operation('Product', 'unary', 'arith', undefined, {
    bvar: "NodeTypes['Identifier']",
    lower: 'Node',
    upper: 'Node',
  }),

  // Relations
  Eq: Relation('Equals', 'nary', ['arith', 'logic', 'set']),
  Neq: Relation('NotEquals', 'nary', ['arith', 'logic', 'set']),

  // TODO: Parens can be encompassing any expression
  Parens: Operation('Parens', 'unary', 'arith'),
};
