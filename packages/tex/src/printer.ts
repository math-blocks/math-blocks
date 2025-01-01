import { types, NodeType } from '@math-blocks/editor';
import { UnreachableCaseError } from '@math-blocks/core';

import { macros } from './macros';

const invertedMacros: Record<string, string> = {};
for (const [key, value] of Object.entries(macros)) {
  invertedMacros[value.toLowerCase()] = key;
}

type Options = {
  // Use simple delimiters like (, ), [, ], {, }, etc.
  // This is primarily used it testing.
  readonly simpleDelimiters?: boolean;
};

export const print = (node: types.CharNode, options: Options = {}): string => {
  const _print = (node: types.CharNode): string => {
    switch (node.type) {
      case 'char': {
        if (node.value === '\u2212') {
          return '-';
        }
        if (node.value === '\u00b7') {
          return '*';
        }
        if (node.value in invertedMacros) {
          return `\\${invertedMacros[node.value]}`;
        }
        return node.value;
      }
      case NodeType.Row: {
        return node.children.map(_print).join('');
      }
      case NodeType.Delimited: {
        const left = options.simpleDelimiters
          ? _print(node.leftDelim)
          : `\\left${_print(node.leftDelim)}`;
        const right = options.simpleDelimiters
          ? _print(node.rightDelim)
          : `\\right${_print(node.rightDelim)}`;
        const inner = _print(node.children[0]);
        return `${left}${inner}${right}`;
      }
      case NodeType.Accent: {
        return `\\${node.accent}{${_print(node.children[0])}}`;
      }
      case NodeType.Macro: {
        return `${_print(node.children[0])}`;
      }
      case NodeType.Table: {
        return '';
      }
      case NodeType.SubSup: {
        const [sub, sup] = node.children;
        if (sub && sup) {
          return `_{${_print(sub)}}^{${_print(sup)}}`;
        } else if (sub) {
          return `_{${_print(sub)}}`;
        } else if (sup) {
          return `^{${_print(sup)}}`;
        } else {
          return '';
        }
      }
      // TODO: get rid of limites and use sub/sup instead
      case NodeType.Limits: {
        const [sub, sup] = node.children;
        const inner = _print(node.inner);
        return sup
          ? `${inner}_{${_print(sub)}}^{${_print(sup)}}`
          : `${inner}_{${_print(sub)}}`;
      }
      case NodeType.Frac: {
        const numerator = _print(node.children[0]);
        const denominator = _print(node.children[1]);
        return `\\frac{${numerator}}{${denominator}}`;
      }
      case NodeType.Root: {
        const radicand = _print(node.children[1]);
        return node.children[0]
          ? `\\sqrt[${_print(node.children[0])}]{${radicand}}`
          : `\\sqrt{${radicand}}`;
      }
      default: {
        throw new UnreachableCaseError(node);
      }
    }
  };

  return _print(node);
};
