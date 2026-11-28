import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import * as Typesetter from '@math-blocks/typesetter';

// The actions that turn mouse input into a selection. They're a subset of the
// editor's actions, so a component can pass them to the editor's reducer.
export type SelectionAction = Extract<
  Editor.Action,
  { readonly type: 'UpdateSelection' } | { readonly type: 'StopSelecting' }
>;

type Point = { readonly x: number; readonly y: number };

/**
 * Hit-tests a point in client coordinates (e.g. a mouse event's `clientX` and
 * `clientY`) against the hitboxes of the scene drawn in `svg`.
 */
export const hitTest = (
  svg: Element,
  scene: Typesetter.SceneGraph.Scene,
  client: Point,
): Typesetter.Intersection[] => {
  const bounds = svg.getBoundingClientRect();
  const point = { x: client.x - bounds.x, y: client.y - bounds.y };
  return Typesetter.SceneGraph.findIntersections(point, scene.hitboxes);
};

type Options = {
  // The SVG the scene is drawn in.
  readonly svgRef: React.RefObject<Element | null>;
  // Returns the scene that's currently drawn. It's called when the mouse
  // moves, after rendering, so it can return a scene typeset later in the
  // render than this hook is called.
  readonly getScene: () => Typesetter.SceneGraph.Scene;
  // Receives the actions to apply to the selection.
  readonly dispatch: (action: SelectionAction) => void;
};

export type MouseSelectionHandlers = {
  // Whether the mouse button went down over the math and hasn't come up yet.
  readonly mouseDown: boolean;
  // Moves the focus of the selection to the mouse. Extends the selection from
  // its anchor when `extend` is true, e.g. with the shift key held down,
  // otherwise collapses it there.
  readonly onMouseDown: (e: React.MouseEvent, extend: boolean) => void;
  // Extends the selection to the mouse while the button is down.
  readonly onMouseMove: (e: React.MouseEvent) => void;
  readonly onMouseUp: () => void;
};

/**
 * Turns mouse input over typeset math into selection actions: the mouse
 * handling that MathEditor and MathRenderer share. It doesn't own the
 * selection. The component applies the actions to its own state, e.g. with
 * the editor's reducer.
 */
export const useMouseSelection = ({
  svgRef,
  getScene,
  dispatch,
}: Options): MouseSelectionHandlers => {
  const [mouseDown, setMouseDown] = React.useState<boolean>(false);

  const positionFocus = (e: React.MouseEvent, selecting: boolean): void => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    dispatch({
      type: 'UpdateSelection',
      intersections: hitTest(svg, getScene(), { x: e.clientX, y: e.clientY }),
      selecting,
    });
  };

  return {
    mouseDown,
    onMouseDown: (e, extend) => {
      setMouseDown(true);
      positionFocus(e, extend);
    },
    onMouseMove: (e) => {
      if (mouseDown) {
        positionFocus(e, true);
      }
    },
    onMouseUp: () => {
      setMouseDown(false);
      dispatch({ type: 'StopSelecting' });
    },
  };
};
