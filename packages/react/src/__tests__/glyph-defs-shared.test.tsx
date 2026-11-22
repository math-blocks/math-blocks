/**
 * @jest-environment jsdom
 */
// GlyphDefsProvider: every renderer and editor inside it shares one hidden
// <svg> of glyph definitions. See
// https://github.com/math-blocks/math-blocks/issues/758.
// The tests inspect SVG markup (<defs>, <use>), which has no roles or labels
// for Testing Library's queries to find.
/* eslint-disable testing-library/no-node-access, testing-library/no-container, testing-library/render-result-naming-convention */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { act, fireEvent, render } from '@testing-library/react';
import { Blob } from 'buffer';

import * as Editor from '@math-blocks/editor';
import { getFontData, parse } from '@math-blocks/opentype';
import type { Font, FontData } from '@math-blocks/opentype';
import { parse as parseTex } from '@math-blocks/tex';

import MathEditor from '../math-editor';
import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';
import { GlyphDefsProvider, getStandaloneSvg } from '../glyph-defs';
import { expandGlyphUses, readGlyphDefs } from '../test-util';

// In jsdom, 'react-dom/server' resolves to React's browser build, which needs
// TextEncoder, and jsdom doesn't provide one. The Node build works the same.
const ReactDOMServer: typeof import('react-dom/server') = jest.requireActual(
  'react-dom/server.node',
);

const ASSETS = path.join(__dirname, '../../../../assets');

let fontData: FontData;
let lmFont: Font;

beforeAll(async () => {
  const load = (file: string): Promise<Font> =>
    parse(new Blob([fs.readFileSync(path.join(ASSETS, file))]));
  fontData = getFontData(await load('STIX2Math.otf'), 'STIX2');
  lmFont = await load('latinmodern-math.otf');
});

beforeEach(() => {
  // MathEditor logs every key press and mouse up.
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const EXPRESSIONS = [
  '2x+5=11',
  '\\frac{2}{3}+\\frac{1}{4}',
  'x^2−4x+4=0',
  '\\sqrt{5}−2',
  '(x+2)(x−3)',
  '3x+6=13',
];

// The provider's hidden <svg>s, and the SVGs drawn by renderers and editors.
const hiddenSvgs = (root: ParentNode): readonly Element[] =>
  Array.from(root.querySelectorAll('svg[aria-hidden="true"]'));
const mathSvgs = (root: ParentNode): readonly Element[] =>
  Array.from(root.querySelectorAll('svg:not([aria-hidden])'));

const sharedDefs = (root: ParentNode): ReadonlyMap<string, string> =>
  new Map(hiddenSvgs(root).flatMap((svg) => [...readGlyphDefs(svg.outerHTML)]));

const hrefs = (svg: Element): readonly string[] =>
  Array.from(svg.querySelectorAll('use')).map((use) =>
    (use.getAttribute('href') ?? '').slice(1),
  );

const type = (keys: readonly string[]): void => {
  for (const key of keys) {
    fireEvent.keyDown(window, { key });
    fireEvent.keyUp(window, { key });
  }
};

// Takes rows as well as TeX, so that two renders can share the same rows and
// therefore the same editor node IDs.
const renderers = (
  expressions: readonly (string | Editor.types.CharRow)[],
): React.ReactElement => (
  <>
    {expressions.map((row, i) => (
      <MathRenderer
        key={i}
        row={typeof row === 'string' ? parseTex(row) : row}
      />
    ))}
  </>
);

describe('GlyphDefsProvider', () => {
  test('each SVG draws exactly what it draws on its own', () => {
    const rows = EXPRESSIONS.map((tex) => parseTex(tex));
    const sharedView = render(
      <FontDataContext.Provider value={fontData}>
        <GlyphDefsProvider>{renderers(rows)}</GlyphDefsProvider>
      </FontDataContext.Provider>,
    );
    const ownView = render(
      <FontDataContext.Provider value={fontData}>
        {renderers(rows)}
      </FontDataContext.Provider>,
    );

    const defs = sharedDefs(sharedView.container);
    const sharedSvgs = mathSvgs(sharedView.container);
    const ownSvgs = mathSvgs(ownView.container);
    expect(sharedSvgs).toHaveLength(EXPRESSIONS.length);
    sharedSvgs.forEach((svg, i) => {
      expect(expandGlyphUses(svg.outerHTML, defs)).toEqual(
        expandGlyphUses(ownSvgs[i].outerHTML),
      );
    });
  });

  test('stores each glyph once for the whole page', () => {
    const { container } = render(
      <FontDataContext.Provider value={fontData}>
        <GlyphDefsProvider>
          {renderers(EXPRESSIONS)}
          <MathEditor row={parseTex('x=1')} readonly={false} />
          <MathEditor row={parseTex('x=2')} readonly={false} />
        </GlyphDefsProvider>
      </FontDataContext.Provider>,
    );

    expect(hiddenSvgs(container)).toHaveLength(1);
    const svgs = mathSvgs(container);
    expect(svgs).toHaveLength(EXPRESSIONS.length + 2);
    for (const svg of svgs) {
      expect(svg.querySelector('defs')).toBeNull();
    }

    // One definition per distinct glyph on the page, and each is used.
    const used = new Set(svgs.flatMap(hrefs));
    const defs = sharedDefs(container);
    expect([...defs.keys()].sort()).toEqual([...used].sort());
    // Far fewer definitions than <use> elements.
    expect(defs.size).toBeLessThan(svgs.flatMap(hrefs).length / 3);
  });

  test('typing re-renders only the editor and the hidden <svg>', () => {
    const renders = new Map<string, number>();
    const onRender = (id: string): void => {
      renders.set(id, (renders.get(id) ?? 0) + 1);
    };
    const { container } = render(
      <FontDataContext.Provider value={fontData}>
        <GlyphDefsProvider>
          {EXPRESSIONS.map((tex) => (
            <React.Profiler key={tex} id={tex} onRender={onRender}>
              <MathRenderer row={parseTex(tex)} />
            </React.Profiler>
          ))}
          <MathEditor row={parseTex('x=1')} readonly={false} />
          <MathEditor row={parseTex('x=2')} readonly={false} />
        </GlyphDefsProvider>
      </FontDataContext.Provider>,
    );
    const rendersBefore = new Map(renders);
    const defsBefore = sharedDefs(container).size;
    const [input] = Array.from(container.querySelectorAll('input'));

    // 'q' isn't on the page yet, so it adds one definition.
    fireEvent.focus(input);
    type(['q']);
    expect(sharedDefs(container).size).toBe(defsBefore + 1);

    // Typing it again, or typing glyphs already on the page, adds none.
    type(['q', 'x', '+', '1']);
    expect(sharedDefs(container).size).toBe(defsBefore + 1);

    // The editor's <use> elements all resolve to shared definitions.
    const editorSvg = mathSvgs(container)[EXPRESSIONS.length];
    expandGlyphUses(editorSvg.outerHTML, sharedDefs(container));

    // None of the renderers rendered again.
    expect(renders).toEqual(rendersBefore);
  });

  test('fonts with the same family get separate definitions', () => {
    const lm = getFontData(lmFont, fontData.fontFamily);
    const { container } = render(
      <GlyphDefsProvider>
        <FontDataContext.Provider value={fontData}>
          <MathRenderer row={parseTex('x')} />
        </FontDataContext.Provider>
        <FontDataContext.Provider value={lm}>
          <MathRenderer row={parseTex('x')} />
        </FontDataContext.Provider>
      </GlyphDefsProvider>,
    );

    const ids = [...sharedDefs(container).keys()];
    expect(ids).toHaveLength(2);
    expect(ids[0]).toMatch(/-STIX2-\d+$/);
    expect(ids[1]).toMatch(/-STIX2-2-\d+$/);

    // Each SVG draws its own font's outline.
    const [stixSvg, lmSvg] = mathSvgs(container);
    const own = (data: FontData): string =>
      expandGlyphUses(
        ReactDOMServer.renderToStaticMarkup(
          <FontDataContext.Provider value={data}>
            <MathRenderer row={parseTex('x')} />
          </FontDataContext.Provider>,
        ),
      );
    const defs = sharedDefs(container);
    const d = (svg: string): string | undefined =>
      svg.match(/ d="([^"]*)"/)?.[1];
    expect(d(expandGlyphUses(stixSvg.outerHTML, defs))).toEqual(
      d(own(fontData)),
    );
    expect(d(expandGlyphUses(lmSvg.outerHTML, defs))).toEqual(d(own(lm)));
  });

  test('two providers keep their definitions apart', () => {
    const { container } = render(
      <FontDataContext.Provider value={fontData}>
        <div id="first">
          <GlyphDefsProvider>{renderers(['x+1'])}</GlyphDefsProvider>
        </div>
        <div id="second">
          <GlyphDefsProvider>{renderers(['x+1'])}</GlyphDefsProvider>
        </div>
      </FontDataContext.Provider>,
    );

    const ids = hiddenSvgs(container).flatMap((svg) => [
      ...readGlyphDefs(svg.outerHTML).keys(),
    ]);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    for (const selector of ['#first', '#second']) {
      const root = container.querySelector(selector) as Element;
      const [svg] = mathSvgs(root);
      // Throws if a <use> doesn't resolve within its own provider.
      expandGlyphUses(svg.outerHTML, sharedDefs(root));
    }
  });

  test('server rendering keeps each SVG self-contained', () => {
    const serverHtml = ReactDOMServer.renderToStaticMarkup(
      <FontDataContext.Provider value={fontData}>
        <GlyphDefsProvider>{renderers(EXPRESSIONS)}</GlyphDefsProvider>
      </FontDataContext.Provider>,
    );

    // Every SVG but the provider's hidden one.
    const svgs = (serverHtml.match(/<svg.*?<\/svg>/g) ?? []).filter(
      (svg) => !svg.includes('aria-hidden="true" focusable="false"'),
    );
    expect(svgs).toHaveLength(EXPRESSIONS.length);
    for (const svg of svgs) {
      expect(svg).toContain('<defs><path');
      // Throws if a <use> needs a definition from outside its own SVG.
      expandGlyphUses(svg);
    }
  });

  test('hydrates server markup, then shares definitions', async () => {
    const tree = (
      <FontDataContext.Provider value={fontData}>
        <GlyphDefsProvider>{renderers(EXPRESSIONS)}</GlyphDefsProvider>
      </FontDataContext.Provider>
    );
    const container = document.createElement('div');
    container.innerHTML = ReactDOMServer.renderToString(tree);
    document.body.appendChild(container);
    const error = jest.spyOn(console, 'error').mockImplementation(() => {
      // Fails below if hydration reported a mismatch.
    });

    await act(async () => {
      hydrateRoot(container, tree);
    });

    expect(error).not.toHaveBeenCalled();
    const defs = sharedDefs(container);
    expect(defs.size).toBeGreaterThan(0);
    for (const svg of mathSvgs(container)) {
      expect(svg.querySelector('defs')).toBeNull();
      expandGlyphUses(svg.outerHTML, defs);
    }
    container.remove();
  });
});

describe('getStandaloneSvg', () => {
  test('copies the shared definitions an SVG uses into the copy', () => {
    const { container } = render(
      <FontDataContext.Provider value={fontData}>
        <GlyphDefsProvider>{renderers(EXPRESSIONS)}</GlyphDefsProvider>
      </FontDataContext.Provider>,
    );
    const defs = sharedDefs(container);

    for (const svg of mathSvgs(container)) {
      const before = svg.outerHTML;
      const copy = getStandaloneSvg(svg as SVGSVGElement);

      // Self-contained: expanding it needs no shared definitions, and every
      // definition in it is used. It draws what the original draws.
      expect(expandGlyphUses(copy.outerHTML)).toEqual(
        expandGlyphUses(svg.outerHTML, defs),
      );
      // One definition per glyph it uses, not the whole page's.
      expect(copy.querySelectorAll('defs > path')).toHaveLength(
        new Set(hrefs(svg)).size,
      );
      // The rendered SVG is unchanged.
      expect(svg.outerHTML).toEqual(before);
    }
  });

  test('returns a plain copy of an SVG with its own definitions', () => {
    const { container } = render(
      <FontDataContext.Provider value={fontData}>
        {renderers(EXPRESSIONS)}
      </FontDataContext.Provider>,
    );

    for (const svg of mathSvgs(container)) {
      expect(getStandaloneSvg(svg as SVGSVGElement).outerHTML).toEqual(
        svg.outerHTML,
      );
    }
  });

  test('finds definitions in the shadow root the SVG is in', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    shadow.appendChild(container);

    // This is React's own createRoot, not Testing Library's render, which
    // can't render into a shadow root.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      createRoot(container).render(
        <FontDataContext.Provider value={fontData}>
          <GlyphDefsProvider>{renderers(['x+1'])}</GlyphDefsProvider>
        </FontDataContext.Provider>,
      );
    });

    const [svg] = mathSvgs(container);
    expect(svg.querySelector('defs')).toBeNull();
    // Throws if a <use> in the copy has no definition.
    expandGlyphUses(getStandaloneSvg(svg as SVGSVGElement).outerHTML);
    host.remove();
  });

  test('finds definitions for an SVG in another frame', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const frameDocument = iframe.contentDocument as Document;
    // The frame's Document is a different constructor from this window's.
    expect(frameDocument instanceof Document).toBe(false);

    frameDocument.body.innerHTML = [
      '<svg aria-hidden="true"><defs><path id="g1" d="M 0,0 L 1,1"></path></defs></svg>',
      '<svg id="math"><use href="#g1"></use></svg>',
    ].join('');
    const svg = frameDocument.getElementById(
      'math',
    ) as unknown as SVGSVGElement;

    const copy = getStandaloneSvg(svg);
    expect(copy.querySelector('defs > path')?.getAttribute('d')).toBe(
      'M 0,0 L 1,1',
    );
    iframe.remove();
  });

  test('leaves the references of a detached SVG as they are', () => {
    const { container } = render(
      <FontDataContext.Provider value={fontData}>
        <GlyphDefsProvider>{renderers(['x+1'])}</GlyphDefsProvider>
      </FontDataContext.Provider>,
    );
    const [svg] = mathSvgs(container);
    const detached = svg.cloneNode(true) as SVGSVGElement;

    const copy = getStandaloneSvg(detached);
    expect(copy.outerHTML).toEqual(detached.outerHTML);
  });
});
