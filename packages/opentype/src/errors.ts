/**
 * Thrown by a font's `getGlyphID` for a character the font can't draw.
 */
export class GlyphNotFoundError extends Error {
  readonly codePoint: number | undefined;

  constructor(codePoint: number | undefined, message?: string) {
    super(message ?? `No glyphID in font for given codePoint: ${codePoint}`);
    this.name = 'GlyphNotFoundError';
    this.codePoint = codePoint;
  }
}

/**
 * Thrown by a CombinedFont's `getGlyphID` for a character whose glyph group
 * hasn't been loaded. It's a GlyphNotFoundError, so code that handles missing
 * glyphs handles this too.
 */
export class GlyphGroupNotLoadedError extends GlyphNotFoundError {
  /** The name of the group to load, e.g. "calculus". */
  readonly group: string;

  constructor(group: string, codePoint: number) {
    const hex = codePoint.toString(16).toUpperCase().padStart(4, '0');
    super(
      codePoint,
      `U+${hex} is in the "${group}" glyph group, which hasn't been loaded`,
    );
    this.name = 'GlyphGroupNotLoadedError';
    this.group = group;
  }
}
