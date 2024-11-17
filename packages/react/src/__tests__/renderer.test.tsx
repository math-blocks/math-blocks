import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import format from 'xml-formatter';
import { Blob } from 'buffer';
import type { Story, StoryContext } from '@storybook/react';
import { diffChars } from 'diff';

import * as Core from '@math-blocks/core';
import * as Typesetter from '@math-blocks/typesetter';
import * as Editor from '@math-blocks/editor';
import { getFontData, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';
import { macros } from '@math-blocks/tex';

import MathRenderer from '../math-renderer';
import * as stories from '../stories/2-math-renderer.stories';
import { FontDataContext } from '../font-data-context';

const { char: glyph, row, subsup } = Editor.builders;

const reducer = Editor.getReducer(macros);
const operators = Object.keys(macros).filter((key) => key === macros[key]);

let stixFontData: FontData | null = null;
let lmFontData: FontData | null = null;

// We can't use the same loader since the storybook one relies on webpack's
// file-loader which we don't have access to here.
const stixFontLoader = async (): Promise<FontData> => {
  if (stixFontData) {
    return stixFontData;
  }

  const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
  const buffer = fs.readFileSync(fontPath);
  const blob = new Blob([buffer]);

  const font = await parse(blob);
  stixFontData = getFontData(font, 'STIX2');

  return stixFontData;
};

const lmFontLoader = async (): Promise<FontData> => {
  if (lmFontData) {
    return lmFontData;
  }

  const fontPath = path.join(
    __dirname,
    '../../../../assets/latinmodern-math.otf',
  );
  const buffer = fs.readFileSync(fontPath);
  const blob = new Blob([buffer]);

  const font = await parse(blob);
  lmFontData = getFontData(font, 'LM-Math');

  return lmFontData;
};

const storyToComponent = async function <T>(
  story: Story<T>,
  loaders = [stixFontLoader],
): Promise<React.FC> {
  const loaded = {};

  if (loaders) {
    for (const value of await Promise.all(loaders.map((loader) => loader()))) {
      Object.assign(loaded, value);
    }
  }

  return () => {
    const context: StoryContext = {
      id: '',
      kind: '',
      name: '',
      parameters: {},
      args: {},
      argTypes: {},
      globals: {},
      loaded: loaded,
    };
    // @ts-expect-error: story expects T instead of Partial<T> | undefined
    return story(story.args, context);
  };
};

declare global {
  /* eslint-disable */
  namespace jest {
    interface Matchers<R, T> {
      toMatchSVGSnapshot(): R;
    }
  }
}

// Based on code from https://github.com/jest-community/jest-snapshots-svg/blob/master/src/index.ts
expect.extend({
  toMatchSVGSnapshot(element: React.ReactElement) {
    // getState isn't in the d.ts for Jest, this is ok though.
    const state = (expect as any).getState();
    const currentTest = state.testPath as string;
    const currentTestName = state.currentTestName as string;

    const testFile = currentTestName
      .replace(/\s+/g, '-')
      .replace(/\//g, '-')
      .toLowerCase();

    //  Figure out the paths
    const snapshotsDir = path.join(currentTest, '..', '__snapshots__');
    const expectedSnapshot = path.join(
      snapshotsDir,
      path.basename(currentTest) + '-' + testFile + '.svg',
    );

    // Make our folder if it's needed
    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir);
    }

    // We will need to do something smarter in the future, these snapshots need to be 1 file per test
    // whereas jest-snapshots can be multi-test per file.

    // TODO: format the output
    const output = ReactDOMServer.renderToStaticMarkup(element);
    const svgText = format(
      '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + output,
    ).replace(/\r\n/g, '\n');

    // TODO: Determine if Jest is in `-u`?
    // can be done via the private API
    // state.snapshotState._updateSnapshot === "all"
    const mode = state.snapshotState._updateSnapshot;

    // Are we in write mode?
    if (!fs.existsSync(expectedSnapshot)) {
      fs.writeFileSync(expectedSnapshot, svgText);
      return {
        message: () => 'Created a new Snapshot',
        pass: true,
      };
    } else {
      const contents = fs.readFileSync(expectedSnapshot, 'utf8');
      if (contents !== svgText) {
        if (mode === 'all') {
          fs.writeFileSync(expectedSnapshot, svgText);
          return {
            message: () => `Updated snapshot`,
            pass: true,
          };
        }

        const diff = diffChars(contents, svgText);

        // TODO: include the diff in the message
        return {
          message: () => `SVG Snapshot failed, diff - ${JSON.stringify(diff)}`,
          pass: false,
        };
      } else {
        return { message: () => 'All good', pass: true };
      }
    }
  },
} as any);

describe('renderer', () => {
  beforeEach(() => {
    // Mock getId() so that we can have stable ids between tests.
    let i = 0;
    jest.spyOn(Core, 'getId').mockImplementation(() => {
      return i++;
    });
  });

  test('equation', async () => {
    const Equation = await storyToComponent(stories.Equation);
    expect(<Equation />).toMatchSVGSnapshot();
  });

  describe('latin modern', () => {
    test('equation', async () => {
      const Equation = await storyToComponent(stories.Equation, [lmFontLoader]);
      expect(<Equation />).toMatchSVGSnapshot();
    });

    test('tall delimiters, root, and fraction', async () => {
      const TallDelimiters = await storyToComponent(stories.TallDelimiters, [
        lmFontLoader,
      ]);
      expect(<TallDelimiters />).toMatchSVGSnapshot();
    });
  });

  describe('radicals', () => {
    describe.each`
      fontname          | fontloader
      ${'stix'}         | ${stixFontLoader}
      ${'latin modern'} | ${lmFontLoader}
    `('$fontname', ({ fontloader }) => {
      test('with degree (dynamic)', async () => {
        const RadicalWithDegreeDynamic = await storyToComponent(
          stories.RadicalWithDegreeDynamic,
          [fontloader],
        );
        expect(<RadicalWithDegreeDynamic />).toMatchSVGSnapshot();
      });

      test('with large degree (dynamic)', async () => {
        const RadicalWithLargeDegreeDynamic = await storyToComponent(
          stories.RadicalWithLargeDegreeDynamic,
          [fontloader],
        );
        expect(<RadicalWithLargeDegreeDynamic />).toMatchSVGSnapshot();
      });
    });
  });

  describe('subscript and superscripts', () => {
    describe.each`
      fontname          | fontloader
      ${'stix'}         | ${stixFontLoader}
      ${'latin modern'} | ${lmFontLoader}
    `('$fontname', ({ fontloader }) => {
      test('stress test (dynamic)', async () => {
        const SubscriptSuperscriptStressTest = await storyToComponent(
          stories.SubscriptSuperscriptStressTest,
          [fontloader],
        );
        expect(<SubscriptSuperscriptStressTest />).toMatchSVGSnapshot();
      });

      test('on tall delimiters (dynamic)', async () => {
        const ScriptsOnTallDelimiters = await storyToComponent(
          stories.ScriptsOnTallDelimiters,
          [fontloader],
        );
        expect(<ScriptsOnTallDelimiters />).toMatchSVGSnapshot();
      });
    });

    describe('cursor with tall delimiters', () => {
      let state: Editor.State;
      let editNode: Editor.types.CharRow;
      let fontData: FontData;
      const fontSize = 60;

      beforeEach(async () => {
        fontData = await stixFontLoader();
        editNode = Editor.builders.row([
          Editor.builders.delimited(
            [
              Editor.builders.frac(
                [glyph('y'), glyph('\u2212'), glyph('1')],
                [glyph('x')],
              ),
            ],
            glyph('('),
            glyph(')'),
          ),
          subsup([glyph('n')], [glyph('2')]),
        ]);

        state = {
          row: editNode,
          selecting: false,
          selection: {
            anchor: { path: [], offset: 2 },
            focus: { path: [], offset: 2 },
          },
        };
      });

      test('1 cursor at the end', () => {
        expect(
          <FontDataContext.Provider value={fontData}>
            <MathRenderer
              fontSize={fontSize}
              row={state.row}
              selection={state.selection}
              showCursor={true}
              renderMode={Typesetter.RenderMode.Dynamic}
            />
          </FontDataContext.Provider>,
        ).toMatchSVGSnapshot();
      });

      test('2 cursor in superscript', () => {
        const moveLeft = () => {
          state = reducer(state, { type: 'ArrowLeft' });
        };
        moveLeft();

        expect(
          <FontDataContext.Provider value={fontData}>
            <MathRenderer
              fontSize={fontSize}
              row={state.row}
              selection={state.selection}
              showCursor={true}
              renderMode={Typesetter.RenderMode.Dynamic}
            />
          </FontDataContext.Provider>,
        ).toMatchSVGSnapshot();
      });

      test('3 cursor in subscript', () => {
        const moveLeft = () => {
          state = reducer(state, { type: 'ArrowLeft' });
        };
        moveLeft();
        moveLeft();
        moveLeft();

        expect(
          <FontDataContext.Provider value={fontData}>
            <MathRenderer
              fontSize={fontSize}
              row={state.row}
              selection={state.selection}
              showCursor={true}
              renderMode={Typesetter.RenderMode.Dynamic}
            />
          </FontDataContext.Provider>,
        ).toMatchSVGSnapshot();
      });

      test('4 cursor inside delimited', () => {
        const moveLeft = () => {
          state = reducer(state, { type: 'ArrowLeft' });
        };
        moveLeft();
        moveLeft();
        moveLeft();
        moveLeft();
        moveLeft();

        expect(
          <FontDataContext.Provider value={fontData}>
            <MathRenderer
              fontSize={fontSize}
              row={state.row}
              selection={state.selection}
              showCursor={true}
              renderMode={Typesetter.RenderMode.Dynamic}
            />
          </FontDataContext.Provider>,
        ).toMatchSVGSnapshot();
      });
    });

    describe('selection with tall delimiters', () => {
      let state: Editor.State;
      let context: Typesetter.Context;
      let options: Typesetter.Options;
      let fontData: FontData;
      const fontSize = 60;

      beforeEach(async () => {
        fontData = await stixFontLoader();
        const editNode = Editor.builders.row([
          Editor.builders.delimited(
            [
              Editor.builders.frac(
                [glyph('y'), glyph('\u2212'), glyph('1')],
                [glyph('x')],
              ),
            ],
            glyph('('),
            glyph(')'),
          ),
          subsup([glyph('n')], [glyph('2')]),
        ]);

        context = {
          fontData: fontData,
          baseFontSize: fontSize,
          mathStyle: Typesetter.MathStyle.Display,
          renderMode: Typesetter.RenderMode.Dynamic,
          cramped: false,
          operators: operators,
        };
        options = {
          showCursor: true,
        };
        state = {
          row: editNode,
          selecting: false,
          selection: {
            anchor: { path: [], offset: 2 },
            focus: { path: [], offset: 2 },
          },
        };

        const moveLeft = () => {
          state = reducer(state, {
            type: 'ArrowLeft',
          });
        };
        moveLeft(); // into subscript
        moveLeft();
        moveLeft(); // into superscript
        moveLeft();
        moveLeft(); // outside delimited
        moveLeft(); // inside delimited
        moveLeft(); // into denominator
        moveLeft();
      });

      test('1 selection in denominator', () => {
        state = { ...state, selecting: true };
        const selectRight = () => {
          state = reducer(state, { type: 'ArrowRight' });
        };
        selectRight();

        expect(
          <FontDataContext.Provider value={fontData}>
            <MathRenderer
              fontSize={fontSize}
              row={state.row}
              selection={state.selection}
              renderMode={Typesetter.RenderMode.Dynamic}
            />
          </FontDataContext.Provider>,
        ).toMatchSVGSnapshot();
      });

      test('2 fraction selected', () => {
        state = { ...state, selecting: true };
        const selectRight = () => {
          state = reducer(state, { type: 'ArrowRight' });
        };
        selectRight();
        selectRight();

        expect(
          <FontDataContext.Provider value={fontData}>
            <MathRenderer
              fontSize={fontSize}
              row={state.row}
              selection={state.selection}
              renderMode={Typesetter.RenderMode.Dynamic}
            />
          </FontDataContext.Provider>,
        ).toMatchSVGSnapshot();
      });

      test('3 delimited selected', () => {
        state = { ...state, selecting: true };
        const selectRight = () => {
          state = reducer(state, { type: 'ArrowRight' });
        };
        selectRight();
        selectRight();
        selectRight();

        expect(
          <FontDataContext.Provider value={fontData}>
            <MathRenderer
              fontSize={fontSize}
              row={state.row}
              selection={state.selection}
              renderMode={Typesetter.RenderMode.Dynamic}
            />
          </FontDataContext.Provider>,
        ).toMatchSVGSnapshot();
      });

      test('4 subsup selected', () => {
        state = { ...state, selecting: true };
        const selectRight = () => {
          state = reducer(state, { type: 'ArrowRight' });
        };
        selectRight();
        selectRight();
        selectRight();
        selectRight();

        expect(
          <FontDataContext.Provider value={fontData}>
            <MathRenderer
              fontSize={fontSize}
              row={state.row}
              selection={state.selection}
              renderMode={Typesetter.RenderMode.Dynamic}
            />
          </FontDataContext.Provider>,
        ).toMatchSVGSnapshot();
      });
    });

    test('subsup consistency', async () => {
      const { char, subsup, row } = Editor.builders;
      const subsups = row([
        char('x'),
        subsup([char('n')], undefined),
        char('x'),
        subsup(undefined, [char('2')]),
        char('x'),
        subsup([char('n'), char('t')], [char('2'), char('j')]),
      ]);
      const fontData = await stixFontLoader();
      const fontSize = 60;

      expect(
        <FontDataContext.Provider value={fontData}>
          <MathRenderer
            fontSize={fontSize}
            row={subsups}
            renderMode={Typesetter.RenderMode.Dynamic}
          />
        </FontDataContext.Provider>,
      ).toMatchSVGSnapshot();
    });
  });

  describe('fractions', () => {
    test('colorized', async () => {
      const ColorizedFraction = await storyToComponent(
        stories.ColorizedFraction,
      );
      expect(<ColorizedFraction />).toMatchSVGSnapshot();
    });

    test('quadratic', async () => {
      const QuadraticEquation = await storyToComponent(
        stories.QuadraticEquation,
      );
      expect(<QuadraticEquation />).toMatchSVGSnapshot();
    });
  });

  describe('subsup', () => {
    test('pythagoras', async () => {
      const Pythagoras = await storyToComponent(stories.Pythagoras);
      expect(<Pythagoras />).toMatchSVGSnapshot();
    });

    test('subscripts', async () => {
      const node = row([
        glyph('a'),
        Editor.util.sup('n'),
        glyph('='),
        glyph('a'),
        subsup([glyph('n'), glyph('\u2212'), glyph('1')]),
        glyph('+'),
        glyph('a'),
        subsup([glyph('n'), glyph('\u2212'), glyph('2')]),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 60;

      expect(
        <FontDataContext.Provider value={fontData}>
          <MathRenderer
            row={node}
            fontSize={fontSize}
            style={{ background: 'white' }}
          />
        </FontDataContext.Provider>,
      ).toMatchSVGSnapshot();
    });
  });

  describe('limits', () => {
    test('lim (display)', async () => {
      const Limit = await storyToComponent(stories.Limit);
      expect(<Limit />).toMatchSVGSnapshot();
    });

    test('lim (inline)', async () => {
      const InlineLimit = await storyToComponent(stories.InlineLimit);
      expect(<InlineLimit />).toMatchSVGSnapshot();
    });

    test('sum (display)', async () => {
      const Summation = await storyToComponent(stories.Summation);
      expect(<Summation />).toMatchSVGSnapshot();
    });

    test('sum (inline)', async () => {
      const InlineSummation = await storyToComponent(stories.InlineSummation);
      expect(<InlineSummation />).toMatchSVGSnapshot();
    });

    test('integral (display)', async () => {
      const Integral = await storyToComponent(stories.Integral);
      expect(<Integral />).toMatchSVGSnapshot();
    });

    test('integral (inline)', async () => {
      const InlineIntegral = await storyToComponent(stories.InlineIntegral);
      expect(<InlineIntegral />).toMatchSVGSnapshot();
    });
  });

  describe('tall delimiters', () => {
    test('no cursor, no selection', async () => {
      const TallDelimiters = await storyToComponent(stories.TallDelimiters);
      expect(<TallDelimiters />).toMatchSVGSnapshot();
    });

    test('with cursor', async () => {
      const TallDelimitersWithCursor = await storyToComponent(
        stories.TallDelimitersWithCursor,
      );
      expect(<TallDelimitersWithCursor />).toMatchSVGSnapshot();
    });

    test('with selection', async () => {
      const TallDelimitersWithSelection = await storyToComponent(
        stories.TallDelimitersWithSelection,
      );
      expect(<TallDelimitersWithSelection />).toMatchSVGSnapshot();
    });
  });

  describe('accents', () => {
    it('should render accents', async () => {
      const row = Editor.builders.row([
        Editor.builders.accent(
          [
            Editor.builders.char('a'),
            Editor.builders.char('b'),
            Editor.builders.char('c'),
          ],
          Editor.AccentType.Hat,
        ),
        Editor.builders.char('='),
        Editor.builders.accent(
          [Editor.builders.char('i')],
          Editor.AccentType.Vec,
        ),
        Editor.builders.char('+'),
        Editor.builders.accent(
          [Editor.builders.char('j')],
          Editor.AccentType.Vec,
        ),
        Editor.builders.char('+'),
        Editor.builders.accent(
          [Editor.builders.char('k')],
          Editor.AccentType.Vec,
        ),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 60;

      expect(
        <FontDataContext.Provider value={fontData}>
          <MathRenderer
            row={row}
            showCursor={true}
            fontSize={fontSize}
            renderMode={Typesetter.RenderMode.Dynamic}
          />
        </FontDataContext.Provider>,
      ).toMatchSVGSnapshot();
    });

    it('should render empty accents', async () => {
      const row = Editor.builders.row([
        Editor.builders.accent(
          [Editor.builders.char('i')],
          Editor.AccentType.Vec,
        ),
        Editor.builders.char('+'),
        Editor.builders.accent([], Editor.AccentType.Vec),
        Editor.builders.char('+'),
        Editor.builders.accent(
          [Editor.builders.char('k')],
          Editor.AccentType.Vec,
        ),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 60;

      expect(
        <FontDataContext.Provider value={fontData}>
          <MathRenderer
            row={row}
            showCursor={true}
            fontSize={fontSize}
            renderMode={Typesetter.RenderMode.Dynamic}
          />
        </FontDataContext.Provider>,
      ).toMatchSVGSnapshot();
    });
  });

  describe('cursor', () => {
    test('cursor in the middle', async () => {
      const Cursor = await storyToComponent(stories.Cursor);
      expect(<Cursor />).toMatchSVGSnapshot();
    });

    test('cursor in front of operator', async () => {
      const row = Editor.builders.row([glyph('2'), glyph('+'), glyph('a')]);
      const selection: Editor.Selection = {
        anchor: { path: [], offset: 1 },
        focus: { path: [], offset: 1 },
      };
      const fontData = await stixFontLoader();
      const fontSize = 60;

      expect(
        <FontDataContext.Provider value={fontData}>
          <MathRenderer
            row={row}
            selection={selection}
            showCursor={true}
            fontSize={fontSize}
            renderMode={Typesetter.RenderMode.Dynamic}
          />
        </FontDataContext.Provider>,
      ).toMatchSVGSnapshot();
    });
  });

  describe('selection', () => {
    test('selection in the middle', async () => {
      const Selection = await storyToComponent(stories.Selection);
      expect(<Selection />).toMatchSVGSnapshot();
    });
  });

  describe('cancelling', () => {
    test('multiple selections side-by-side, frac, radicand', async () => {
      const Cancelling = await storyToComponent(stories.Cancelling);
      expect(<Cancelling />).toMatchSVGSnapshot();
    });
  });

  describe('tables', () => {
    test('3x3 bracket matrix', async () => {
      const Matrix = await storyToComponent(stories.Matrix);
      expect(<Matrix />).toMatchSVGSnapshot();
    });
  });

  describe('macro', () => {
    test('in progress macro', async () => {
      const InProgressMacro = await storyToComponent(stories.InProgressMacro);
      expect(<InProgressMacro />).toMatchSVGSnapshot();
    });
  });

  describe('named operators', () => {
    it('should render the operator with space before after it', async () => {
      const row = Editor.builders.row([
        Editor.builders.char('5'),
        Editor.builders.char('l'),
        Editor.builders.char('o'),
        Editor.builders.char('g'),
        Editor.builders.char('x'),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 60;

      expect(
        <FontDataContext.Provider value={fontData}>
          <MathRenderer
            row={row}
            showCursor={true}
            fontSize={fontSize}
            renderMode={Typesetter.RenderMode.Dynamic}
          />
        </FontDataContext.Provider>,
      ).toMatchSVGSnapshot();
    });

    it('should not include trailing padding with subscript', async () => {
      const row = Editor.builders.row([
        Editor.builders.char('5'),
        Editor.builders.char('l'),
        Editor.builders.char('o'),
        Editor.builders.char('g'),
        Editor.builders.subsup([Editor.builders.char('2')]),
        Editor.builders.char('x'),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 60;

      expect(
        <FontDataContext.Provider value={fontData}>
          <MathRenderer
            row={row}
            showCursor={true}
            fontSize={fontSize}
            renderMode={Typesetter.RenderMode.Dynamic}
          />
        </FontDataContext.Provider>,
      ).toMatchSVGSnapshot();
    });

    it('should not include trailing padding with superscript', async () => {
      const row = Editor.builders.row([
        Editor.builders.char('5'),
        Editor.builders.char('s'),
        Editor.builders.char('i'),
        Editor.builders.char('n'),
        Editor.builders.subsup([Editor.builders.char('2')]),
        Editor.builders.char('x'),
      ]);

      const fontData = await stixFontLoader();
      const fontSize = 60;

      expect(
        <FontDataContext.Provider value={fontData}>
          <MathRenderer
            row={row}
            showCursor={true}
            fontSize={fontSize}
            renderMode={Typesetter.RenderMode.Dynamic}
          />
        </FontDataContext.Provider>,
      ).toMatchSVGSnapshot();
    });
  });
});
