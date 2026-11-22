import * as Editor from '@math-blocks/editor';
import { glyphGroupsForText } from '@math-blocks/opentype';

import { AccentMap } from './typesetters/accent';
import { getMathItalicChar } from './typesetters/atom';

const { NodeType } = Editor;

// Characters the typesetter draws for a node besides its char children.
const extraChars = (node: Editor.types.CharNode): string[] => {
  switch (node.type) {
    case 'char':
      // Latin lowercase letters are drawn in math italic outside of named
      // operators and macros, which use the letter itself.
      return /^[a-z]$/.test(node.value)
        ? [node.value, getMathItalicChar(node.value)]
        : [node.value];
    case NodeType.Delimited:
      return [node.leftDelim.value, node.rightDelim.value];
    case NodeType.Accent:
      return [AccentMap[node.accent]];
    case NodeType.Macro:
      return ['\\'];
    case NodeType.Root:
      return ['√'];
    case NodeType.Table:
      return node.delimiters
        ? [node.delimiters.left.value, node.delimiters.right.value]
        : [];
    default:
      return [];
  }
};

/**
 * Returns the names of the glyph groups (see `glyphGroups` in
 * @math-blocks/opentype) needed to typeset `node`, in `glyphGroups` order.
 * This includes characters the typesetter draws that aren't in the tree as
 * characters, such as accents, the radical sign and math-italic letters.
 *
 * Use it to work out which font subsets to load before rendering an
 * expression.
 */
export const glyphGroupsForRow = (node: Editor.types.CharNode): string[] => {
  const chars: string[] = [];
  const visit = (current: Editor.types.CharNode): void => {
    chars.push(...extraChars(current));
    if (current.type === NodeType.Limits) {
      visit(current.inner);
    }
    if ('children' in current) {
      for (const child of current.children) {
        if (child) {
          visit(child);
        }
      }
    }
  };
  visit(node);
  return glyphGroupsForText(chars.join(''));
};
