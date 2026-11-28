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

/** Records the paths of the font files (.otf or .woff) the page requests. */
const watchFonts = (page: Page): string[] => {
  const fonts: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (/\.(otf|woff)$/.test(pathname)) {
      fonts.push(pathname);
    }
  });
  return fonts;
};

// A built file's name is its source name plus a hash, e.g. base-BW9-VWCI.woff.
// This drops the hash and keeps the extension, e.g. base.woff.
const builtName = (path: string): string =>
  (path.split('/').pop() ?? '').replace(/-[\w-]{8}(\.\w+)$/, '$1');

// The demo loads the WOFF subsets. watchFonts also records .otf requests, so
// loading a full font would still show up.
const GROUPS = [
  'base',
  'calculus',
  'linear-algebra',
  'sets-logic',
  'trig-geometry',
].map((group) => `${group}.woff`);

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

  test('shows an error when a font fails to load', async ({
    page,
    browserName,
  }) => {
    await page.route(/calculus-[\w-]{8}\.woff$/, (route) => route.abort());
    await page.goto('#/editor');

    await expect(page.getByText('Unexpected Application Error!')).toBeVisible();
    // loadFontSubsets names the subset, then gives the browser's own message
    // for a failed fetch().
    const fetchFailed = {
      chromium: 'Failed to fetch',
      firefox: 'NetworkError when attempting to fetch resource.',
      webkit: 'Load failed',
    }[browserName];
    await expect(
      page.getByRole('heading', {
        name: `Couldn't load the "calculus" font subset: ${fetchFailed}`,
      }),
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

  test('dragging across the math highlights a selection', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('#/editor');
    const svg = mathEditor(page).locator('svg');
    await expect(svg.locator('use').first()).toBeAttached();
    // The selection is drawn as rectangles behind the glyphs.
    await expect(svg.locator('rect')).toHaveCount(0);

    const box = await svg.boundingBox();
    if (!box) {
      throw new Error('the math has no bounding box');
    }
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.1, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, y, { steps: 5 });
    await page.mouse.up();

    await expect(svg.locator('rect').first()).toBeAttached();
    expect(errors).toEqual([]);
  });
});

test.describe('renderer', () => {
  test('dragging across the math selects it', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('#/baseline');
    // The first renderer on the page sits between "Hello," and "world!".
    const svg = page.locator('p svg').first();
    await expect(svg.locator('use').first()).toBeAttached();
    // The selection is drawn as rectangles behind the glyphs.
    await expect(svg.locator('rect')).toHaveCount(0);
    const mathml = await page.locator('math').first().innerHTML();

    const box = await svg.boundingBox();
    if (!box) {
      throw new Error('the math has no bounding box');
    }
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + 5, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.4, y, { steps: 5 });
    await page.mouse.up();

    await expect(svg.locator('rect').first()).toBeAttached();
    // The browser didn't start a text selection of its own.
    expect(await page.evaluate(() => String(window.getSelection()))).toBe('');
    // What screen readers get is unchanged.
    expect(await page.locator('math').first().innerHTML()).toEqual(mathml);

    // Clicking elsewhere clears the selection.
    await page.getByRole('heading').click();
    await expect(svg.locator('rect')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('copying puts the selected math on the clipboard', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('#/baseline');
    const svg = page.locator('p svg').first();
    await expect(svg.locator('use').first()).toBeAttached();

    // Record what's put on the clipboard. Reading the system clipboard needs
    // permissions that not every browser grants to tests, but a `copy`
    // listener can read what the page's own listeners put there.
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      window.addEventListener('copy', (e) => {
        w.copied = {
          text: e.clipboardData?.getData('text/plain'),
          html: e.clipboardData?.getData('text/html'),
        };
      });
    });

    // Drag from before the math to its middle, which selects 2x+ (the
    // fraction after it is wider than it is tall, so its middle is further
    // right).
    const box = await svg.boundingBox();
    if (!box) {
      throw new Error('the math has no bounding box');
    }
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.3, y, { steps: 5 });
    await page.mouse.up();
    await expect(svg.locator('rect').first()).toBeAttached();

    await page.keyboard.press('ControlOrMeta+c');

    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as Record<string, unknown>).copied,
        ),
      )
      .toEqual({
        text: '2x+',
        html:
          '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">' +
          '<mn>2</mn><mi>x</mi><mo>+</mo></math>',
      });
    expect(errors).toEqual([]);
  });

  // The TeX for the math on the baseline page.
  const TEX = '2x+\\frac{t_{n-j}}{b^{2}+x}=10';

  // Records what's put on the clipboard; see the test above.
  const recordCopies = (page: Page): Promise<void> =>
    page.evaluate(() => {
      window.addEventListener('copy', (e) => {
        (window as unknown as Record<string, unknown>).copied = {
          text: e.clipboardData?.getData('text/plain'),
          html: e.clipboardData?.getData('text/html'),
        };
      });
    });

  const copied = (page: Page): Promise<unknown> =>
    page.evaluate(() => (window as unknown as Record<string, unknown>).copied);

  test('a text selection across the math highlights it and copies its TeX', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto('#/baseline');
    const paragraph = page.locator('p').nth(1);
    const svg = paragraph.locator('svg');
    await expect(svg.locator('use').first()).toBeAttached();
    await recordCopies(page);

    // Drag from the start of "Hello," to past the end of "world!".
    const start = await paragraph.boundingBox();
    const math = await svg.boundingBox();
    if (!start || !math) {
      throw new Error('the paragraph has no bounding box');
    }
    const y = math.y + math.height / 2;
    await page.mouse.move(start.x + 1, y);
    await page.mouse.down();
    await page.mouse.move(math.x + math.width + 200, y, { steps: 10 });
    await page.mouse.up();

    // All of the math is highlighted.
    await expect(svg.locator('rect').first()).toBeAttached();

    await page.keyboard.press('ControlOrMeta+c');
    await expect
      .poll(() => copied(page))
      .toEqual({
        text: `Hello, $$${TEX}$$ world!`,
        html: expect.stringContaining(
          '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">',
        ),
      });

    // Clicking elsewhere clears the selection and the highlight.
    await page.getByRole('heading').click();
    await expect(svg.locator('rect')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('dragging from the math into the text selects the text and all of the math', async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto('#/baseline');
    const paragraph = page.locator('p').nth(1);
    const svg = paragraph.locator('svg');
    await expect(svg.locator('use').first()).toBeAttached();
    await recordCopies(page);

    const math = await svg.boundingBox();
    if (!math) {
      throw new Error('the math has no bounding box');
    }
    const y = math.y + math.height / 2;
    await page.mouse.move(math.x + math.width * 0.6, y);
    await page.mouse.down();
    await page.mouse.move(math.x + math.width + 200, y, { steps: 10 });
    await page.mouse.up();

    await expect(svg.locator('rect').first()).toBeAttached();
    await page.keyboard.press('ControlOrMeta+c');
    await expect
      .poll(() => copied(page))
      .toMatchObject({ text: `$$${TEX}$$ world!` });
    expect(errors).toEqual([]);
  });
});
