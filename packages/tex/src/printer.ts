import { types, NodeType } from '@math-blocks/editor';
import { UnreachableCaseError } from '@math-blocks/core';

import { macros } from './macros';

const invertedMacros: Record<string, string> = {};
for (const [key, value] of Object.entries(macros)) {
  invertedMacros[value.toLowerCase()] = key;
}

export const print = (node: types.CharNode): string => {
  switch (node.type) {
    case 'char': {
      if (node.value in invertedMacros) {
        return `\\${invertedMacros[node.value]}`;
      }
      return node.value;
    }
    case NodeType.Row: {
      return node.children.map(print).join('');
    }
    case NodeType.Delimited: {
      const left = `\\left${print(node.leftDelim)}`;
      const right = `\\right${print(node.rightDelim)}`;
      const inner = print(node.children[0]);
      return `${left}${inner}${right}`;
    }
    case NodeType.Accent: {
      return `\\${node.accent}{${print(node.children[0])}}`;
    }
    case NodeType.Macro: {
      return `${print(node.children[0])}`;
    }
    case NodeType.Table: {
      return '';
    }
    case NodeType.SubSup: {
      const [sub, sup] = node.children;
      if (sub && sup) {
        return `_{${print(sub)}}^{${print(sup)}}`;
      } else if (sub) {
        return `_{${print(sub)}}`;
      } else if (sup) {
        return `^{${print(sup)}}`;
      } else {
        return '';
      }
    }
    // TODO: get rid of limites and use sub/sup instead
    case NodeType.Limits: {
      const [sub, sup] = node.children;
      const inner = print(node.inner);
      return sup
        ? `${inner}_{${print(sub)}}^{${print(sup)}}`
        : `${inner}_{${print(sub)}}`;
    }
    case NodeType.Frac: {
      const numerator = print(node.children[0]);
      const denominator = print(node.children[1]);
      return `\\frac{${numerator}}{${denominator}}`;
    }
    case NodeType.Root: {
      const radicand = print(node.children[1]);
      return node.children[0]
        ? `\\sqrt[${print(node.children[0])}]{${radicand}}`
        : `\\sqrt{${radicand}}`;
    }
    default: {
      throw new UnreachableCaseError(node);
    }
  }
};
