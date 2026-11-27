import fs from 'fs';
import path from 'path';

import {
  FONT_FOLDERS,
  fonts,
  getFont,
  isFontFolder,
  subsetPath,
} from '../index';
import type { FontFolder } from '../index';
import data from '../fonts.json';
import { toMathFont } from '../font-list';

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

// scripts/subset-fonts.py builds each subset as .otf and .woff. The repo's
// tests read the .otf files, but only the .woff ones are published.

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

describe('toMathFont', () => {
  const entry = {
    name: 'STIX Two Math',
    folder: 'stix-two-math',
    source: 'STIX2Math.otf',
    letter: 'A',
    license: 'OFL-1.1',
  };

  test('rejects an unknown licence', () => {
    expect(() => toMathFont({ ...entry, license: 'GPL' })).toThrow(
      'Unknown licence for STIX Two Math: GPL',
    );
  });

  test('rejects a folder that fonts.generated.ts lacks', () => {
    expect(() => toMathFont({ ...entry, folder: 'new-math' })).toThrow(
      "new-math isn't in fonts.generated.ts; run scripts/subset-fonts.py",
    );
  });
});

describe('FONT_FOLDERS', () => {
  // fonts.generated.ts is written by scripts/subset-fonts.py, which CI
  // doesn't run, so this catches a fonts.json edit without a regeneration.
  test('matches fonts.json; run scripts/subset-fonts.py if not', () => {
    expect([...FONT_FOLDERS]).toEqual(data.fonts.map((font) => font.folder));
  });

  test('isFontFolder accepts only those folders', () => {
    expect(isFontFolder('stix-two-math')).toBe(true);
    expect(isFontFolder('comic-sans-math')).toBe(false);
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

  test.each(fonts)('$folder has every glyph group in both formats', (font) => {
    const expected = groupNames
      .flatMap((group) => [`${group}.otf`, `${group}.woff`])
      .sort();
    const files = fs
      .readdirSync(path.join(PACKAGE, 'subsets', font.folder))
      .sort();
    expect(files).toEqual(expected);
  });
});

describe('subsetPath', () => {
  test('returns the path of a subset file in the package', () => {
    const woff = subsetPath('latin-modern-math', 'calculus');
    expect(woff).toEqual('subsets/latin-modern-math/calculus.woff');
    expect(fs.existsSync(path.join(PACKAGE, woff))).toBe(true);
  });

  test('throws for an unknown font', () => {
    // A caller that isn't type-checked could pass any string.
    const unknown = 'comic-sans-math' as FontFolder;
    expect(() => subsetPath(unknown, 'base')).toThrow(
      'Unknown font folder: "comic-sans-math"',
    );
  });
});

describe('package.json', () => {
  test('publishes the .woff subsets, not the .otf ones, and the licences', () => {
    expect(packageJson.files.sort()).toEqual(
      ['LICENSE.md', 'dist', 'licenses', 'subsets/**/*.woff'].sort(),
    );
  });

  test('lets consumers resolve the subset and licence files', () => {
    expect(packageJson.exports['./subsets/*']).toEqual('./subsets/*');
    expect(packageJson.exports['./licenses/*']).toEqual('./licenses/*');
  });
});
