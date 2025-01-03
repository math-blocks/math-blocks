/**
 * Converts a Semantic AST to an Editor AST.
 */
import { getId } from '@math-blocks/core';
import * as Semantic from '@math-blocks/semantic';

import * as types from '../char/types';
import * as builders from '../char/builders';

const separators = {
  [Semantic.NodeType.Equals]: '=',
  [Semantic.NodeType.LessThan]: '<',
  [Semantic.NodeType.GreaterThan]: '>',
  [Semantic.NodeType.LessThanOrEquals]: '\u2264',
  [Semantic.NodeType.GreaterThanOrEquals]: '\u2265',
  ['Sequence']: ', ',
};

/**
 * Convert Semantic tree to CharNode tree.
 * @param {Semantic.types.Node} expr
 * @param {boolean} oneToOne This affects when to wrap children of a 'Mul' node in parens.
 * @returns {Editor.types.CharRow}
 */
export const print = (
  expr: Semantic.types.Node,
  oneToOne = false,
): types.CharRow => {
  // TODO: handle canceling of terms
  const _print = (
    style: types.Style,
    expr: Semantic.types.Node,
  ): types.CharNode => {
    if (expr.style) {
      style = { ...style, color: expr.style.color };
    }

    const makeChar = (value: string): types.CharAtom => {
      return {
        id: getId(),
        type: 'char',
        value,
        style,
      };
    };

    let result: types.CharNode;

    switch (expr.type) {
      case Semantic.NodeType.Identifier: {
        // TODO: handle multi-character identifiers, e.g. sin, cos, etc.
        // TODO: handle subscripts

        result = makeChar(expr.name);
        break;
      }
      case Semantic.NodeType.Number: {
        // How do we avoid creating a bunch of ids that we immediately
        // throw away because this number is part of a larger expression
        // and thus contained within a larger row?
        result = builders.row(
          expr.value.split('').map((char) => makeChar(char)),
        );
        break;
      }
      case Semantic.NodeType.Add: {
        const children: types.CharNode[] = [];

        for (let i = 0; i < expr.args.length; i++) {
          const arg = expr.args[i];
          if (i > 0) {
            const operator =
              arg.type === Semantic.NodeType.Neg && arg.subtraction
                ? makeChar('\u2212')
                : makeChar('+');
            if (arg.style?.color) {
              operator.style = {
                color: arg.style.color,
              };
            }
            children.push(operator);
          } else {
            if (arg.type === Semantic.NodeType.Neg && arg.subtraction) {
              console.warn(
                'leading subtraction term should be simple negation',
              );
              children.push(makeChar('\u2212'));
            }
          }

          // number is returned as a row so if we do this check, every
          // number will be encapsulated in parens.
          const node = _print(style, arg);
          if (node.type === 'row') {
            const inner =
              arg.type === Semantic.NodeType.Neg && arg.subtraction
                ? // strip off the leading "-"
                  node.children.slice(1)
                : node.children;

            if (arg.type === Semantic.NodeType.Add) {
              children.push(
                builders.delimited(inner, makeChar('('), makeChar(')')),
              );
            } else {
              children.push(...inner);
            }
          } else {
            children.push(node);
          }
        }

        result = builders.row(children);
        break;
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
          if (
            arg.type === Semantic.NodeType.Div &&
            expr.implicit &&
            index > 0
          ) {
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
                _getChildren(style, arg),
                makeChar('('),
                makeChar(')'),
              ),
            );
          } else {
            children.push(..._getChildren(style, arg));
          }

          if (!expr.implicit) {
            children.push(makeChar('\u00B7'));
          }
        }

        if (!expr.implicit) {
          children.pop(); // remove extra "*"
        }

        result = builders.row(children);
        break;
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
          result = builders.row([
            makeChar('\u2212'),
            ..._getChildren(style, expr.arg),
          ]);
        } else {
          result = builders.row([
            makeChar('\u2212'),
            builders.delimited(
              _getChildren(style, expr.arg),
              makeChar('('),
              makeChar(')'),
            ),
          ]);
        }
        break;
      }
      case Semantic.NodeType.Div: {
        const numerator = _print(style, expr.args[0]);
        const denominator = _print(style, expr.args[1]);
        result = builders.frac(
          numerator.type === 'row' ? numerator.children : [numerator],
          denominator.type === 'row' ? denominator.children : [denominator],
        );
        break;
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
          children.push(..._getChildren(style, arg));
          children.push(makeChar(separator));
        }

        children.pop(); // remove extra "="

        result = builders.row(children);
        break;
      }
      case Semantic.NodeType.Power: {
        const { base, exp } = expr;

        if (
          base.type === Semantic.NodeType.Identifier ||
          base.type === Semantic.NodeType.Number
        ) {
          result = builders.row([
            ..._getChildren(style, base),
            builders.subsup(undefined, _getChildren(style, exp)),
          ]);
        } else {
          result = builders.row([
            builders.delimited(
              _getChildren(style, base),
              makeChar('('),
              makeChar(')'),
            ),
            builders.subsup(undefined, _getChildren(style, exp)),
          ]);
        }
        break;
      }
      case Semantic.NodeType.Parens: {
        const children: types.CharNode[] = [
          builders.delimited(
            _getChildren(style, expr.arg),
            makeChar('('),
            makeChar(')'),
          ),
        ];

        result = builders.row(children);
        break;
      }
      default: {
        throw new Error(`print doesn't handle ${expr.type} nodes yet`);
      }
    }

    if (style.color) {
      return {
        ...result,
        style: { ...result.style, color: style.color },
      };
    }
    return result;
  };

  const _getChildren = (
    context: types.Style,
    expr: Semantic.types.Node,
  ): types.CharNode[] => {
    const children: types.CharNode[] = [];

    const node = _print(context, expr);
    if (node.type === 'row') {
      children.push(...node.children);
    } else {
      children.push(node);
    }

    return children;
  };

  const node = _print({}, expr);
  if (node.type === 'row') {
    return node;
  }
  return builders.row([node]);
};
