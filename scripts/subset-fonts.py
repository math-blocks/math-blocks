#!/usr/bin/env python3
"""Build the usage-based font subsets in assets/subsets/.

Each math font in assets/ is split into one font file per group in
packages/opentype/src/glyph-groups.json. See
https://github.com/math-blocks/math-blocks/issues/696.

Usage:
    pip install -r scripts/requirements.txt
    python3 scripts/subset-fonts.py          # rebuild assets/subsets/
    python3 scripts/subset-fonts.py --check  # fail if assets/subsets/ is stale

The subsets are modified versions of the original fonts, so they're renamed
(STIX's license requires a modified version to carry a different name, and the
GUST Font License used by Latin Modern and TeX Gyre asks for it). The
copyright, trademark and license entries in each font's name table are kept.
"""

import argparse
import filecmp
import json
import os
import re
import sys
import tempfile

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')
GROUPS_FILE = os.path.join(ROOT, 'packages', 'opentype', 'src', 'glyph-groups.json')
OUT_DIR = os.path.join(ASSETS, 'subsets')

# Source font file in assets/ -> (letter used in the subset's name, source name).
FONTS = {
    'STIX2Math.otf': ('A', 'STIX Two Math'),
    'latinmodern-math.otf': ('B', 'Latin Modern Math'),
    'texgyrebonum-math.otf': ('C', 'TeX Gyre Bonum Math'),
    'texgyrepagella-math.otf': ('D', 'TeX Gyre Pagella Math'),
    'texgyreschola-math.otf': ('E', 'TeX Gyre Schola Math'),
    'texgyretermes-math.otf': ('F', 'TeX Gyre Termes Math'),
}

# Name table entries that identify the font. They're all replaced; everything
# else (copyright, trademark, license, version, ...) is kept as is.
NAME_IDS_TO_REPLACE = {1, 2, 3, 4, 6, 16, 17, 18, 21, 22}

CODE_POINT = re.compile(r'^U\+([0-9A-F]{4,6})(?:-U\+([0-9A-F]{4,6}))?$')


def load_groups():
    """Return [(group name, sorted code points)], checking the file's format
    and that no code point belongs to more than one group."""
    errors = []

    def reject_duplicate_keys(pairs):
        # JSON parsers keep only the last of two identical keys, so a repeated
        # entry would silently replace the earlier one's description.
        keys = [key for key, _ in pairs]
        for key in sorted({k for k in keys if keys.count(k) > 1}):
            errors.append(f'duplicate key {key!r}')
        return dict(pairs)

    with open(GROUPS_FILE, encoding='utf-8') as f:
        data = json.load(f, object_pairs_hook=reject_duplicate_keys)

    groups = []
    owner = {}
    for group in data['groups']:
        name = group['name']
        code_points = set()
        for entry, description in group['codePoints'].items():
            if not isinstance(description, str) or not description.strip():
                errors.append(f'{name}: {entry!r} needs a description')
            m = CODE_POINT.match(entry)
            if not m:
                errors.append(f'{name}: invalid entry {entry!r}')
                continue
            start = int(m.group(1), 16)
            end = int(m.group(2), 16) if m.group(2) else start
            if end < start:
                errors.append(f'{name}: range {entry!r} ends before it starts')
            code_points.update(range(start, end + 1))
        for cp in sorted(code_points):
            if cp in owner:
                errors.append(f'U+{cp:04X} is in both {owner[cp]!r} and {name!r}')
            owner[cp] = name
        groups.append((name, sorted(code_points)))

    if errors:
        sys.exit('glyph-groups.json is invalid:\n  ' + '\n  '.join(errors))
    return groups


def subset_options():
    options = subset.Options()
    options.layout_features = []  # math-blocks doesn't read GSUB/GPOS
    # FFTM is FontForge's timestamp table, which fontTools can't subset.
    options.drop_tables += ['GSUB', 'GPOS', 'GDEF', 'FFTM']
    options.notdef_outline = True  # keep the .notdef glyph's outline
    options.name_IDs = ['*']  # keep every name record; identifying ones are replaced below
    options.name_languages = ['*']
    options.ignore_missing_unicodes = True  # not every font has every character
    return options


def rename(font, letter, group, source_name):
    family = f'MathBlocks Math {letter}'
    style = group.replace('-', ' ').title()
    full = f'{family} {style}'
    ps_name = f'MathBlocksMath{letter}-{style.replace(" ", "")}'
    description = (
        f'Subset of {source_name} containing the "{group}" glyph group, '
        'made for math-blocks (https://github.com/math-blocks/math-blocks).'
    )

    name = font['name']
    name.names = [r for r in name.names if r.nameID not in NAME_IDS_TO_REPLACE | {10}]
    for name_id, value in (
        (1, family),
        (2, style),
        (3, f'{ps_name};math-blocks'),
        (4, full),
        (6, ps_name),
        (10, description),
    ):
        name.setName(value, name_id, 3, 1, 0x409)  # Windows, Unicode BMP, en-US
        name.setName(value, name_id, 1, 0, 0)  # Macintosh, Roman, English

    cff = font['CFF '].cff
    cff.fontNames = [ps_name]
    top_dict = cff.topDictIndex[0]
    top_dict.FullName = full
    top_dict.FamilyName = family


def ensure_format_12_cmap(font):
    """Add a (3, 10) format 12 cmap subtable if the subset doesn't have one.

    @math-blocks/opentype only reads that subtable, and fontTools only writes
    it when a font has characters beyond U+FFFF, which most groups don't.
    """
    cmap = font['cmap']
    if cmap.getcmap(3, 10):
        return
    table = CmapSubtable.newSubtable(12)
    table.platformID = 3
    table.platEncID = 10
    table.language = 0
    table.cmap = dict(font.getBestCmap())
    cmap.tables.append(table)


def build(out_dir):
    groups = load_groups()
    options = subset_options()
    written = []
    for source, (letter, source_name) in FONTS.items():
        font_dir = os.path.join(out_dir, f'mathblocks-math-{letter.lower()}')
        os.makedirs(font_dir, exist_ok=True)
        for group, code_points in groups:
            # recalcTimestamp=False keeps head.modified, so rebuilds are identical.
            font = TTFont(os.path.join(ASSETS, source), recalcTimestamp=False)
            subsetter = subset.Subsetter(options)
            subsetter.populate(unicodes=code_points)
            subsetter.subset(font)
            rename(font, letter, group, source_name)
            ensure_format_12_cmap(font)
            path = os.path.join(font_dir, f'{group}.otf')
            font.save(path)
            written.append(os.path.relpath(path, out_dir))
    return written


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--check', action='store_true',
                        help='rebuild into a temporary folder and fail if assets/subsets/ differs')
    args = parser.parse_args()

    if not args.check:
        for path in build(OUT_DIR):
            print(os.path.join('assets', 'subsets', path))
        return

    with tempfile.TemporaryDirectory() as tmp:
        written = build(tmp)
        stale = [p for p in written
                 if not os.path.exists(os.path.join(OUT_DIR, p))
                 or not filecmp.cmp(os.path.join(tmp, p), os.path.join(OUT_DIR, p), shallow=False)]
    expected = set(written)
    extra = [os.path.relpath(os.path.join(d, f), OUT_DIR)
             for d, _, files in os.walk(OUT_DIR) for f in files if f.endswith('.otf')]
    extra = [p for p in extra if p not in expected]
    if stale or extra:
        for p in stale:
            print(f'out of date: assets/subsets/{p}')
        for p in extra:
            print(f'not built by this script: assets/subsets/{p}')
        sys.exit('Run `python3 scripts/subset-fonts.py` and commit the result.')
    print(f'assets/subsets/ is up to date ({len(written)} files).')


if __name__ == '__main__':
    main()
