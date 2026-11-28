import * as React from 'react';

import * as Editor from '@math-blocks/editor';
import * as Typesetter from '@math-blocks/typesetter';
import { macros } from '@math-blocks/tex';

import { selectionToClipboard, writeToClipboard } from './clipboard';
import { hasTextSelection } from './native-selection';
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

const isOutside = (element: Element, e: MousePosition): boolean => {
  const bounds = element.getBoundingClientRect();
  return (
    e.clientX < bounds.left ||
    e.clientX > bounds.right ||
    e.clientY < bounds.top ||
    e.clientY > bounds.bottom
  );
};

// Whether a mouse position outside an element comes after it in reading
// order: below it, or beside it on the right.
const isAfter = (element: Element, e: MousePosition): boolean => {
  const bounds = element.getBoundingClientRect();
  if (e.clientY > bounds.bottom) {
    return true;
  }
  if (e.clientY < bounds.top) {
    return false;
  }
  return e.clientX > bounds.right;
};

// The position in the page's text under a point, if there's any text there.
const caretFromPoint = (
  x: number,
  y: number,
): { readonly node: Node; readonly offset: number } | null => {
  if ('caretPositionFromPoint' in document) {
    const position = document.caretPositionFromPoint(x, y);
    return position
      ? { node: position.offsetNode, offset: position.offset }
      : null;
  }
  // Safari before 18.4, and Chrome before 128, only have the older,
  // non-standard caretRangeFromPoint.
  if ('caretRangeFromPoint' in document) {
    // oxlint-disable-next-line typescript/no-deprecated
    const range = (document as Document).caretRangeFromPoint(x, y);
    return range
      ? { node: range.startContainer, offset: range.startOffset }
      : null;
  }
  return null;
};

const indexInParent = (node: Node): number =>
  node.parentNode
    ? Array.from(node.parentNode.childNodes).indexOf(node as ChildNode)
    : -1;

/**
 * Selects the page's text from the math to a mouse position outside it, for a
 * drag that starts in the math and ends in the text around it. The selection
 * covers all of the math, from before its first element when the mouse is
 * after it, or from after its last element when the mouse is before it.
 * Returns false when there's no text under the mouse.
 */
const selectTextFromMath = (
  elements: readonly Element[],
  e: MousePosition,
): boolean => {
  const first = elements[0];
  const last = elements[elements.length - 1];
  const parent = first.parentNode;
  const caret = caretFromPoint(e.clientX, e.clientY);
  if (
    !parent ||
    !caret ||
    last.contains(caret.node) ||
    first.contains(caret.node)
  ) {
    return false;
  }
  const after = isAfter(first, e);
  const anchorOffset = after ? indexInParent(first) : indexInParent(last) + 1;
  document
    .getSelection()
    ?.setBaseAndExtent(parent, anchorOffset, caret.node, caret.offset);
  return true;
};

type Options = {
  readonly row: Editor.types.CharRow;
  // Whether the user can select the math at all.
  readonly selectable: boolean;
  // The SVG the math is drawn in.
  readonly svgRef: React.RefObject<SVGSVGElement | null>;
  // The hidden MathML that follows the SVG, if it's rendered.
  readonly mathmlRef: React.RefObject<Element | null>;
  // Returns the scene that's currently drawn.
  readonly getScene: () => Typesetter.SceneGraph.Scene;
  // How the math is displayed, for the MathML that's copied.
  readonly display: 'block' | 'inline';
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
 * drag that leaves the math for the text around it turns into a text
 * selection, from the math to the mouse, which takes in all of the math (see
 * native-selection.ts). Where there's no text, it keeps selecting up to the
 * math's edge.
 *
 * Copying while there's a selection puts the selected math on the clipboard,
 * as TeX and as MathML.
 */
export const useRendererSelection = ({
  row,
  selectable,
  svgRef,
  mathmlRef,
  getScene,
  display,
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
      if (!svg) {
        return;
      }
      const elements = [svg, mathmlRef.current].filter(
        (element): element is Element => element !== null,
      );
      if (isOutside(svg, e) && selectTextFromMath(elements, e)) {
        return;
      }
      // Back over the math, or somewhere without text: select inside the
      // math again.
      if (hasTextSelection()) {
        document.getSelection()?.removeAllRanges();
      }
      latestMouse.current.onMouseMove(
        clampToScene(svg, latestGetScene.current(), e),
      );
    };
    const onUp = (): void => latestMouse.current.onMouseUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [mouse.mouseDown, svgRef, mathmlRef]);

  const hasSelection =
    selectable && !Editor.SelectionUtils.isCollapsed(current.selection);

  // A mouse down outside the math clears the selection, and so does a text
  // selection made some other way, e.g. with the keyboard. A text selection
  // made by dragging out of this math leaves it be until the drag ends.
  const { mouseDown } = mouse;
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
    const onSelectionChange = (): void => {
      if (!mouseDown && hasTextSelection()) {
        clear();
      }
    };
    document.addEventListener('mousedown', onDown, { capture: true });
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('mousedown', onDown, { capture: true });
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [hasSelection, clear, svgRef, mouseDown]);

  // Copying copies the selected math. A text selection, e.g. one made with
  // the keyboard since, is left for the browser to copy.
  const { row: selectedFrom, selection } = current;
  useEffect(() => {
    if (!hasSelection) {
      return;
    }
    const onCopy = (e: ClipboardEvent): void => {
      if (hasTextSelection()) {
        return;
      }
      const content = selectionToClipboard(selectedFrom, selection, display);
      if (content) {
        writeToClipboard(e, content);
      }
    };
    document.addEventListener('copy', onCopy);
    return () => document.removeEventListener('copy', onCopy);
  }, [hasSelection, selectedFrom, selection, display]);

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
