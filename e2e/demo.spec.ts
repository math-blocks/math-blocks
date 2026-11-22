// End-to-end tests of the demo pages. See playwright.config.ts.
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

// Errors that are already known and tracked, so they don't fail every test.
const KNOWN_ERRORS = [
  // MathmlRenderer doesn't give its children keys yet; see the TODOs in
  // packages/react/src/mathml-renderer.tsx.
  /Each child in a list should have a unique "key" prop[\s\S]*MathmlRenderer/,
];

/**
 * Collects uncaught exceptions and console errors on the page, so a test can
 * check that there were none.
 */
const watchErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  page.on('console', (message) => {
    const text = message.text();
    if (
      message.type() === 'error' &&
      !KNOWN_ERRORS.some((pattern) => pattern.test(text))
    ) {
      errors.push(text);
    }
  });
  return errors;
};

/** Records the font files the page requests, as paths relative to assets/. */
const watchFonts = (page: Page): string[] => {
  const fonts: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname.endsWith('.otf')) {
      fonts.push(pathname);
    }
  });
  return fonts;
};

// A built file's name is its source name plus a hash, e.g. base-BW9-VWCI.otf.
const builtName = (path: string): string =>
  (path.split('/').pop() ?? '').replace(/-[\w-]{8}\.otf$/, '');

const GROUPS = [
  'base',
  'calculus',
  'linear-algebra',
  'sets-logic',
  'trig-geometry',
];

const PAGES = [
  { path: '/', heading: 'MathBlocks Demos', drawsMath: false },
  { path: '/baseline', heading: 'Baseline Alignment Demo', drawsMath: true },
  { path: '/editor', heading: null, drawsMath: true },
  { path: '/parser', heading: null, drawsMath: true },
  { path: '/mathml', heading: 'MathML Test Page', drawsMath: true },
  { path: '/handwriting', heading: null, drawsMath: false },
  { path: '/auto-solver', heading: 'Math Blocks: Solver', drawsMath: true },
  { path: '/opentype-demo', heading: null, drawsMath: true },
  { path: '/svg', heading: 'Hello, world (SVG)', drawsMath: false },
];

for (const { path, heading, drawsMath } of PAGES) {
  test(`${path} renders without errors`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`#${path}`);

    if (heading) {
      await expect(
        page.getByRole('heading', { name: heading, level: 1 }),
      ).toBeVisible();
    }
    if (drawsMath) {
      // Glyphs are drawn as paths, once the page's font has loaded.
      await expect(page.locator('svg path').first()).toBeAttached();
    }
    expect(errors).toEqual([]);
  });
}

test('pages that draw math load the STIX subsets, not the full font', async ({
  page,
}) => {
  const fonts = watchFonts(page);
  await page.goto('#/baseline');
  await expect(page.locator('svg use').first()).toBeAttached();

  expect(fonts.map(builtName).sort()).toEqual(GROUPS);
});

test.describe('editor', () => {
  // The editor is a textbox with the math drawn in an SVG inside it. (The
  // page has other textboxes, such as the editor's hidden input.)
  const mathEditor = (page: Page): Locator =>
    page.getByRole('textbox').filter({ has: page.locator('svg') });

  const fontSelect = (page: Page): Locator =>
    page.locator('select', {
      has: page.locator('option', { hasText: 'Latin Modern Math' }),
    });

  test('loads only the font picked in the Font dropdown', async ({ page }) => {
    const errors = watchErrors(page);
    const fonts = watchFonts(page);
    await page.goto('#/editor');
    const svg = mathEditor(page).locator('svg');
    await expect(svg.locator('use').first()).toBeAttached();
    await expect.poll(() => fonts.length).toBe(GROUPS.length);
    const stixFiles = [...fonts];
    const stixSvg = await svg.innerHTML();

    // Picking another font loads its subsets, and only those, and redraws the
    // math with it.
    fonts.length = 0;
    await fontSelect(page).selectOption({ label: 'Latin Modern Math' });
    await expect.poll(() => svg.innerHTML()).not.toEqual(stixSvg);
    expect(fonts.map(builtName).sort()).toEqual(GROUPS);
    expect(fonts.some((font) => stixFiles.includes(font))).toBe(false);

    // Going back to a font that's already loaded fetches nothing.
    fonts.length = 0;
    await fontSelect(page).selectOption({ label: 'STIX Two Math' });
    await expect.poll(() => svg.innerHTML()).toEqual(stixSvg);
    expect(fonts).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('shows an error when a font fails to load', async ({ page }) => {
    await page.route(/calculus-[\w-]{8}\.otf$/, (route) => route.abort());
    await page.goto('#/editor');

    await expect(page.getByText('Unexpected Application Error!')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Failed to fetch' }),
    ).toBeVisible();
  });

  test('typing adds characters to the math', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('#/editor');
    const editor = mathEditor(page);
    // Each glyph drawn is a <use>; a repeated glyph adds no new <path>.
    await expect(editor.locator('use').first()).toBeAttached();
    const glyphCount = await editor.locator('use').count();

    await editor.click();
    await page.keyboard.type('+1');

    await expect
      .poll(() => editor.locator('use').count())
      .toBeGreaterThan(glyphCount);
    expect(errors).toEqual([]);
  });
});
