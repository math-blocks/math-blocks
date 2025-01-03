import { UnreachableCaseError } from '@math-blocks/core';
import * as Parser from '@math-blocks/parser';
import * as Semantic from '@math-blocks/semantic';
import type { Mutable } from 'utility-types';

import * as Lexer from './lexer';
import { locFromRange } from '../token/util';
import { TokenKind } from '../token/types';

import type { CharRow } from '../char/types';
import type { TokenNode, SourceLocation } from '../token/types';
import { NodeType } from '../shared-types';

// TODO: fill out this list
type Operator =
  | 'add'
  | 'sub'
  | 'plusminus'
  | 'mul.exp'
  | 'div'
  | 'mul.imp'
  | 'neg'
  | 'eq'
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
  | 'mul.exp'
  | 'mul.imp'
  | 'eq'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'comma';

type EditorParser = Parser.IParser<TokenNode, Semantic.types.Node, Operator>;

const isIdentifier = (node: TokenNode): boolean =>
  node.type === 'token' && node.name === TokenKind.Identifier;

const getPrefixParselet = (
  node: TokenNode,
): Parser.PrefixParselet<TokenNode, Semantic.types.Node, Operator> => {
  switch (node.type) {
    case 'token': {
      switch (node.name) {
        case TokenKind.Identifier:
          return {
            parse: () =>
              Semantic.builders.identifier(node.value, undefined, node.loc),
          };
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
        parse: () => {
          const [inner] = node.children;
          const result = editorParser.parse(inner.children);
          // TODO: what should `loc` be here?
          return Semantic.builders.parens(result);
        },
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
      throw new Error(`We don't handle '${node.type}' tokens yet`);
    // TODO: Handle subsup at the start of a row, useful in Chemistry
    // TODO: Handle limits at the start of a row
    case NodeType.SubSup:
    case NodeType.Limits:
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

const parseNaryInfix =
  (op: NAryOperator) =>
  (parser: EditorParser, left: Semantic.types.Node): Semantic.types.Node => {
    const [right, ...rest] = parseNaryArgs(parser, op);
    const loc = locFromRange(
      left.loc,
      rest.length > 0 ? rest[rest.length - 1].loc : right.loc,
    );

    switch (op) {
      case 'add':
      case 'sub':
      case 'plusminus':
        return Semantic.builders.add([left, right, ...rest], loc);
      case 'mul.imp':
        return Semantic.builders.mul([left, right, ...rest], true, loc);
      case 'mul.exp':
        return Semantic.builders.mul([left, right, ...rest], false, loc);
      case 'eq':
        return Semantic.builders.eq([left, right, ...rest], loc);
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
    }
  };

/**
 * Returns an array or one or more nodes that are arguments for the given
 * operator.  All n-ary operators require at least two arguments, but the
 * first argument is already parsed by parseNaryInfix so it makes sense
 * that the return value is one or more.
 */
const parseNaryArgs = (
  parser: EditorParser,
  op: NAryOperator,
): OneOrMore<Semantic.types.Node> => {
  // TODO: handle implicit multiplication
  const node = parser.peek();
  if (node.type === 'token') {
    if (node.name === TokenKind.Identifier || node.name === TokenKind.Number) {
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
    if (
      (op === 'add' || op === 'sub' || op === 'plusminus') &&
      (nextToken.name === TokenKind.Plus ||
        nextToken.name === TokenKind.Minus ||
        nextToken.name === TokenKind.PlusMinus)
    ) {
      if (nextToken.name === TokenKind.Plus) {
        op = 'add';
      } else if (nextToken.name === TokenKind.Minus) {
        op = 'sub';
      } else if (nextToken.name === TokenKind.PlusMinus) {
        op = 'plusminus';
      } else {
        throw new Error('unexpected value for nextAtom.kind');
      }
      return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === 'mul.exp' && nextToken.name === TokenKind.Times) {
      return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === 'mul.imp' && nextToken.name === TokenKind.Identifier) {
      return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === 'eq' && nextToken.name === TokenKind.Equal) {
      return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === 'lt' && nextToken.name === TokenKind.LessThan) {
      // How do we deal wiht a mix of lt and lte, e.g. x < y <= z?
      return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === 'gt' && nextToken.name === TokenKind.GreaterThan) {
      // How do we deal wiht a mix of gt and gte, e.g. x > y >= z?
      return [expr, ...parseNaryArgs(parser, op)];
    } else if (op === 'comma' && nextToken.name === TokenKind.Comma) {
      return [expr, ...parseNaryArgs(parser, op)];
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
      return [expr, ...parseNaryArgs(parser, 'mul.imp')];
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
    const [inner] = node.children;
    // TODO: make 'eol' its own token type instead of a co-opting 'atom'
    const nextToken = parser.peek();
    const expr = Semantic.builders.parens(editorParser.parse(inner.children));

    return nextToken.type === 'delimited'
      ? [expr, ...parseNaryArgs(parser, op)]
      : [expr];
  } else {
    throw new Error(`we don't handle ${node.type} tokens yet`);
    // TODO: deal with frac, subsup, etc.
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
        case TokenKind.Times:
          return { op: 'mul.exp', parse: parseNaryInfix('mul.exp') };
        case TokenKind.Equal:
          return { op: 'eq', parse: parseNaryInfix('eq') };
        case TokenKind.LessThan:
          return { op: 'lt', parse: parseNaryInfix('lt') };
        case TokenKind.LessThanOrEqual:
          return { op: 'lte', parse: parseNaryInfix('lte') };
        case TokenKind.GreaterThan:
          return { op: 'gt', parse: parseNaryInfix('gt') };
        case TokenKind.GreaterThanOrEqual:
          return { op: 'gte', parse: parseNaryInfix('gte') };
        case TokenKind.Identifier:
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

            return Semantic.builders.pow(
              left,
              editorParser.parse(sup.children),
              loc,
            );
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
    case NodeType.Table:
    case NodeType.Accent:
    case NodeType.Limits:
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
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte':
      return 2;
    case 'add':
    case 'sub':
    case 'plusminus':
      return 3;
    case 'mul.exp':
      return 5;
    case 'div': // this is to encourage wrapping fractions in parens before a negative
      return 6;
    case 'neg':
      return 7;
    case 'mul.imp':
      return 8;
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

export const parse = (input: CharRow): Semantic.types.Node => {
  const tokenRow = Lexer.lexRow(input);
  // The Semantic types have more restrictions on where certain node types can appear.
  // We cast for now, but really we should have function that checks that the result of
  // editorParser.parse() follows those restrictions.
  const result = editorParser.parse(tokenRow.children) as Semantic.types.Node;

  return removeExcessParens(result);
};
