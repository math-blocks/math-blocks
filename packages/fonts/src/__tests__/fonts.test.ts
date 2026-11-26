import fs from 'fs';
import path from 'path';

import { fonts, formats, getFont, subsetPath } from '../index';

const PACKAGE = path.join(__dirname, '../..');

// Read from disk rather than imported: @math-blocks/opentype's tests depend on
// this package, so importing it here would make the two depend on each other.
const groupNames = (
  JSON.parse(
    fs.readFileSync(
      path.join(PACKAGE, '../opentype/src/glyph-groups.json'),
      'utf8',
    ),
  ) as { groups: { name: string }[] }
).groups.map((group) => group.name);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(PACKAGE, 'package.json'), 'utf8'),
) as { files: string[]; exports: Record<string, unknown> };

describe('fonts', () => {
  test('each font has its own name, folder and family', () => {
    for (const key of ['name', 'folder', 'family'] as const) {
      const values = fonts.map((font) => font[key]);
      expect(new Set(values).size).toEqual(values.length);
    }
  });

  test('each licence file is in the package', () => {
    for (const font of fonts) {
      expect(fs.existsSync(path.join(PACKAGE, font.licenseFile))).toBe(true);
    }
    // The GUST Font License is the LPPL plus a request, so ship the LPPL too.
    expect(fs.existsSync(path.join(PACKAGE, 'licenses/LPPL-1.3c.txt'))).toBe(
      true,
    );
  });

  test('describes STIX Two Math', () => {
    expect(getFont('stix-two-math')).toEqual({
      name: 'STIX Two Math',
      folder: 'stix-two-math',
      family: 'MathBlocks Math A',
      source: 'STIX2Math.otf',
      license: 'OFL-1.1',
      licenseFile: 'licenses/OFL-1.1.txt',
    });
    expect(getFont('comic-sans-math')).toBeUndefined();
  });
});

describe('subsets', () => {
  test('there is a folder for each font, and no others', () => {
    const folders = fs
      .readdirSync(path.join(PACKAGE, 'subsets'))
      .filter((name) => !name.startsWith('.'))
      .sort();
    expect(folders).toEqual(fonts.map((font) => font.folder).sort());
  });

  test.each(fonts)('$folder has every glyph group in every format', (font) => {
    const expected = groupNames
      .flatMap((group) => formats.map((format) => `${group}.${format}`))
      .sort();
    const files = fs
      .readdirSync(path.join(PACKAGE, 'subsets', font.folder))
      .sort();
    expect(files).toEqual(expected);
  });
});

describe('subsetPath', () => {
  test('returns the path of a subset file in the package', () => {
    expect(subsetPath('stix-two-math', 'base')).toEqual(
      'subsets/stix-two-math/base.otf',
    );
    const woff = subsetPath('latin-modern-math', 'calculus', 'woff');
    expect(woff).toEqual('subsets/latin-modern-math/calculus.woff');
    expect(fs.existsSync(path.join(PACKAGE, woff))).toBe(true);
  });

  test('throws for an unknown font', () => {
    expect(() => subsetPath('comic-sans-math', 'base')).toThrow(
      'Unknown font folder: "comic-sans-math"',
    );
  });
});

describe('package.json', () => {
  test('publishes the subsets and licences', () => {
    expect(packageJson.files).toEqual(
      expect.arrayContaining(['dist', 'subsets', 'licenses', 'LICENSE.md']),
    );
  });

  test('lets consumers resolve the subset and licence files', () => {
    expect(packageJson.exports['./subsets/*']).toEqual('./subsets/*');
    expect(packageJson.exports['./licenses/*']).toEqual('./licenses/*');
  });
});
