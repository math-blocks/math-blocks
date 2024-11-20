export enum NodeType {
  // Numeric Node Types
  Number = 'Number',
  Identifier = 'Identifier',

  // Basic Operators
  Add = 'Add',
  Mul = 'Mul',
  Neg = 'Neg',
  Div = 'Div',
  Modulo = 'Modulo',
  Root = 'Root',
  Power = 'Power',
  Log = 'Log',

  PlusMinus = 'plusminus',
  MinusPlus = 'minusplus',

  Func = 'Func', // TODO: split into FunctionDefinition and FunctionEvaluation
  Ellipsis = 'Ellipsis',
  Parens = 'Parens',

  // Important Numeric Values
  Pi = 'Pi',
  Infinity = 'Infinity',

  // Pre-calculus
  AbsoluteValue = 'AbsoluteValue',
  Summation = 'Summation',
  Product = 'Product',

  // Calculus
  Limit = 'Limit',
  Derivative = 'Derivative',
  PartialDerivative = 'PartialDerivative',
  Integral = 'Integral',

  // Equations
  VerticalAdditionToRelation = 'VerticalAdditionToRelation',
  SystemOfRelationsElimination = 'SystemOfRelationsElimination',

  // Elementary Arithmetic Algorithms
  LongAddition = 'LongAddition',
  LongSubtraction = 'LongSubtraction',
  LongMultiplication = 'LongMultiplication',
  LongDivision = 'LongDivision',

  // Logic Values
  True = 'True',
  False = 'False',

  // Logic Operators
  LogicalAnd = 'LogicalAnd',
  LogicalOr = 'LogicalOr',
  LogicalNot = 'LogicalNot',
  ExclusiveOr = 'ExclusiveOr',
  Conditional = 'Conditional',
  Biconditional = 'Biconditional',

  // Relation Operators (Logic Result)
  Equals = 'Equals',
  NotEquals = 'NotEquals',
  LessThan = 'LessThan',
  LessThanOrEquals = 'LessThanOrEquals',
  GreaterThan = 'GreaterThan',
  GreaterThanOrEquals = 'GreaterThanOrEquals',

  // Set Operations
  ElementOf = 'ElementOf',
  NotElementOf = 'NotElementOf',
  Union = 'Union',
  SetIntersection = 'SetIntersection',
  SetDifference = 'SetDifference',
  CartesianProduct = 'CartesianProduct',

  // Set Relations
  Subset = 'Subset',
  ProperSubset = 'ProperSubset',
  NotSubset = 'NotSubset',
  NotProperSubset = 'NotProperSubset',

  // Set Values
  Set = 'Set',
  EmptySet = 'EmptySet',

  // Well-Kwown Number Theory Sets
  Naturals = 'Naturals',
  Integers = 'Integers',
  Rationals = 'Rationals',
  Reals = 'Reals',
  Complexes = 'Complexes',

  // Linear Algebra
  Vector = 'vector',
  Matrix = 'matrix',
}
