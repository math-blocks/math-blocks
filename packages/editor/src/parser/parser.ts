import { UnreachableCaseError } from '@math-blocks/core';
import type { OneOrMore } from '@math-blocks/core';
import * as Parser from '@math-blocks/parser';
import * as Semantic from '@math-blocks/semantic';
import type { Mutable } from 'utility-types';

import * as Lexer from './lexer';
import { unsupported } from './lexer';
import { functions, isFunctionName } from './functions';
import { locFromRange } from '../token/util';
import { TokenKind } from '../token/types';

import type { CharRow } from '../char/types';
import type {
  TokenAtom,
  TokenDelimited,
  TokenNode,
  TokenRow,
  SourceLocation,
} from '../token/types';
import { NodeType } from '../shared-types';

// TODO: fill out this list
type Operator =
  | 'add'
  | 'sub'
  | 'plusminus'
  | 'minusplus'
  | 'mod'
  | 'in'
  | 'subset'
  | 'propersubset'
  | 'superset'
  | 'propersuperset'
  | 'union'
  | 'intersection'
  | 'mul.exp'
  | 'div'
  | 'div.exp'
  | 'mul.imp'
  | 'mul.func'
  | 'func.arg'
  | 'neg'
  | 'eq'
  | 'neq'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'supsub'
  | 'comma'
  | 'nul';

type NAryOperator =
  | 'add'
  | 'sub'
  | 'plusminus'
  | 'minusplus'
  | 'subset'
  | 'propersubset'
  | 'superset'
  | 'propersuperset'
  | 'union'
  | 'intersection'
  | 'mul.exp'
  | 'mul.imp'
  | 'eq'
  | 'neq'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'comma';

type EditorParser = Parser.IParser<TokenNode, Semantic.types.Node, Operator>;

const isIdentifier = (node: TokenNode): boolean =>
  node.type === 'token' && node.name === TokenKind.Identifier;

// Identifiers that stand for constants.
const constants: Record<string, (loc?: SourceLocation) => Semantic.types.Node> =
  {
    '\u03C0': Semantic.builders.pi, // π
    '\u221E': Semantic.builders.infinity, // ∞
    '\u2205': Semantic.builders.emptyset, // ∅
    '\u2115': Semantic.builders.naturals, // ℕ
    '\u2124': Semantic.builders.integers, // ℤ
    '\u211A': Semantic.builders.rationals, // ℚ
    '\u211D': Semantic.builders.reals, // ℝ
    '\u2102': Semantic.builders.complexes, // ℂ
  };

const isFunctionToken = (node: TokenNode): boolean =>
  node.type === 'token' &&
  node.name === TokenKind.Identifier &&
  isFunctionName(node.value);

// `mod` is a binary operator, e.g. `a \mod n`, rather than a function.
const isModToken = (node: TokenNode): boolean =>
  node.type === 'token' &&
  node.name === TokenKind.Identifier &&
  node.value === 'mod';

// Tokens that can start a function's argument.
const ARG_START_TOKENS: readonly TokenKind[] = [
  TokenKind.Identifier,
  TokenKind.Number,
  TokenKind.Minus,
  TokenKind.PlusMinus,
];

const isNegativeOne = (node: Semantic.types.Node): boolean =>
  node.type === Semantic.NodeType.Neg &&
  !node.subtraction &&
  node.arg.type === Semantic.NodeType.Number &&
  node.arg.value === '1';

/**
 * Parses the application of a named function such as sin, ln, or log to its
 * argument.  The function's name has already been consumed.
 *
 * - `\sin x`, `\sin 2x`, and `\sin x^2` apply sin to everything up to the
 *   next operator other than implicit multiplication, or up to the next
 *   function, so `\sin x \cos x` is `sin(x)·cos(x)` and `\sin x + 1` is
 *   `sin(x) + 1`.
 * - `\sin^{-1} x` is `arcsin(x)`.  Any other superscript is a power of the
 *   result, e.g. `\sin^2 x` is `(sin(x))^2`.
 * - `\log x` is the base 10 logarithm and `\log_b x` the base b logarithm.
 */
const parseFunction = (
  parser: EditorParser,
  token: TokenAtom,
  name: string,
): Semantic.types.Node => {
  let base: Semantic.types.Node | undefined;
  let exp: Semantic.types.Node | undefined;

  const next = parser.peek();
  if (next.type === NodeType.SubSup) {
    parser.consume();
    const [sub, sup] = next.children;
    if (sub) {
      if (name !== 'log') {
        throw new Error(`Only log can have a subscript, not ${name}`);
      }
      base = editorParser.parse(sub.children);
    }
    if (sup) {
      exp = editorParser.parse(sup.children);
    }
  }

  const argStart = parser.peek();
  if (argStart.type === 'token' && !ARG_START_TOKENS.includes(argStart.name)) {
    throw new Error(`Missing argument for ${name}`);
  }

  let arg = parser.parseWithOperator('func.arg');
  const loc = locFromRange(token.loc, arg.loc);
  // The parens in `\sin(x)` delimit the argument.
  if (arg.type === Semantic.NodeType.Parens) {
    arg = arg.arg;
  }

  let result: Semantic.types.Node;
  if (name === 'log') {
    result = Semantic.builders.log(
      base ?? Semantic.builders.number('10'),
      arg,
      loc,
    );
  } else {
    const { build, inverse } = functions[name];
    if (inverse && exp && isNegativeOne(exp)) {
      return inverse(arg, loc);
    }
    result = build(arg, loc);
  }
  return exp ? Semantic.builders.pow(result, exp, loc) : result;
};

/**
 * Returns the subscript and superscript of a subsup node that comes right
 * after a big operator or `lim`, consuming it, or nulls if there isn't one.
 */
const consumeLimits = (
  parser: EditorParser,
): readonly [TokenRow | null, TokenRow | null] => {
  const next = parser.peek();
  if (next.type !== NodeType.SubSup) {
    return [null, null];
  }
  parser.consume();
  return next.children;
};

/**
 * Parses the argument of a big operator or `lim`, which extends up to the
 * next addition, subtraction, relation or comma.  For example,
 * `\sum_{i=1}^n 2i + 1` is `(∑ 2i) + 1`.
 */
const parseBigOperatorArg = (
  parser: EditorParser,
  symbol: string,
): Semantic.types.Node => {
  const next = parser.peek();
  if (next.type === 'token' && next.name === TokenKind.EOL) {
    throw new Error(`Missing argument for ${symbol}`);
  }
  return parser.parseWithOperator('add');
};

/**
 * Parses a sum or product, e.g. `\sum_{i=0}^{n} i`, whose operator and
 * limits have already been consumed.  The lower limit must be of the form
 * `i=…`, where `i` is the bound variable.
 */
const parseBigOperator = (
  parser: EditorParser,
  kind: TokenKind.SummationOperator | TokenKind.ProductOperator,
  lower: TokenRow | null,
  upper: TokenRow | null,
  loc: SourceLocation,
): Semantic.types.Node => {
  const symbol = kind === TokenKind.SummationOperator ? '\u2211' : '\u220F';
  if (
    !lower ||
    !upper ||
    lower.children.length === 0 ||
    upper.children.length === 0
  ) {
    throw new Error(`'${symbol}' needs a lower and an upper limit`);
  }
  const lowerNode = editorParser.parse(lower.children);
  if (
    lowerNode.type !== Semantic.NodeType.Equals ||
    lowerNode.args.length !== 2 ||
    lowerNode.args[0].type !== Semantic.NodeType.Identifier
  ) {
    throw new Error(
      `The lower limit of '${symbol}' must be of the form 'i=…', where 'i' is a variable`,
    );
  }
  const [bvar, start] = lowerNode.args;
  const end = editorParser.parse(upper.children);
  const arg = parseBigOperatorArg(parser, symbol);
  const builder =
    kind === TokenKind.SummationOperator
      ? Semantic.builders.sum
      : Semantic.builders.product;
  return builder(arg, bvar, start, end, locFromRange(loc, arg.loc));
};

/**
 * Returns 'right' if `node` is a superscript `+`, 'left' if it's a superscript
 * `-`, or null otherwise.  They mark one-sided limits, e.g. `x \to 0^{+}`.
 */
const getApproach = (node: TokenNode): 'left' | 'right' | null => {
  if (node.type !== NodeType.SubSup) {
    return null;
  }
  const [sub, sup] = node.children;
  if (sub || sup?.children.length !== 1) {
    return null;
  }
  const [sign] = sup.children;
  if (sign.type !== 'token') {
    return null;
  }
  if (sign.name === TokenKind.Plus) {
    return 'right';
  }
  return sign.name === TokenKind.Minus ? 'left' : null;
};

/**
 * Parses a limit, e.g. `\lim_{x \to 0} f`, whose `lim` and subscript have
 * already been consumed.  The subscript must be of the form `x→a` where `a`
 * is a number, optionally followed by a superscript `+` or `-` for a
 * one-sided limit.
 */
const parseLimit = (
  parser: EditorParser,
  lower: TokenRow | null,
  upper: TokenRow | null,
  loc: SourceLocation,
): Semantic.types.Node => {
  const format = "of the form 'x\u2192a'";
  if (!lower || upper) {
    throw new Error(`'lim' needs a subscript ${format}`);
  }
  const [bvarToken, arrow, ...rest] = lower.children;
  if (
    bvarToken?.type !== 'token' ||
    bvarToken.name !== TokenKind.Identifier ||
    bvarToken.value.length !== 1 ||
    bvarToken.value in constants ||
    arrow?.type !== 'token' ||
    arrow.name !== TokenKind.RightArrow ||
    rest.length === 0
  ) {
    throw new Error(`The subscript of 'lim' must be ${format}`);
  }
  const bvar = Semantic.builders.identifier(
    bvarToken.value,
    undefined,
    bvarToken.loc,
  );
  const approach = getApproach(rest[rest.length - 1]) ?? 'both';
  const to = editorParser.parse(approach === 'both' ? rest : rest.slice(0, -1));
  // The Limit node only allows a number, or a negated one, as its target.
  if (
    to.type !== Semantic.NodeType.Number &&
    !(
      to.type === Semantic.NodeType.Neg &&
      to.arg.type === Semantic.NodeType.Number
    )
  ) {
    throw new Error(
      "A limit to something other than a number isn't supported yet",
    );
  }
  const arg = parseBigOperatorArg(parser, 'lim');
  return Semantic.builders.limit(
    arg,
    bvar,
    to,
    approach,
    locFromRange(loc, arg.loc),
  );
};

/**
 * Parses a delimited node: `(…)` becomes Parens and `|…|` AbsoluteValue.
 */
const parseDelimited = (node: TokenDelimited): Semantic.types.Node => {
  const [inner] = node.children;
  const { leftDelim, rightDelim } = node;
  const isBar = (delim: TokenAtom): boolean =>
    delim.name === TokenKind.VerticalBar;
  if (isBar(leftDelim) !== isBar(rightDelim)) {
    throw new Error('Mismatched delimiters');
  }
  const result = editorParser.parse(inner.children);
  // TODO(#887): give Parens a `loc`, e.g. `node.loc` like Abs below.
  return isBar(leftDelim)
    ? Semantic.builders.abs(result, node.loc)
    : Semantic.builders.parens(result);
};

const getPrefixParselet = (
  node: TokenNode,
): Parser.PrefixParselet<TokenNode, Semantic.types.Node, Operator> => {
  switch (node.type) {
    case 'token': {
      switch (node.name) {
        case TokenKind.Identifier: {
          const name = node.value;
          if (name in constants) {
            return { parse: () => constants[name](node.loc) };
          }
          if (isFunctionName(name)) {
            return { parse: (parser) => parseFunction(parser, node, name) };
          }
          if (name === 'lim') {
            return {
              parse: (parser) =>
                parseLimit(parser, ...consumeLimits(parser), node.loc),
            };
          }
          if (name === 'mod') {
            throw new Error('Missing left operand for mod');
          }
          if (name.length > 1) {
            return unsupported(name);
          }
          return {
            parse: () =>
              Semantic.builders.identifier(name, undefined, node.loc),
          };
        }
        case TokenKind.Number:
          return {
            parse: () => Semantic.builders.number(node.value, node.loc),
          };
        case TokenKind.Minus:
          return {
            parse: (parser) => {
              const neg = parser.parseWithOperator('neg');
              const loc = locFromRange(node.loc, neg.loc);
              return Semantic.builders.neg(neg, false, loc);
            },
          };
        case TokenKind.PlusMinus:
          return {
            parse: (parser) => {
              const neg = parser.parseWithOperator('plusminus');
              const loc = locFromRange(node.loc, neg.loc);
              return Semantic.builders.unaryplusminus(neg, loc);
            },
          };
        case TokenKind.MinusPlus:
          return {
            parse: (parser) => {
              const neg = parser.parseWithOperator('plusminus');
              const loc = locFromRange(node.loc, neg.loc);
              return Semantic.builders.unaryminusplus(neg, loc);
            },
          };
        case TokenKind.SummationOperator:
        case TokenKind.ProductOperator: {
          const kind = node.name;
          return {
            parse: (parser) =>
              parseBigOperator(
                parser,
                kind,
                ...consumeLimits(parser),
                node.loc,
              ),
          };
        }
        case TokenKind.RightArrow:
          return unsupported('\u2192');
        case TokenKind.Ellipsis:
          return {
            parse: () => Semantic.builders.ellipsis(node.loc),
          };
        default:
          throw new Error(`Unexpected '${node.name}' atom`);
      }
    }
    case NodeType.Frac:
      return {
        parse: () => {
          const [numerator, denominator] = node.children;
          return Semantic.builders.div(
            editorParser.parse(numerator.children),
            editorParser.parse(denominator.children),
            node.loc,
          );
        },
      };
    case NodeType.Root:
      return {
        parse: () => {
          const [index, radicand] = node.children;
          return index === null
            ? Semantic.builders.sqrt(
                editorParser.parse(radicand.children),
                node.loc,
              )
            : Semantic.builders.root(
                editorParser.parse(radicand.children),
                editorParser.parse(index.children),
                false,
                node.loc,
              );
        },
      };
    case NodeType.Delimited:
      return {
        parse: () => parseDelimited(node),
      };
    case NodeType.Table:
      return {
        parse: () => {
          // TODO: If either rowCount or colCount are one, then we should return
          // a vector instead of a matrix.
          const cells = node.children
            .map((cell) => {
              return cell ? editorParser.parse(cell.children) : null;
            })
            .filter((cell): cell is Semantic.types.Node => cell !== null);

          if (cells.length !== node.children.length) {
            throw new Error('Matrix cells must be non-null');
          }

          return Semantic.builders.matrix(
            cells,
            node.rowCount,
            node.colCount,
            node.loc,
          );
        },
      };
    case NodeType.Accent:
      return unsupported(`\\${node.accent}`);
    case NodeType.Limits:
      return {
        parse: (parser) => {
          const { inner } = node;
          const [lower, upper] = node.children;
          if (inner.type === 'token' && inner.name === TokenKind.Lim) {
            return parseLimit(parser, lower, upper, node.loc);
          }
          if (
            inner.type === 'token' &&
            (inner.name === TokenKind.SummationOperator ||
              inner.name === TokenKind.ProductOperator)
          ) {
            return parseBigOperator(parser, inner.name, lower, upper, node.loc);
          }
          throw new Error(`Unexpected '${node.type}' token`);
        },
      };
    // TODO: Handle subsup at the start of a row, useful in Chemistry
    case NodeType.SubSup:
    case NodeType.Row:
    case NodeType.Macro:
      throw new Error(`Unexpected '${node.type}' token`);
    default:
      throw new UnreachableCaseError(node);
  }
};

// most (all?) of the binary only operations will be handled by the editor
// const parseBinaryInfix = (op: Operator) => (
//     parser: EditorParser,
//     left: Node,
// ): Node => {
//     parser.consume();
//     return {
//         type: op,
//         args: [left, parser.parseWithPrecedence(parser.getOpPrecedence(op))],
//     };
// };

/**
 * Builds the node for a chain of additions, subtractions, `±` and `∓`.
 * `args` are the operands after the first and `ops` the operator before each
 * one.  Subtracted operands are already negated by parseNaryArgs.
 *
 * A chain of only `±`, e.g. `a ± b`, is a PlusMinus node and a chain of only
 * `∓` a MinusPlus node.  In a mixed chain such as `a + b ± c` each operand
 * after a `±` or `∓` is wrapped in UnaryPlusMinus or UnaryMinusPlus, like a
 * subtracted operand is wrapped in Neg.
 */
const buildAddChain = (
  left: Semantic.types.Node,
  args: OneOrMore<Semantic.types.Node>,
  ops: readonly NAryOperator[],
  loc?: SourceLocation,
): Semantic.types.Node => {
  if (ops.every((op) => op === 'plusminus')) {
    return Semantic.builders.plusminus([left, ...args], loc);
  }
  if (ops.every((op) => op === 'minusplus')) {
    return Semantic.builders.minusplus([left, ...args], loc);
  }
  const [first, ...rest] = args.map((arg, index) => {
    switch (ops[index]) {
      case 'plusminus':
        return Semantic.builders.unaryplusminus(arg, arg.loc);
      case 'minusplus':
        return Semantic.builders.unaryminusplus(arg, arg.loc);
      default:
        return arg;
    }
  });
  return Semantic.builders.add([left, first, ...rest], loc);
};

const parseNaryInfix =
  (op: NAryOperator) =>
  (parser: EditorParser, left: Semantic.types.Node): Semantic.types.Node => {
    const ops: NAryOperator[] = [];
    const [right, ...rest] = parseNaryArgs(parser, op, ops);
    const loc = locFromRange(
      left.loc,
      rest.length > 0 ? rest[rest.length - 1].loc : right.loc,
    );

    switch (op) {
      case 'add':
      case 'sub':
      case 'plusminus':
      case 'minusplus':
        return buildAddChain(left, [right, ...rest], ops, loc);
      case 'mul.imp':
        return Semantic.builders.mul([left, right, ...rest], true, loc);
      case 'mul.exp':
        return Semantic.builders.mul([left, right, ...rest], false, loc);
      case 'eq':
        return Semantic.builders.eq([left, right, ...rest], loc);
      case 'neq':
        return Semantic.builders.neq([left, right, ...rest], loc);
      case 'lt':
        return Semantic.builders.lt([left, right, ...rest], loc);
      case 'lte':
        return Semantic.builders.lte([left, right, ...rest], loc);
      case 'gt':
        return Semantic.builders.gt([left, right, ...rest], loc);
      case 'gte':
        return Semantic.builders.gte([left, right, ...rest], loc);
      case 'comma':
        return Semantic.builders.sequence([left, right, ...rest], loc);
      case 'subset':
        return Semantic.builders.subset([left, right, ...rest], loc);
      case 'propersubset':
        return Semantic.builders.propersubset([left, right, ...rest], loc);
      case 'superset':
        return Semantic.builders.superset([left, right, ...rest], loc);
      case 'propersuperset':
        return Semantic.builders.propersuperset([left, right, ...rest], loc);
      case 'union':
        return Semantic.builders.union([left, right, ...rest], loc);
      case 'intersection':
        return Semantic.builders.intersection([left, right, ...rest], loc);
    }
  };

// The tokens that continue a chain of each n-ary operator other than
// addition and multiplication, e.g. the second `⊂` in `A ⊂ B ⊂ C`.
const CHAIN_TOKENS: Partial<Record<NAryOperator, TokenKind>> = {
  eq: TokenKind.Equal,
  neq: TokenKind.NotEqual,
  // How do we deal with a mix of lt and lte, e.g. x < y <= z?
  lt: TokenKind.LessThan,
  // How do we deal with a mix of gt and gte, e.g. x > y >= z?
  gt: TokenKind.GreaterThan,
  comma: TokenKind.Comma,
  subset: TokenKind.Subset,
  propersubset: TokenKind.ProperSubset,
  superset: TokenKind.Superset,
  propersuperset: TokenKind.ProperSuperset,
  union: TokenKind.Union,
  intersection: TokenKind.Intersection,
};

// Tokens that start an operand that's implicitly multiplied by the one
// before it, so there's no operator token to consume.
const IMPLICIT_MUL_TOKENS: readonly TokenKind[] = [
  TokenKind.Identifier,
  TokenKind.Number,
  TokenKind.SummationOperator,
  TokenKind.ProductOperator,
];

/**
 * Returns an array or one or more nodes that are arguments for the given
 * operator.  All n-ary operators require at least two arguments, but the
 * first argument is already parsed by parseNaryInfix so it makes sense
 * that the return value is one or more.
 */
const parseNaryArgs = (
  parser: EditorParser,
  op: NAryOperator,
  // The operator before each returned arg is appended to this.
  ops: NAryOperator[] = [],
): OneOrMore<Semantic.types.Node> => {
  // TODO: handle implicit multiplication
  const node = parser.peek();
  ops.push(op);
  if (node.type === 'token') {
    if (IMPLICIT_MUL_TOKENS.includes(node.name)) {
      // implicit multiplication - there is no token to consume
    } else {
      // an explicit operation, e.g. plus, times, etc.
      parser.consume();
    }
    let expr = parser.parseWithOperator(op);
    if (op === 'sub') {
      const loc = locFromRange(node.loc, expr.loc);
      expr = Semantic.builders.neg(expr, true, loc);
    }
    const nextToken = parser.peek();
    if (nextToken.type !== 'token') {
      throw new Error('atom expected');
    }
    const addOp = ADD_CHAIN_OPS[nextToken.name];
    if (
      (op === 'add' ||
        op === 'sub' ||
        op === 'plusminus' ||
        op === 'minusplus') &&
      addOp
    ) {
      return [expr, ...parseNaryArgs(parser, addOp, ops)];
    } else if (op === 'mul.exp' && nextToken.name === TokenKind.Times) {
      return [expr, ...parseNaryArgs(parser, op, ops)];
    } else if (
      op === 'mul.imp' &&
      nextToken.name === TokenKind.Identifier &&
      // A function ends the argument of an enclosing function, e.g. in
      // `\sin 2x \cos x`, so it's handled by its own infix parselet.
      !isFunctionToken(nextToken) &&
      !isModToken(nextToken)
    ) {
      return [expr, ...parseNaryArgs(parser, op, ops)];
    } else if (CHAIN_TOKENS[op] === nextToken.name) {
      return [expr, ...parseNaryArgs(parser, op, ops)];
    } else {
      return [expr];
      // TODO: deal with frac, subsup, etc.
    }
  } else if (node.type === 'root') {
    parser.consume();
    const [index, radicand] = node.children;
    const expr =
      index === null
        ? Semantic.builders.sqrt(
            editorParser.parse(radicand.children),
            node.loc,
          )
        : Semantic.builders.root(
            editorParser.parse(radicand.children),
            editorParser.parse(index.children),
            false,
            node.loc,
          );
    const nextToken = parser.peek();
    if (nextToken.type === 'root' || isIdentifier(nextToken)) {
      return [expr, ...parseNaryArgs(parser, 'mul.imp', ops)];
    } else {
      return [expr];
    }
  } else if (node.type === 'frac') {
    parser.consume();
    const [num, den] = node.children;
    const expr = Semantic.builders.div(
      editorParser.parse(num.children),
      editorParser.parse(den.children),
      node.loc,
    );
    return [expr];
  } else if (node.type === 'delimited') {
    parser.consume();
    // TODO: make 'eol' its own token type instead of a co-opting 'atom'
    const nextToken = parser.peek();
    const expr = parseDelimited(node);

    return nextToken.type === 'delimited'
      ? [expr, ...parseNaryArgs(parser, op, ops)]
      : [expr];
  } else if (node.type === NodeType.Limits) {
    // A sum, product or limit, whose prefix parselet consumes the node.
    return [parser.parseWithOperator(op)];
  } else {
    throw new Error(`we don't handle ${node.type} tokens yet`);
    // TODO: deal with frac, subsup, etc.
  }
};

// The operators of the tokens that continue a chain of additions.
const ADD_CHAIN_OPS: Partial<Record<TokenKind, NAryOperator>> = {
  [TokenKind.Plus]: 'add',
  [TokenKind.Minus]: 'sub',
  [TokenKind.PlusMinus]: 'plusminus',
  [TokenKind.MinusPlus]: 'minusplus',
};

/**
 * Returns a parselet for the binary set membership relations: `x ∈ A` and
 * `x ∉ A`, and `A ∋ x` and `A ∌ x`, which are the same relations with their
 * arguments swapped.
 */
const parseMembership =
  (kind: TokenKind) =>
  (parser: EditorParser, left: Semantic.types.Node): Semantic.types.Node => {
    parser.consume(); // the relation
    const right = parser.parseWithOperator('in');
    const loc = locFromRange(left.loc, right.loc);
    switch (kind) {
      case TokenKind.ElementOf:
        return Semantic.builders.in(left, right, loc);
      case TokenKind.NotElementOf:
        return Semantic.builders.notin(left, right, loc);
      case TokenKind.Contains:
        return Semantic.builders.in(right, left, loc);
      default:
        return Semantic.builders.notin(right, left, loc);
    }
  };

const getInfixParselet = (
  node: TokenNode,
): Parser.InfixParselet<TokenNode, Semantic.types.Node, Operator> | null => {
  switch (node.type) {
    case 'token': {
      switch (node.name) {
        case TokenKind.Plus:
          return { op: 'add', parse: parseNaryInfix('add') };
        case TokenKind.Minus:
          return { op: 'add', parse: parseNaryInfix('sub') };
        case TokenKind.PlusMinus:
          return {
            op: 'plusminus',
            parse: parseNaryInfix('plusminus'),
          };
        case TokenKind.MinusPlus:
          return {
            op: 'minusplus',
            parse: parseNaryInfix('minusplus'),
          };
        case TokenKind.ElementOf:
        case TokenKind.NotElementOf:
        case TokenKind.Contains:
        case TokenKind.NotContains:
          return { op: 'in', parse: parseMembership(node.name) };
        case TokenKind.Subset:
          return { op: 'subset', parse: parseNaryInfix('subset') };
        case TokenKind.ProperSubset:
          return { op: 'propersubset', parse: parseNaryInfix('propersubset') };
        case TokenKind.Superset:
          return { op: 'superset', parse: parseNaryInfix('superset') };
        case TokenKind.ProperSuperset:
          return {
            op: 'propersuperset',
            parse: parseNaryInfix('propersuperset'),
          };
        case TokenKind.Union:
          return { op: 'union', parse: parseNaryInfix('union') };
        case TokenKind.Intersection:
          return { op: 'intersection', parse: parseNaryInfix('intersection') };
        case TokenKind.SummationOperator:
        case TokenKind.ProductOperator:
          return { op: 'mul.imp', parse: parseNaryInfix('mul.imp') };
        case TokenKind.RightArrow:
          return unsupported('\u2192');
        case TokenKind.Times:
          return { op: 'mul.exp', parse: parseNaryInfix('mul.exp') };
        case TokenKind.Divide:
          return {
            op: 'div.exp',
            parse: (parser, left): Semantic.types.Node => {
              parser.consume(); // '÷'
              // Division is left associative: a÷b÷c is (a÷b)÷c.
              const right = parser.parseWithOperator('div.exp');
              const loc = locFromRange(left.loc, right.loc);
              return Semantic.builders.div(left, right, loc);
            },
          };
        case TokenKind.Equal:
          return { op: 'eq', parse: parseNaryInfix('eq') };
        case TokenKind.NotEqual:
          return { op: 'neq', parse: parseNaryInfix('neq') };
        case TokenKind.LessThan:
          return { op: 'lt', parse: parseNaryInfix('lt') };
        case TokenKind.LessThanOrEqual:
          return { op: 'lte', parse: parseNaryInfix('lte') };
        case TokenKind.GreaterThan:
          return { op: 'gt', parse: parseNaryInfix('gt') };
        case TokenKind.GreaterThanOrEqual:
          return { op: 'gte', parse: parseNaryInfix('gte') };
        case TokenKind.Identifier:
          if (node.value === 'mod') {
            return {
              op: 'mod',
              parse: (parser, left): Semantic.types.Node => {
                parser.consume(); // 'mod'
                // Like division, mod is left associative.
                const right = parser.parseWithOperator('mod');
                const loc = locFromRange(left.loc, right.loc);
                return Semantic.builders.mod(left, right, loc);
              },
            };
          }
          if (isFunctionName(node.value)) {
            return {
              op: 'mul.func',
              parse: (parser, left): Semantic.types.Node => {
                const result = parseNaryInfix('mul.imp')(parser, left);
                // Flatten 2x\sin x to mul(2, x, sin(x)).
                if (
                  result.type === Semantic.NodeType.Mul &&
                  left.type === Semantic.NodeType.Mul &&
                  left.implicit &&
                  result.args[0] === left
                ) {
                  return Semantic.builders.mul(
                    [...left.args, ...result.args.slice(1)],
                    true,
                    result.loc,
                  );
                }
                return result;
              },
            };
          }
          return { op: 'mul.imp', parse: parseNaryInfix('mul.imp') };
        case TokenKind.Number:
          return { op: 'mul.imp', parse: parseNaryInfix('mul.imp') };
        case TokenKind.Comma:
          return { op: 'comma', parse: parseNaryInfix('comma') };
        default:
          return null;
      }
    }
    case NodeType.SubSup: {
      // TODO: we need to look the previous node so we know if we should
      // be generating a sum or product node or an exponent node.  It also
      // means we have to replace the current last.  It's essentially a
      // postfix operator like ! (factorial).
      // TODO: determine the "op" based on what left is, but we can't currently do that
      return {
        op: 'supsub',
        parse: (parser: EditorParser, left: Semantic.types.Node) => {
          parser.consume(); // consume the subsup
          const [sub, sup] = node.children;

          if (left.type === 'Identifier') {
            if (sub) {
              left = {
                ...left,
                subscript: editorParser.parse(sub.children),
              };
            }
          } else {
            if (sub) {
              throw new Error('subscripts are only allowed on identifiers');
            }
          }

          if (sup) {
            const loc = locFromRange(
              left.loc,
              left.loc,
            ) as Mutable<SourceLocation>;
            if (loc) {
              // Add 1 to account for the subsup itself since left
              // is the node the supsub is being applied to
              loc.end += 1;
            }

            // Exponents are right associative: x^y^z is x^(y^z).
            const exps = [editorParser.parse(sup.children)];
            for (;;) {
              const next = parser.peek();
              if (
                next.type !== NodeType.SubSup ||
                next.children[0] ||
                !next.children[1]
              ) {
                break;
              }
              parser.consume();
              exps.push(editorParser.parse(next.children[1].children));
              if (loc) {
                loc.end += 1;
              }
            }
            const exp = exps.reduceRight((acc, base) =>
              Semantic.builders.pow(base, acc),
            );

            return Semantic.builders.pow(left, exp, loc);
          }

          return left;
        },
      };
    }
    case NodeType.Root: {
      return { op: 'mul.imp', parse: parseNaryInfix('mul.imp') };
    }
    case NodeType.Frac: {
      return {
        op: 'mul.imp',
        parse: (parser, left): Semantic.types.Node => {
          const parselet = parseNaryInfix('mul.imp');
          if (left.type === Semantic.NodeType.Div) {
            throw new Error('An operator is required between fractions');
          }
          return parselet(parser, left);
        },
      };
    }
    case NodeType.Delimited: {
      return {
        // TODO: figure out how to return a different value for 'op' if
        // the delimited node stands for something else like function
        // arguments.
        op: 'mul.imp',
        parse: (parser, left): Semantic.types.Node => {
          const parselet = parseNaryInfix('mul.imp');
          // TODO: check the left.type can be implicitly multiplied
          // with parens.
          return parselet(parser, left);
        },
      };
    }
    case NodeType.Limits:
      return { op: 'mul.imp', parse: parseNaryInfix('mul.imp') };
    case NodeType.Accent:
      return unsupported(`\\${node.accent}`);
    case NodeType.Table:
    case NodeType.Row:
    case NodeType.Macro:
      throw new Error(`Unexpected '${node.type}' token`);
    default:
      throw new UnreachableCaseError(node);
  }
};

const getOpPrecedence = (op: Operator): number => {
  switch (op) {
    case 'nul':
      return 0;
    case 'comma':
      return 1;
    case 'eq':
    case 'neq':
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte':
    case 'in':
    case 'subset':
    case 'propersubset':
    case 'superset':
    case 'propersuperset':
      return 2;
    case 'add':
    case 'sub':
    case 'plusminus':
    case 'minusplus':
    case 'union':
      return 3;
    // Intersection binds more tightly than union, so `A ∪ B ∩ C` is
    // `A ∪ (B ∩ C)`.
    case 'intersection':
      return 4;
    case 'mul.exp':
    case 'div.exp':
    case 'mod':
      return 5;
    case 'div': // this is to encourage wrapping fractions in parens before a negative
      return 6;
    case 'neg':
      return 7;
    // 'mul.func' is implicit multiplication by a function, e.g. the `\cos` in
    // `\sin x \cos x`, and 'func.arg' is the precedence a function's argument
    // is parsed with.  They're equal, so a function ends the previous
    // function's argument.  They're above 'neg', so `-x\sin x` is
    // `-(x sin x)` like `-xy` is `-(xy)`, and below 'mul.imp', so `\sin 2x`
    // is `sin(2x)`.
    case 'mul.func':
    case 'func.arg':
      return 8;
    case 'mul.imp':
      return 9;
    case 'supsub':
      return 10;
  }
};

const EOL: TokenNode = Lexer.atom(
  { type: 'token', name: TokenKind.EOL },
  Lexer.location([], -1, -1),
);

export const editorParser = Parser.parserFactory<
  TokenNode,
  Semantic.types.Node,
  Operator
>(getPrefixParselet, getInfixParselet, getOpPrecedence, EOL);

// WARNING: This function mutates `node`.
const removeExcessParens = (node: Semantic.types.Node): Semantic.types.Node => {
  const path: Semantic.types.Node[] = [];

  return Semantic.util.traverse(node, {
    enter: (node) => {
      path.push(node);
    },
    exit: (node) => {
      path.pop();
      const parent = path[path.length - 1];
      if (!parent) {
        return;
      }

      // TODO: use the precedence of the operators to determine whether
      // the parens are necessary or not.
      if (node.type === 'Parens') {
        const { arg } = node;
        if (parent.type === Semantic.NodeType.Parens) {
          return;
        }
        if (parent.type === Semantic.NodeType.Mul && parent.implicit) {
          return arg;
        }
        if (
          arg.type === Semantic.NodeType.Identifier ||
          arg.type === Semantic.NodeType.Number
        ) {
          return;
        }
        if (
          arg.type === Semantic.NodeType.Mul &&
          parent.type === Semantic.NodeType.Add
        ) {
          return;
        }
        if (
          arg.type === Semantic.NodeType.Neg &&
          parent.type !== Semantic.NodeType.Power
        ) {
          return;
        }
        return arg;
      }
    },
  });
};

/**
 * Parses an editor tree into a semantic tree.
 *
 * Throws an error if `input` is empty, contains a char it doesn't recognize,
 * or isn't a valid expression.
 *
 * Relations are n-ary.  A chain of the same relation is parsed as a single
 * node with one arg per side, e.g. `2x=5=100` becomes an `Equals` node with
 * three args: `2x`, `5`, and `100`.  Callers that expect exactly two sides
 * should check `args.length`.
 */
export const parse = (input: CharRow): Semantic.types.Node => {
  const tokenRow = Lexer.lexRow(input);
  if (tokenRow.children.length === 0) {
    throw new Error('Empty input');
  }
  // The Semantic types have more restrictions on where certain node types can appear.
  // TODO(#862): check that the result of editorParser.parse() follows those
  // restrictions.
  const result = editorParser.parse(tokenRow.children);

  return removeExcessParens(result);
};
