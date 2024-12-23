/**
 * Converts a Semantic AST to an Editor AST.
 */
import * as Semantic from '@math-blocks/semantic';

import * as types from '../char/types';
import * as builders from '../char/builders';

// TODO: when parsing editor nodes provide some way to link to the IDs of
// the original nodes, even if they don't appear in the semantic tree as
// is the case with most operators

const getChildren = (
  expr: Semantic.types.Node,
  oneToOne: boolean,
): types.CharNode[] => {
  const children: types.CharNode[] = [];

  const node = _print(expr, oneToOne);
  if (node.type === 'row') {
    children.push(...node.children);
  } else {
    children.push(node);
  }

  return children;
};

const separators = {
  [Semantic.NodeType.Equals]: '=',
  [Semantic.NodeType.LessThan]: '<',
  [Semantic.NodeType.GreaterThan]: '>',
  [Semantic.NodeType.LessThanOrEquals]: '\u2264',
  [Semantic.NodeType.GreaterThanOrEquals]: '\u2265',
  ['Sequence']: ', ',
};

// TODO: write more tests for this
const _print = (
  expr: Semantic.types.Node,
  oneToOne: boolean,
): types.CharNode => {
  switch (expr.type) {
    case Semantic.NodeType.Identifier: {
      // TODO: handle multi-character identifiers, e.g. sin, cos, etc.
      // TODO: handle subscripts

      return builders.char(expr.name);
    }
    case Semantic.NodeType.Number: {
      // How do we avoid creating a bunch of ids that we immediately
      // throw away because this number is part of a larger expression
      // and thus contained within a larger row?
      return builders.row(
        expr.value.split('').map((char) => builders.char(char)),
      );
    }
    case Semantic.NodeType.Add: {
      const children: types.CharNode[] = [];

      for (let i = 0; i < expr.args.length; i++) {
        const arg = expr.args[i];
        if (i > 0) {
          if (arg.type === Semantic.NodeType.Neg && arg.subtraction) {
            children.push(builders.char('\u2212'));
          } else {
            children.push(builders.char('+'));
          }
        } else {
          if (arg.type === Semantic.NodeType.Neg && arg.subtraction) {
            console.warn('leading subtraction term should be simple negation');
            children.push(builders.char('\u2212'));
          }
        }

        // number is returned as a row so if we do this check, every
        // number will be encapsulated in parens.
        const node = _print(arg, oneToOne);
        if (node.type === 'row') {
          const inner =
            arg.type === Semantic.NodeType.Neg && arg.subtraction
              ? // strip off the leading "-"
                node.children.slice(1)
              : node.children;

          if (arg.type === Semantic.NodeType.Add) {
            children.push(
              builders.delimited(inner, builders.char('('), builders.char(')')),
            );
          } else {
            children.push(...inner);
          }
        } else {
          children.push(node);
        }
      }

      return builders.row(children);
    }
    case Semantic.NodeType.Mul: {
      const children: types.CharNode[] = [];

      const wrapAll = expr.args.some((arg, index) => {
        if (arg.type === Semantic.NodeType.Number && index > 0) {
          return true;
        }
        if (arg.type === Semantic.NodeType.Neg && (index > 0 || oneToOne)) {
          return true;
        }
        if (arg.type === Semantic.NodeType.Div && expr.implicit && index > 0) {
          return true;
        }
        if (arg.type === Semantic.NodeType.Mul && expr.implicit) {
          return true;
        }
        return false;
      });

      for (const arg of expr.args) {
        // TODO: we probably also want to wrap things like (a * b)(x * y)
        const wrap =
          (wrapAll && expr.implicit) || arg.type === Semantic.NodeType.Add;

        if (wrap) {
          children.push(
            builders.delimited(
              getChildren(arg, oneToOne),
              builders.char('('),
              builders.char(')'),
            ),
          );
        } else {
          children.push(...getChildren(arg, oneToOne));
        }

        if (!expr.implicit) {
          children.push(builders.char('\u00B7'));
        }
      }

      if (!expr.implicit) {
        children.pop(); // remove extra "*"
      }

      return builders.row(children);
    }
    case Semantic.NodeType.Neg: {
      if (
        expr.arg.type === Semantic.NodeType.Number ||
        expr.arg.type === Semantic.NodeType.Identifier ||
        expr.arg.type === Semantic.NodeType.Div ||
        (expr.arg.type === Semantic.NodeType.Neg && !expr.arg.subtraction) ||
        (expr.arg.type === Semantic.NodeType.Mul && expr.arg.implicit) ||
        expr.arg.type === Semantic.NodeType.Power // pow has a higher precedence
      ) {
        return builders.row([
          builders.char('\u2212'),
          ...getChildren(expr.arg, oneToOne),
        ]);
      } else {
        return builders.row([
          builders.char('\u2212'),
          builders.delimited(
            getChildren(expr.arg, oneToOne),
            builders.char('('),
            builders.char(')'),
          ),
        ]);
      }
    }
    case Semantic.NodeType.Div: {
      const numerator = _print(expr.args[0], oneToOne);
      const denominator = _print(expr.args[1], oneToOne);
      return builders.frac(
        numerator.type === 'row' ? numerator.children : [numerator],
        denominator.type === 'row' ? denominator.children : [denominator],
      );
    }
    case Semantic.NodeType.LessThan:
    case Semantic.NodeType.LessThanOrEquals:
    case Semantic.NodeType.GreaterThan:
    case Semantic.NodeType.GreaterThanOrEquals:
    case Semantic.NodeType.Equals:
    case 'Sequence': {
      const children: types.CharNode[] = [];
      const separator = separators[expr.type];

      for (const arg of expr.args) {
        children.push(...getChildren(arg, oneToOne));
        children.push(builders.char(separator));
      }

      children.pop(); // remove extra "="

      return builders.row(children);
    }
    case Semantic.NodeType.Power: {
      const { base, exp } = expr;

      if (
        base.type === Semantic.NodeType.Identifier ||
        base.type === Semantic.NodeType.Number
      ) {
        return builders.row([
          ...getChildren(base, oneToOne),
          builders.subsup(undefined, getChildren(exp, oneToOne)),
        ]);
      } else {
        return builders.row([
          builders.delimited(
            getChildren(base, oneToOne),
            builders.char('('),
            builders.char(')'),
          ),
          builders.subsup(undefined, getChildren(exp, oneToOne)),
        ]);
      }
    }
    case Semantic.NodeType.Parens: {
      const children: types.CharNode[] = [
        builders.delimited(
          getChildren(expr.arg, oneToOne),
          builders.char('('),
          builders.char(')'),
        ),
      ];

      return builders.row(children);
    }
    default: {
      throw new Error(`print doesn't handle ${expr.type} nodes yet`);
    }
  }
};

/**
 * Convert Semantic tree to CharNode tree.
 * @param {Semantic.types.Node} expr
 * @param {boolean} oneToOne TODO: document this
 * @returns {Editor.types.CharRow}
 */
export const print = (
  expr: Semantic.types.Node,
  oneToOne = false,
): types.CharRow => {
  const node = _print(expr, oneToOne);
  if (node.type === 'row') {
    return node;
  }
  return builders.row([node]);
};
