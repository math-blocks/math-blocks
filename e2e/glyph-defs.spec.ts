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

test.describe('shared definitions (GlyphDefsProvider)', () => {
  // The worksheet page draws 40 problems and 3 editors under one
  // GlyphDefsProvider; with `?shared=0` it draws them without it.
  const openWorksheet = async (page: Page, query = ''): Promise<void> => {
    await page.goto(`#/worksheet${query}`);
    await expect(page.locator('svg use').first()).toBeAttached();
  };

  type SharedStats = {
    readonly hiddenSvgs: number;
    readonly mathSvgs: number;
    readonly mathSvgsWithDefs: number;
    readonly defs: number;
    readonly distinctHrefs: number;
    readonly uses: number;
    readonly duplicateIds: readonly string[];
    // <use> hrefs that don't resolve to a definition in a hidden <svg>.
    readonly brokenHrefs: readonly string[];
  };

  const getSharedStats = (page: Page): Promise<SharedStats> =>
    page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll('svg'));
      const hidden = svgs.filter((svg) => svg.getAttribute('aria-hidden'));
      const math = svgs.filter((svg) => !svg.getAttribute('aria-hidden'));
      const defIds = hidden.flatMap((svg) =>
        Array.from(svg.querySelectorAll('defs > path')).map((p) => p.id),
      );
      const allIds = Array.from(document.querySelectorAll('[id]'))
        .map((el) => el.id)
        .filter((id) => id.startsWith('mb'));
      const hrefs = math.flatMap((svg) =>
        Array.from(svg.querySelectorAll('use')).map((use) =>
          (use.getAttribute('href') ?? '').slice(1),
        ),
      );
      return {
        hiddenSvgs: hidden.length,
        mathSvgs: math.length,
        mathSvgsWithDefs: math.filter((svg) => svg.querySelector('defs'))
          .length,
        defs: defIds.length,
        distinctHrefs: new Set(hrefs).size,
        uses: hrefs.length,
        duplicateIds: allIds.filter((id, i) => allIds.indexOf(id) !== i),
        brokenHrefs: hrefs.filter((href) => !defIds.includes(href)),
      };
    });

  test('stores each glyph once for the whole page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openWorksheet(page);

    const stats = await getSharedStats(page);
    expect(stats.hiddenSvgs).toBe(1);
    expect(stats.mathSvgs).toBe(43);
    expect(stats.mathSvgsWithDefs).toBe(0);
    expect(stats.duplicateIds).toEqual([]);
    expect(stats.brokenHrefs).toEqual([]);
    expect(stats.defs).toBe(stats.distinctHrefs);
    expect(stats.defs).toBeLessThan(stats.uses / 10);
    expect(errors).toEqual([]);
  });

  test('draws exactly what per-SVG definitions draw', async ({ page }) => {
    await openWorksheet(page, '?shared=0');
    const own = await page.screenshot({ fullPage: true });
    await openWorksheet(page);
    const shared = await page.screenshot({ fullPage: true });
    expect(shared.equals(own)).toBe(true);
  });

  test('the hidden <svg> takes no space', async ({ page }) => {
    await openWorksheet(page);
    const box = await page.locator('svg[aria-hidden="true"]').boundingBox();
    expect(box?.width).toBe(0);
    expect(box?.height).toBe(0);
  });

  test('typing in one editor adds only new glyphs and changes no other SVG', async ({
    page,
  }) => {
    await openWorksheet(page);
    const editors = page
      .getByRole('textbox')
      .filter({ has: page.locator('svg') });
    await expect(editors).toHaveCount(3);
    const editor = editors.nth(1);

    // The markup of every SVG except this editor's and the hidden one.
    const others = (): Promise<readonly string[]> =>
      page.evaluate(() => {
        const svgs = Array.from(document.querySelectorAll('svg'));
        const editorSvgs = Array.from(
          document.querySelectorAll('[role="textbox"] svg'),
        );
        return svgs
          .filter(
            (svg) => !svg.getAttribute('aria-hidden') && svg !== editorSvgs[1],
          )
          .map((svg) => svg.outerHTML);
      });
    const before = await others();
    const stats0 = await getSharedStats(page);

    // 'q' isn't anywhere on the page, so it adds one definition.
    await editor.click();
    await page.keyboard.type('q');
    await expect
      .poll(async () => (await getSharedStats(page)).defs)
      .toBe(stats0.defs + 1);

    // Glyphs that are already on the page add none.
    await page.keyboard.type('q+1x');
    await expect
      .poll(async () => (await getSharedStats(page)).uses)
      .toBe(stats0.uses + 5);
    const stats = await getSharedStats(page);
    expect(stats.defs).toBe(stats0.defs + 1);
    expect(stats.brokenHrefs).toEqual([]);
    expect(stats.duplicateIds).toEqual([]);

    expect(await others()).toEqual(before);
  });

  test('getStandaloneSvg makes a copy that works as an image', async ({
    page,
  }) => {
    // An <img> is its own document and can't see the page's definitions, so
    // it shows whether a copy carries what it needs.
    const imageOfProblem1 = async (query: string): Promise<Buffer> => {
      await openWorksheet(page, query);
      await page
        .getByRole('button', { name: 'Show problem 1 as an image' })
        .click();
      const img = page.getByRole('img', { name: 'Problem 1' });
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0);
      return img.screenshot();
    };

    const own = await imageOfProblem1('?shared=0');
    const shared = await imageOfProblem1('');
    expect(shared.equals(own)).toBe(true);

    // The rendered SVG's own markup, without the definitions inlined, draws
    // nothing as an image: its <use> elements point outside it.
    await page.evaluate(() => {
      const svg = document.querySelector('ol svg') as SVGSVGElement;
      const raw = document.createElement('img');
      raw.alt = 'Problem 1 without definitions';
      raw.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        svg.outerHTML,
      )}`;
      document.body.appendChild(raw);
    });
    const raw = page.getByRole('img', {
      name: 'Problem 1 without definitions',
    });
    await expect
      .poll(() => raw.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    expect((await raw.screenshot()).equals(shared)).toBe(false);
  });
});
