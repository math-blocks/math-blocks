import { glyphGroups, getGlyphGroup } from './glyph-groups';

import type { Font, GlyphMetrics } from './types';
import type { Glyph } from './tables/cff-types';
import type { GlyphConstruction, MathVariants } from './tables/math-types';

/**
 * A Font made from the font subsets that have been loaded so far (see
 * `glyphGroups`). It can be used anywhere a Font is expected.
 *
 * Each group gets a fixed slot, its index in `glyphGroups`, and the glyph IDs
 * this font returns are `slot * GLYPH_ID_STRIDE + the glyph's ID in that
 * group's subset`. Because the slot doesn't depend on which groups are loaded
 * or in what order, a glyph ID stays valid after more groups are added.
 */
export type CombinedFont = Font & {
  /** The names of the loaded groups, in `glyphGroups` order. */
  readonly loadedGroups: readonly string[];
  /**
   * Returns a new CombinedFont that also contains the given group's subset.
   * This font is left unchanged.
   */
  readonly withGroup: (name: string, font: Font) => CombinedFont;
};

/** Thrown by `getGlyphID` for a character whose group isn't loaded yet. */
export class GlyphGroupNotLoadedError extends Error {
  /** The name of the group to load, e.g. "calculus". */
  readonly group: string;
  readonly codePoint: number;

  constructor(group: string, codePoint: number) {
    const hex = codePoint.toString(16).toUpperCase().padStart(4, '0');
    super(
      `U+${hex} is in the "${group}" glyph group, which hasn't been loaded`,
    );
    this.name = 'GlyphGroupNotLoadedError';
    this.group = group;
    this.codePoint = codePoint;
  }
}

// OpenType glyph IDs are 16-bit, so local IDs are always below this.
export const GLYPH_ID_STRIDE = 0x10000;

const slotByName = new Map(glyphGroups.map((group, i) => [group.name, i]));

const checkCompatible = (name: string, font: Font, base: Font): void => {
  // Mixing subsets of different fonts would mix their metrics and MATH data.
  if (font.cff.topDict.FamilyName !== base.cff.topDict.FamilyName) {
    throw new Error(
      `Can't add "${name}" from "${font.cff.topDict.FamilyName}" to a ` +
        `combined font made from "${base.cff.topDict.FamilyName}"`,
    );
  }
  if (font.head.unitsPerEm !== base.head.unitsPerEm) {
    throw new Error(
      `"${name}" has ${font.head.unitsPerEm} units per em, but the base ` +
        `font has ${base.head.unitsPerEm}`,
    );
  }
};

const build = (parts: ReadonlyMap<number, Font>): CombinedFont => {
  const base = parts.get(0) as Font;

  const split = (glyphID: number): [Font, number, number] => {
    const slot = Math.floor(glyphID / GLYPH_ID_STRIDE);
    const part = parts.get(slot);
    if (!part) {
      const group = glyphGroups[slot]?.name ?? `slot ${slot}`;
      throw new Error(
        `Glyph ${glyphID} belongs to the "${group}" glyph group, which hasn't been loaded`,
      );
    }
    return [part, slot, glyphID % GLYPH_ID_STRIDE];
  };

  // Size variants and assembly parts are always in the same subset as the
  // character they belong to, so they share its slot.
  const translateConstruction = (
    construction: GlyphConstruction,
    offset: number,
  ): GlyphConstruction => ({
    mathGlyphVariantRecords: construction.mathGlyphVariantRecords.map(
      (record) => ({
        ...record,
        variantGlyph: record.variantGlyph + offset,
      }),
    ),
    glyphAssembly: construction.glyphAssembly && {
      ...construction.glyphAssembly,
      partRecords: construction.glyphAssembly.partRecords.map((part) => ({
        ...part,
        glyphID: part.glyphID + offset,
      })),
    },
  });

  // Memoized like the parser's, so the same glyph ID always returns the same
  // construction object.
  const memoizeConstruction = (
    get: (variants: MathVariants, localID: number) => GlyphConstruction | null,
  ): ((glyphID: number) => GlyphConstruction | null) => {
    const cache = new Map<number, GlyphConstruction | null>();
    return (glyphID) => {
      if (!cache.has(glyphID)) {
        const [part, slot, localID] = split(glyphID);
        const construction = get(part.math.variants, localID);
        cache.set(
          glyphID,
          construction &&
            translateConstruction(construction, slot * GLYPH_ID_STRIDE),
        );
      }
      return cache.get(glyphID) as GlyphConstruction | null;
    };
  };

  const loadedGroups = glyphGroups
    .filter((_, slot) => parts.has(slot))
    .map((group) => group.name);

  return {
    // The name, units per em and MATH constants are the same in every subset
    // of a font, so they come from the base subset.
    cff: base.cff,
    head: base.head,
    math: {
      constants: base.math.constants,
      variants: {
        ...base.math.variants,
        getVertGlyphConstruction: memoizeConstruction((variants, id) =>
          variants.getVertGlyphConstruction(id),
        ),
        getHorizGlyphConstruction: memoizeConstruction((variants, id) =>
          variants.getHorizGlyphConstruction(id),
        ),
      },
      glyphInfo: {
        isExtendedShape: (glyphID: number): boolean => {
          const [part, , localID] = split(glyphID);
          return part.math.glyphInfo.isExtendedShape(localID);
        },
        getItalicCorrection: (glyphID: number) => {
          const [part, , localID] = split(glyphID);
          return part.math.glyphInfo.getItalicCorrection(localID);
        },
      },
    },
    getGlyphID: (char: string): number => {
      const codePoint = char.codePointAt(0);
      const group =
        codePoint === undefined ? undefined : getGlyphGroup(codePoint);
      if (codePoint === undefined || !group) {
        // Same message as a single font's getGlyphID.
        throw new Error(`No glyphID in font for given codePoint: ${codePoint}`);
      }
      const slot = slotByName.get(group.name) as number;
      const part = parts.get(slot);
      if (!part) {
        throw new GlyphGroupNotLoadedError(group.name, codePoint);
      }
      return slot * GLYPH_ID_STRIDE + part.getGlyphID(char);
    },
    getGlyph: (glyphID: number): Glyph => {
      const [part, , localID] = split(glyphID);
      return part.getGlyph(localID);
    },
    getGlyphMetrics: (glyphID: number): GlyphMetrics => {
      const [part, , localID] = split(glyphID);
      return part.getGlyphMetrics(localID);
    },
    loadedGroups,
    withGroup: (name: string, font: Font): CombinedFont => {
      const slot = slotByName.get(name);
      if (slot === undefined) {
        throw new Error(`Unknown glyph group "${name}"`);
      }
      checkCompatible(name, font, base);
      const next = new Map(parts);
      next.set(slot, font);
      return build(next);
    },
  };
};

/**
 * Combines font subsets into one CombinedFont. `fonts` maps group names (see
 * `glyphGroups`) to the parsed subset for that group, and must include the
 * "base" group. More groups can be added later with `withGroup`.
 *
 * @example
 * const font = combineFonts({ base: await parse(baseBlob) });
 * font.getGlyphID('x'); // works
 * font.getGlyphID('∫'); // throws GlyphGroupNotLoadedError (group "calculus")
 * const font2 = font.withGroup('calculus', await parse(calculusBlob));
 * font2.getGlyphID('∫'); // works
 */
export const combineFonts = (
  fonts: Readonly<Record<string, Font>>,
): CombinedFont => {
  const base = fonts[glyphGroups[0].name];
  if (!base) {
    throw new Error(
      `combineFonts needs the "${glyphGroups[0].name}" glyph group`,
    );
  }
  let font = build(new Map([[0, base]]));
  for (const [name, part] of Object.entries(fonts)) {
    if (name !== glyphGroups[0].name) {
      font = font.withGroup(name, part);
    }
  }
  return font;
};
