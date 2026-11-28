import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import * as Typesetter from '@math-blocks/typesetter';
import { macros } from '@math-blocks/tex';

import { useMouseSelection } from './use-mouse-selection';
import type { MousePosition } from './use-mouse-selection';

const { useCallback, useEffect, useRef, useState } = React;

// The renderer only applies selection actions, which the editor's reducer
// handles without touching the row.
const reducer = Editor.getReducer(macros);

const initialState = (row: Editor.types.CharRow): Editor.State => ({
  row,
  selecting: false,
  selection: Editor.SelectionUtils.makeSelection([], 0),
});

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Moves a mouse position that's outside the math onto its nearest edge, so
 * that dragging past the math selects up to its start or end. The SVG is a
 * little wider than the math, to leave room for a cursor, so this clamps to
 * the scene's size rather than the SVG's.
 */
const clampToScene = (
  svg: Element,
  scene: Typesetter.SceneGraph.Scene,
  e: MousePosition,
): MousePosition => {
  const bounds = svg.getBoundingClientRect();
  return {
    clientX: clamp(e.clientX, bounds.left + 1, bounds.left + scene.width - 1),
    clientY: clamp(e.clientY, bounds.top + 1, bounds.top + scene.height - 1),
  };
};

type Options = {
  readonly row: Editor.types.CharRow;
  // Whether the user can select the math at all.
  readonly selectable: boolean;
  // The SVG the math is drawn in.
  readonly svgRef: React.RefObject<SVGSVGElement | null>;
  // Returns the scene that's currently drawn.
  readonly getScene: () => Typesetter.SceneGraph.Scene;
};

export type RendererSelection = {
  // What the user has selected, or undefined when nothing is selected. A
  // collapsed selection counts as nothing, because MathRenderer doesn't show
  // a cursor.
  readonly selection: Editor.Selection | undefined;
  // Starts selecting. Undefined when the math isn't selectable.
  readonly onMouseDown: React.MouseEventHandler<SVGSVGElement> | undefined;
};

/**
 * The selection the user makes by dragging across a MathRenderer's math. It
 * uses the editor's selection model, so it follows the math's structure.
 *
 * Like the page's own text selection, it's cleared by a mouse down anywhere
 * else, which also means only one renderer holds a selection at a time. A
 * drag that leaves the math keeps selecting up to the math's edge.
 */
export const useRendererSelection = ({
  row,
  selectable,
  svgRef,
  getScene,
}: Options): RendererSelection => {
  const [state, setState] = useState<Editor.State>(() => initialState(row));
  // A new row starts with nothing selected.
  const current = state.row === row ? state : initialState(row);

  const mouse = useMouseSelection({
    svgRef,
    getScene,
    dispatch: (action) =>
      setState((prev) =>
        reducer(prev.row === row ? prev : initialState(row), action),
      ),
  });

  const clear = useCallback(
    (): void => setState((prev) => initialState(prev.row)),
    [],
  );

  // While the button is down, follow the mouse anywhere on the page, not just
  // over the math, and stop when it comes up anywhere.
  const latestMouse = useRef(mouse);
  latestMouse.current = mouse;
  const latestGetScene = useRef(getScene);
  latestGetScene.current = getScene;
  useEffect(() => {
    if (!mouse.mouseDown) {
      return;
    }
    const onMove = (e: MouseEvent): void => {
      const svg = svgRef.current;
      if (svg) {
        latestMouse.current.onMouseMove(
          clampToScene(svg, latestGetScene.current(), e),
        );
      }
    };
    const onUp = (): void => latestMouse.current.onMouseUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [mouse.mouseDown, svgRef]);

  const hasSelection =
    selectable && !Editor.SelectionUtils.isCollapsed(current.selection);

  // A mouse down outside the math clears the selection.
  useEffect(() => {
    if (!hasSelection) {
      return;
    }
    const onDown = (e: MouseEvent): void => {
      const svg = svgRef.current;
      if (!svg || !(e.target instanceof Node) || !svg.contains(e.target)) {
        clear();
      }
    };
    document.addEventListener('mousedown', onDown, { capture: true });
    return () => {
      document.removeEventListener('mousedown', onDown, { capture: true });
    };
  }, [hasSelection, clear, svgRef]);

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>): void => {
    if (e.button !== 0) {
      return;
    }
    // Keep the browser from starting a text selection of its own. That also
    // keeps it from clearing the one there is, so clear it here.
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    mouse.onMouseDown(e, e.shiftKey);
  };

  return {
    selection: hasSelection ? current.selection : undefined,
    onMouseDown: selectable ? onMouseDown : undefined,
  };
};
