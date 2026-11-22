import { GlyphGroupNotLoadedError, GlyphNotFoundError } from '../errors';
import { loadFont } from '../test-util';

describe('errors', () => {
  test("a font's getGlyphID throws GlyphNotFoundError for a missing character", async () => {
    const font = await loadFont('latinmodern-math.otf');
    let error: unknown;
    try {
      font.getGlyphID('²');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(GlyphNotFoundError);
    expect(error).toMatchObject({ codePoint: 0xb2 });
    expect((error as Error).message).toEqual(
      'No glyphID in font for given codePoint: 178',
    );
  });

  test('GlyphGroupNotLoadedError is a GlyphNotFoundError', () => {
    const error = new GlyphGroupNotLoadedError('calculus', 0x222b);
    expect(error).toBeInstanceOf(GlyphNotFoundError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toEqual('GlyphGroupNotLoadedError');
  });
});
