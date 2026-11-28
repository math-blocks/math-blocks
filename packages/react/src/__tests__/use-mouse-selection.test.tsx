/**
 * @vitest-environment jsdom
 */
// The mouse handling MathEditor and MathRenderer share: dragging over the math
// dispatches UpdateSelection actions, and letting go dispatches StopSelecting.
import fs from 'fs';
import path from 'path';
import React from 'react';
import { act, fireEvent, render, renderHook } from '@testing-library/react';
import type { RenderHookResult } from '@testing-library/react';
// In the jsdom environment, Vitest resolves 'buffer' to the npm polyfill, which
// has no Blob, so ask for Node's module.
import { Blob } from 'node:buffer';

import * as Editor from '@math-blocks/editor';
import * as Typesetter from '@math-blocks/typesetter';
import { getFontData, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';
import { macros } from '@math-blocks/tex';

import MathEditor from '../math-editor';
import MathRenderer from '../math-renderer';
import { FontDataContext } from '../font-data-context';
import { useMouseSelection } from '../use-mouse-selection';
import type {
  MouseSelectionHandlers,
  SelectionAction,
} from '../use-mouse-selection';

const { row, char } = Editor.builders;

const reducer = Editor.getReducer(macros);
const operators = Object.keys(macros).filter((key) => key === macros[key]);

let fontData: FontData;

beforeAll(async () => {
  const fontPath = path.join(__dirname, '../../../../assets/STIX2Math.otf');
  const font = await parse(new Blob([fs.readFileSync(fontPath)]));
  fontData = getFontData(font, 'STIX2');
});

beforeEach(() => {
  // MathEditor logs every mouse up.
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// 2x+5=10. With a 64px font, x=67 is over the '+' and x=257 is over the '1',
// the same points as in selection.test.tsx.
const getMath = (): Editor.types.CharRow =>
  row([
    char('2'),
    char('x'),
    char('+'),
    char('5'),
    char('='),
    char('1'),
    char('0'),
  ]);

const typesetForEditor = (
  math: Editor.types.CharRow,
): Typesetter.SceneGraph.Scene =>
  Typesetter.typeset(math, {
    fontData,
    baseFontSize: 64,
    mathStyle: Typesetter.MathStyle.Display,
    renderMode: Typesetter.RenderMode.Dynamic,
    cramped: false,
    operators,
  });

// A stand-in for the SVG, placed at (left, top) in the viewport.
const fakeSvg = (left: number, top: number): Element => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.getBoundingClientRect = () => new DOMRect(left, top, 400, 100);
  return svg;
};

const mouseEvent = (x: number, y: number): React.MouseEvent =>
  ({ clientX: x, clientY: y }) as React.MouseEvent;

type Setup = {
  readonly hook: RenderHookResult<MouseSelectionHandlers, unknown>;
  readonly actions: readonly SelectionAction[];
  // The selection after applying the actions to an editor state, as
  // MathEditor does.
  readonly getSelection: () => Editor.Selection;
};

describe('useMouseSelection', () => {
  const setup = (svg: Element | null): Setup => {
    const math = getMath();
    const scene = typesetForEditor(math);
    const actions: SelectionAction[] = [];
    const hook = renderHook(() =>
      useMouseSelection({
        svgRef: { current: svg },
        getScene: () => scene,
        dispatch: (action) => actions.push(action),
      }),
    );
    const getSelection = (): Editor.Selection =>
      actions.reduce<Editor.State>(reducer, {
        row: math,
        selecting: false,
        selection: Editor.SelectionUtils.makeSelection([], 0),
      }).selection;
    return { hook, actions, getSelection };
  };

  test('dragging selects from where the button went down', () => {
    const { hook, actions, getSelection } = setup(fakeSvg(0, 0));

    act(() => hook.result.current.onMouseDown(mouseEvent(67, 30), false));
    expect(hook.result.current.mouseDown).toBe(true);
    act(() => hook.result.current.onMouseMove(mouseEvent(257, 30)));
    act(() => hook.result.current.onMouseUp());

    expect(hook.result.current.mouseDown).toBe(false);
    expect(actions.map((action) => action.type)).toEqual([
      'UpdateSelection',
      'UpdateSelection',
      'StopSelecting',
    ]);
    expect(getSelection()).toEqual({
      anchor: { path: [], offset: 2 },
      focus: { path: [], offset: 5 },
    });
  });

  test('hit-tests relative to the SVG', () => {
    const { hook, getSelection } = setup(fakeSvg(100, 50));

    act(() => hook.result.current.onMouseDown(mouseEvent(167, 80), false));
    act(() => hook.result.current.onMouseMove(mouseEvent(357, 80)));

    expect(getSelection()).toEqual({
      anchor: { path: [], offset: 2 },
      focus: { path: [], offset: 5 },
    });
  });

  test('moving the mouse without the button down does nothing', () => {
    const { hook, actions } = setup(fakeSvg(0, 0));

    act(() => hook.result.current.onMouseMove(mouseEvent(257, 30)));

    expect(actions).toEqual([]);
  });

  test('extending a selection keeps its anchor', () => {
    const { hook, getSelection } = setup(fakeSvg(0, 0));

    act(() => hook.result.current.onMouseDown(mouseEvent(67, 30), false));
    act(() => hook.result.current.onMouseUp());
    act(() => hook.result.current.onMouseDown(mouseEvent(257, 30), true));

    expect(getSelection()).toEqual({
      anchor: { path: [], offset: 2 },
      focus: { path: [], offset: 5 },
    });
  });

  test('does nothing before the SVG is rendered', () => {
    const { hook, actions } = setup(null);

    act(() => hook.result.current.onMouseDown(mouseEvent(67, 30), false));

    expect(actions).toEqual([]);
  });
});

// The selection layer is the first child of the SVG's <g>: the rectangles
// drawn behind the selected glyphs.
const getSelectionLayer = (svg: Element): string =>
  svg.querySelector('svg > g')?.firstElementChild?.outerHTML ?? '';

test("dragging in MathEditor highlights the selection as MathRenderer's selection prop draws it", () => {
  const math = getMath();
  const { container } = render(
    <FontDataContext.Provider value={fontData}>
      <MathEditor row={math} readonly={false} />
    </FontDataContext.Provider>,
  );
  // jsdom puts every element at (0, 0), so client coordinates are the same as
  // coordinates in the SVG.
  const textbox = container.querySelector('[role="textbox"]') as Element;
  fireEvent.mouseDown(textbox, { clientX: 67, clientY: 30 });
  fireEvent.mouseMove(textbox, { clientX: 257, clientY: 30 });
  fireEvent.mouseUp(textbox, { clientX: 257, clientY: 30 });

  const expected = render(
    <FontDataContext.Provider value={fontData}>
      <MathRenderer
        row={math}
        renderMode={Typesetter.RenderMode.Dynamic}
        selection={{
          anchor: { path: [], offset: 2 },
          focus: { path: [], offset: 5 },
        }}
      />
    </FontDataContext.Provider>,
  );

  const editorLayer = getSelectionLayer(
    container.querySelector('svg') as Element,
  );
  expect(editorLayer).toContain('<rect');
  expect(editorLayer).toEqual(
    getSelectionLayer(expected.container.querySelector('svg') as Element),
  );
});
