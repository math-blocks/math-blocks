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

test('typing in an editor leaves the renderers on its page alone', async ({
  page,
}) => {
  // The solver page has an editor, and after Go, a renderer for each step of
  // the solution and for the answer.
  await page.goto('#/auto-solver');
  const editor = page.getByRole('textbox').filter({ has: page.locator('svg') });
  await expect(editor.locator('svg use').first()).toBeAttached();
  await page.getByRole('button', { name: 'Go' }).click();

  // The glyph definitions and <use> elements of every SVG on the page except
  // the editor's. Editor node IDs (`id="123"`) are left out: the solver page
  // builds the steps' rows again on every render, which gives their nodes new
  // IDs, so those change when anything on the page re-renders.
  const otherSvgs = (): Promise<readonly string[]> =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('svg'))
        .filter((svg) => !svg.closest('[role="textbox"]'))
        .map((svg) =>
          [
            ...Array.from(svg.querySelectorAll('defs > path')).map(
              (path) => `def ${path.id} ${path.getAttribute('d')}`,
            ),
            ...Array.from(svg.querySelectorAll('use')).map(
              (use) =>
                `use ${use.getAttribute('href')} ${use.getAttribute(
                  'transform',
                )}`,
            ),
          ].join('\n'),
        ),
    );
  await expect.poll(async () => (await otherSvgs()).length).toBeGreaterThan(5);
  const before = await otherSvgs();

  const page0 = await getGlyphDefStats(page.locator('body'));
  expectConsistent(page0);
  const editor0 = await getGlyphDefStats(editor);

  await editor.click();
  await page.keyboard.type('+1+1');
  await expect
    .poll(async () => (await getGlyphDefStats(editor)).uses)
    .toBe(editor0.uses + 4);

  // The page as a whole still has unique IDs and resolving hrefs, and the
  // renderers' definitions and <use> elements are exactly what they were.
  expectConsistent(await getGlyphDefStats(page.locator('body')));
  expect(await otherSvgs()).toEqual(before);
});
