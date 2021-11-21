import { UnreachableCaseError } from '@math-blocks/core';

import { NodeType } from '../shared-types';
import { TokenKind } from './types';
import type { TokenNode } from './types';

const print = (
  val: unknown,
  serialize: (ast: TokenNode) => string,
  indent: (str: string) => string,
): string => {
  const ast = val as TokenNode;
  const { loc } = ast;
  switch (ast.type) {
    case 'token': {
      switch (ast.name) {
        case TokenKind.Number:
          return `(${ast.name}@[${loc.path.map(String).join(',')}]:${
            loc.start
          }:${loc.end} ${ast.value})`;
        case TokenKind.Identifier:
          return `(${ast.name}@[${loc.path.map(String).join(',')}]:${
            loc.start
          }:${loc.end} ${ast.value})`;
        default:
          return `${ast.name}@[${loc.path.map(String).join(',')}]:${
            loc.start
          }:${loc.end}`;
      }
    }
    case NodeType.Frac: {
      const [numerator, denominator] = ast.children;
      return `(frac@[${loc.path.map(String).join(',')}]:${loc.start}:${
        loc.end
      } ${print(numerator, serialize, indent)} ${print(
        denominator,
        serialize,
        indent,
      )})`;
    }
    case NodeType.Row: {
      return `(row ${ast.children
        .map((child) => '\n' + indent(print(child, serialize, indent)))
        .join(' ')})`;
    }
    case NodeType.SubSup: {
      const [sub, sup] = ast.children;
      return `(subsup@[${loc.path.map(String).join(',')}]:${loc.start}:${
        loc.end
      } ${sub ? print(sub, serialize, indent) : '^'} ${
        sup ? print(sup, serialize, indent) : '_'
      })`;
    }
    case NodeType.Limits: {
      const inner = print(ast.inner, serialize, indent);
      const [lower, upper] = ast.children;
      return `(limits{${inner}}@[${loc.path.map(String).join(',')}]:${
        loc.start
      }:${loc.end} ${print(lower, serialize, indent)} ${
        upper ? print(upper, serialize, indent) : '_'
      })`;
    }
    case NodeType.Root: {
      const [index, radicand] = ast.children;
      return `(root@[${loc.path.map(String).join(',')}]:${loc.start}:${
        loc.end
      } ${print(radicand, serialize, indent)} ${
        index ? print(index, serialize, indent) : '_'
      })`;
    }
    case NodeType.Delimited: {
      const inner = print(ast.children[0], serialize, indent);
      const open = print(ast.leftDelim, serialize, indent);
      const close = print(ast.rightDelim, serialize, indent);

      return `(delimited@[${loc.path.map(String).join(',')}]:${loc.start}:${
        loc.end
      } ${open} ${inner} ${close})`;
    }
    case NodeType.Table: {
      const children = ast.children.map(
        (child) => child && print(child, serialize, indent),
      );
      return `(table@[${loc.path.map(String).join(',')}]:${loc.start}:${
        loc.end
      } ${children.join(' ')})`;
    }
    case NodeType.Macro: {
      throw new Error('TODO: add support for serializing Macro nodes');
    }
    default:
      throw new UnreachableCaseError(ast);
  }
};

export const serializer = {
  print: print,
  test: (ast: TokenNode): boolean => !!ast.type,
};
