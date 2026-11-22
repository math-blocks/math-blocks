import { types } from '@math-blocks/semantic';
import { print as texPrint, parse as texParse } from '@math-blocks/tex';
import {
  print as editorPrint,
  parse as editorParse,
} from '@math-blocks/editor';

export const print = (node: types.Node): string => {
  return texPrint(editorPrint(node), { simpleDelimiters: true });
};

export const parse = (str: string): types.Node => {
  const row = texParse(
    str
      .replaceAll('(', '\\left(')
      .replaceAll(')', '\\right)')
      .replaceAll('-', '\u2212'),
  );
  return editorParse(row);
};

/**
 * Takes SVG markup from renderToStaticMarkup() and replaces each glyph <use>
 * with the <path> it references: the same attributes, with `href` replaced by
 * the definition's `d`. The <defs> block is removed. This is the markup
 * SceneRenderer produced before it deduplicated glyph outlines.
 *
 * Throws if a <use> references a missing definition or if a definition is
 * never used.
 */
export const expandGlyphUses = (svg: string): string => {
  const defs = new Map<string, string>();
  const unused = new Set<string>();

  const withoutDefs = svg.replace(
    /<defs>(.*?)<\/defs>/gs,
    (_, content: string) => {
      const rest = content.replace(
        /<path id="([^"]+)" d="([^"]*)"><\/path>/g,
        (_match: string, id: string, d: string) => {
          if (defs.has(id)) {
            throw new Error(`duplicate glyph definition: ${id}`);
          }
          defs.set(id, d);
          unused.add(id);
          return '';
        },
      );
      if (rest !== '') {
        throw new Error(`unexpected content in <defs>: ${rest}`);
      }
      return '';
    },
  );

  const expanded = withoutDefs.replace(
    /<use ([^>]*?)href="#([^"]+)"([^>]*)><\/use>/g,
    (_, before: string, id: string, after: string) => {
      const d = defs.get(id);
      if (d === undefined) {
        throw new Error(`<use> references missing definition: ${id}`);
      }
      unused.delete(id);
      return `<path ${before}d="${d}"${after}></path>`;
    },
  );

  if (/<use[\s>]/.test(expanded)) {
    throw new Error('found a <use> that does not reference a glyph');
  }
  if (unused.size > 0) {
    throw new Error(`unused glyph definitions: ${[...unused].join(', ')}`);
  }

  return expanded;
};
