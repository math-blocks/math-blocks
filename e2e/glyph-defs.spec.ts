// End-to-end tests of glyph definitions: each SVG that math-blocks renders
// stores each distinct glyph outline once in its <defs> and draws every glyph
// with a <use>. See https://github.com/math-blocks/math-blocks/issues/758.
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

type GlyphDefStats = {
  readonly svgs: number;
  readonly defs: number;
  readonly uses: number;
  // Definition IDs that appear more than once in the whole document.
  readonly duplicateIds: readonly string[];
  // <use> hrefs that don't resolve to a definition in the same SVG.
  readonly brokenHrefs: readonly string[];
  // Definitions that no <use> in the same SVG references.
  readonly unusedDefs: readonly string[];
};

/** Checks the glyph definitions of every SVG inside `root`. */
const getGlyphDefStats = (root: Locator): Promise<GlyphDefStats> =>
  root.evaluate((element) => {
    const candidates =
      element.tagName.toLowerCase() === 'svg'
        ? [element]
        : Array.from(element.querySelectorAll('svg'));
    const svgs = candidates.filter((svg) => svg.querySelector('defs, use'));

    const allIds = Array.from(document.querySelectorAll('[id]'))
      .map((el) => el.id)
      .filter((id) => id.startsWith('mb'));
    const duplicateIds = allIds.filter((id, i) => allIds.indexOf(id) !== i);

    let defs = 0;
    let uses = 0;
    const brokenHrefs: string[] = [];
    const unusedDefs: string[] = [];
    for (const svg of svgs) {
      const defIds = Array.from(svg.querySelectorAll('defs > path')).map(
        (path) => path.id,
      );
      const hrefs = Array.from(svg.querySelectorAll('use')).map((use) =>
        (use.getAttribute('href') ?? '').slice(1),
      );
      defs += defIds.length;
      uses += hrefs.length;
      brokenHrefs.push(...hrefs.filter((href) => !defIds.includes(href)));
      unusedDefs.push(...defIds.filter((id) => !hrefs.includes(id)));
    }

    return {
      svgs: svgs.length,
      defs,
      uses,
      duplicateIds,
      brokenHrefs,
      unusedDefs,
    };
  });

const expectConsistent = (stats: GlyphDefStats): void => {
  expect(stats.duplicateIds).toEqual([]);
  expect(stats.brokenHrefs).toEqual([]);
  expect(stats.unusedDefs).toEqual([]);
};

test('several renderers on one page keep their definitions apart', async ({
  page,
}) => {
  await page.goto('#/baseline');
  await expect(page.locator('svg use').first()).toBeAttached();

  const stats = await getGlyphDefStats(page.locator('body'));
  expect(stats.svgs).toBeGreaterThan(1);
  expect(stats.uses).toBeGreaterThan(0);
  expectConsistent(stats);
});

test.describe('editor', () => {
  // The editor is a textbox with the math drawn in an SVG inside it.
  const mathSvg = (page: Page): Locator =>
    page
      .getByRole('textbox')
      .filter({ has: page.locator('svg') })
      .locator('svg');

  test('keeps its definitions in step with what is typed', async ({ page }) => {
    await page.goto('#/editor');
    const svg = mathSvg(page);
    await expect(svg.locator('use').first()).toBeAttached();
    const initial = await getGlyphDefStats(svg);
    expectConsistent(initial);

    await svg.click();

    // The first '+1' may add definitions for '+' and '1'.
    await page.keyboard.type('+1');
    await expect
      .poll(async () => (await getGlyphDefStats(svg)).uses)
      .toBe(initial.uses + 2);
    const once = await getGlyphDefStats(svg);
    expectConsistent(once);

    // A second '+1' only adds <use> elements.
    await page.keyboard.type('+1');
    await expect
      .poll(async () => (await getGlyphDefStats(svg)).uses)
      .toBe(initial.uses + 4);
    const twice = await getGlyphDefStats(svg);
    expect(twice.defs).toBe(once.defs);
    expectConsistent(twice);

    // Deleting them drops any definitions nothing uses any more.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Backspace');
    }
    await expect.poll(() => getGlyphDefStats(svg)).toEqual(initial);
  });
});
