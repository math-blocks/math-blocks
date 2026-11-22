/**
 * @jest-environment jsdom
 */
// Glyph definitions with several editors and renderers on one page: each SVG
// keeps its own <defs>, and editing one editor changes only that editor's
// SVG. See https://github.com/math-blocks/math-blocks/issues/758.
// The tests inspect SVG markup (<defs>, <use>), which has no roles or labels
// for Testing Library's queries to find.
/* eslint-disable testing-library/no-node-access, testing-library/no-container */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Blob } from 'buffer';

import { getFontData, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';
import { parse as parseTex } from '@math-blocks/tex';

import MathEditor from '../math-editor';
import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';
import { expandGlyphUses } from '../test-util';

let fontData: FontData;

beforeAll(async () => {
  const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
  const font = await parse(new Blob([fs.readFileSync(fontPath)]));
  fontData = getFontData(font, 'STIX2');
});

beforeEach(() => {
  // MathEditor logs every key press and mouse up.
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

type SvgStats = {
  readonly defIds: readonly string[];
  readonly uses: number;
};

const getStats = (svg: Element): SvgStats => ({
  defIds: Array.from(svg.querySelectorAll('defs > path')).map((p) => p.id),
  uses: svg.querySelectorAll('use').length,
});

/**
 * Checks every SVG in the document: each <use> resolves to a definition in its
 * own SVG, every definition is used, and no definition ID appears twice.
 */
const expectConsistent = (container: HTMLElement): void => {
  const svgs = Array.from(container.querySelectorAll('svg'));
  for (const svg of svgs) {
    // Throws if a <use> has no definition or a definition is unused.
    expandGlyphUses(svg.outerHTML);
  }
  const ids = svgs.flatMap((svg) => getStats(svg).defIds);
  expect(new Set(ids).size).toBe(ids.length);
};

const type = (keys: readonly string[]): void => {
  for (const key of keys) {
    fireEvent.keyDown(window, { key });
    fireEvent.keyUp(window, { key });
  }
};

test('typing in one of several editors changes only its own SVG', () => {
  const { container } = render(
    <FontDataContext.Provider value={fontData}>
      <MathEditor row={parseTex('x+y')} readonly={false} />
      <MathEditor row={parseTex('2a')} readonly={false} />
      <MathRenderer row={parseTex('x+1')} />
    </FontDataContext.Provider>,
  );
  const [editor1, editor2, renderer] = Array.from(
    container.querySelectorAll('svg'),
  );
  const [input1, input2] = Array.from(container.querySelectorAll('input'));
  expectConsistent(container);

  const initial1 = getStats(editor1);
  const initial2 = editor2.outerHTML;
  const rendererHtml = renderer.outerHTML;

  // Type into the first editor. '+' and '1' are new to it the first time,
  // then the second '+1' only adds <use> elements.
  fireEvent.focus(input1);
  type(['+', '1']);
  const once = getStats(editor1);
  expect(once.uses).toBe(initial1.uses + 2);
  type(['+', '1']);
  const twice = getStats(editor1);
  expect(twice.uses).toBe(initial1.uses + 4);
  expect(twice.defIds).toEqual(once.defIds);
  expectConsistent(container);

  // The other editor and the renderer didn't change.
  expect(editor2.outerHTML).toEqual(initial2);
  expect(renderer.outerHTML).toEqual(rendererHtml);

  // Deleting what was typed drops the definitions nothing uses any more.
  type(['Backspace', 'Backspace', 'Backspace', 'Backspace']);
  expect(getStats(editor1)).toEqual(initial1);
  expectConsistent(container);

  // Now type into the second editor.
  fireEvent.blur(input1);
  const editor1Html = editor1.outerHTML;
  const before2 = getStats(editor2);
  fireEvent.focus(input2);
  type(['+', '1']);
  expect(getStats(editor2).uses).toBe(before2.uses + 2);
  expectConsistent(container);

  expect(editor1.outerHTML).toEqual(editor1Html);
  expect(renderer.outerHTML).toEqual(rendererHtml);
});
