import data from './glyph-groups.json';

export type GlyphGroup = {
  // Also the subset's file name, e.g. "base" for base.otf.
  readonly name: string;
  readonly description: string;
  // Every code point in the group, in ascending order.
  readonly codePoints: readonly number[];
};

const CODE_POINT_ENTRY = /^U\+([0-9A-F]{4,6})(?:-U\+([0-9A-F]{4,6}))?$/;

const parseCodePoints = (entries: readonly string[]): number[] => {
  const result: number[] = [];
  for (const entry of entries) {
    const match = CODE_POINT_ENTRY.exec(entry);
    if (!match) {
      throw new Error(
        `Invalid code point entry in glyph-groups.json: ${entry}`,
      );
    }
    const start = parseInt(match[1], 16);
    const end = match[2] ? parseInt(match[2], 16) : start;
    for (let cp = start; cp <= end; cp++) {
      result.push(cp);
    }
  }
  return result.sort((a, b) => a - b);
};

/**
 * The groups of characters that the font subsets in assets/subsets/ are split
 * into. Each group is built into its own font file by scripts/subset-fonts.py,
 * and every code point belongs to exactly one group. The first group, "base",
 * covers arithmetic and algebra.
 */
export const glyphGroups: readonly GlyphGroup[] = data.groups.map((group) => ({
  name: group.name,
  description: group.description,
  // The keys are the code points; the values only describe them.
  codePoints: parseCodePoints(Object.keys(group.codePoints)),
}));

const groupByCodePoint = new Map<number, GlyphGroup>();
for (const group of glyphGroups) {
  for (const codePoint of group.codePoints) {
    groupByCodePoint.set(codePoint, group);
  }
}

/**
 * Returns the group that contains the given code point, or undefined if no
 * group does.
 */
export const getGlyphGroup = (codePoint: number): GlyphGroup | undefined =>
  groupByCodePoint.get(codePoint);

/**
 * Returns the names of the groups needed to render the characters in `text`,
 * in the order they appear in `glyphGroups`. Characters that aren't in any
 * group are ignored.
 */
export const glyphGroupsForText = (text: string): string[] => {
  const needed = new Set<GlyphGroup>();
  for (const char of text) {
    const group = groupByCodePoint.get(char.codePointAt(0) as number);
    if (group) {
      needed.add(group);
    }
  }
  return glyphGroups
    .filter((group) => needed.has(group))
    .map((group) => group.name);
};
