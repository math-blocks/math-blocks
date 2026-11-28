import * as React from 'react';
import cx from 'classnames';

import * as Editor from '@math-blocks/editor';
import * as Typesetter from '@math-blocks/typesetter';
import { macros } from '@math-blocks/tex';

import { useFontData } from './font-data-context';
import { useMissingGlyphs } from './use-missing-glyphs';
import styles from './editor.module.css';
import SceneRenderer from './scene-renderer';
import useEventListener from './use-event-listener';
import {
  detectShortcutPlatform,
  isShortcutEvent,
  resolveShortcuts,
  useShortcuts,
} from './shortcuts';
import type { ShortcutCommand, ShortcutsConfig } from './shortcuts';

import type { EditingEvent } from './math-keypad';

const { useEffect, useState, useRef, useCallback, useMemo } = React;

type Props = {
  // The initial value for the editor
  // consider renaming to `content` or something like that
  readonly row: Editor.types.CharRow;
  // TODO: add a `selection` prop
  // consider grouping row/content and selection together into
  // an `Editor` type.
  readonly readonly: boolean;
  readonly fontSize?: number;
  readonly radicalDegreeAlgorithm?: Typesetter.RadicalDegreeAlgorithm;
  readonly inline?: boolean;

  readonly onSubmit?: (state: Editor.State) => unknown;
  readonly onChange?: (state: Editor.State) => unknown;

  // Style
  readonly style?: React.CSSProperties;
  readonly className?: string;

  // Renders bounding boxes around each group and glyph.
  readonly showHitboxes?: boolean;

  // Called, after rendering, for each character the font can't draw (for
  // example because its glyph group isn't loaded), which is drawn as a
  // placeholder instead. `group` is set when the character's glyph group isn't
  // loaded. It's called again only when the set of missing characters changes.
  readonly onMissingGlyph?: (char: string, group: string | undefined) => void;

  // Keyboard shortcuts, such as Mod+Z to undo. They only fire while the editor
  // has focus. Pass `false` to turn them all off, or an object to rebind or
  // turn off (with `null`) some of them, e.g. `{redo: 'Mod+Y', selectAll:
  // null}`. Use `getShortcuts` with the same value to list the active ones.
  readonly shortcuts?: ShortcutsConfig;
};

const reducer = Editor.getReducer(macros);
const operators = Object.keys(macros).filter((key) => key === macros[key]);

// The action for each command in shortcuts.ts. Undo and redo aren't reducer
// actions: MathEditor handles them with its history.
const SHORTCUT_ACTIONS: {
  readonly [
    Command in Exclude<ShortcutCommand, 'undo' | 'redo'>
  ]: Editor.Action;
} = {
  moveToRowStart: { type: 'MoveToStart', scope: 'row' },
  moveToRowEnd: { type: 'MoveToEnd', scope: 'row' },
  moveToFormulaStart: { type: 'MoveToStart', scope: 'formula' },
  moveToFormulaEnd: { type: 'MoveToEnd', scope: 'formula' },
  exitRowForward: { type: 'ExitRow', direction: 'forward' },
  exitRowBackward: { type: 'ExitRow', direction: 'backward' },
  extendLeft: { type: 'ArrowLeft', extend: true },
  extendRight: { type: 'ArrowRight', extend: true },
  extendToRowStart: { type: 'MoveToStart', scope: 'row', extend: true },
  extendToRowEnd: { type: 'MoveToEnd', scope: 'row', extend: true },
  extendToFormulaStart: { type: 'MoveToStart', scope: 'formula', extend: true },
  extendToFormulaEnd: { type: 'MoveToEnd', scope: 'formula', extend: true },
  selectAll: { type: 'SelectAll' },
};

const keydownToAction = (e: KeyboardEvent): Editor.Action | null => {
  const { key } = e;
  // Don't type the letter of a shortcut such as Ctrl+C or Cmd+R. AltGr, which
  // types characters such as '{' on some layouts, sets both ctrlKey and altKey
  // on Windows, so those keys still type.
  if (key.length === 1 && (e.metaKey || (e.ctrlKey && !e.altKey))) {
    return null;
  }
  switch (key) {
    case '(':
    case ')':
    case '[':
    case ']':
    case '{':
    case '}':
    case '|':
      return { type: 'Parens', char: key };
    case 'ArrowLeft':
      return { type: 'ArrowLeft' };
    case 'ArrowRight':
      return { type: 'ArrowRight' };
    case 'ArrowUp':
      return { type: 'ArrowUp' };
    case 'ArrowDown':
      return { type: 'ArrowDown' };
    case 'Backspace':
      return { type: 'Backspace' };
    case '_':
      return { type: 'Subscript' };
    case '^':
      return { type: 'Superscript' };
    case '/':
      return { type: 'Fraction' };
    case '\u221A':
      return { type: 'Root' };
    case '*':
      return { type: 'InsertChar', char: '\u00B7' };
    case '-':
      return { type: 'InsertChar', char: '\u2212' };
    case 'Shift':
      return { type: 'StartSelecting' };
    case '\\':
      return { type: 'Backslash' };
    case ' ':
      return { type: 'Space' };
    default: {
      if (key.length === 1 && key.charCodeAt(0) > 32) {
        return { type: 'InsertChar', char: key };
      }
    }
  }
  return null;
};

const keyupToAction = (key: string): Editor.Action | null => {
  switch (key) {
    case 'Shift':
      return { type: 'StopSelecting' };
    default:
      return null;
  }
};

// TODO: expose other settings such as display style as props
// TODO: add an onBlur prop
export const MathEditor = (props: Props): React.ReactNode => {
  const memoizedState: Editor.State = useMemo(() => {
    return {
      selecting: false,
      selection: Editor.SelectionUtils.makeSelection([], 0),
      row: props.row,
    };
  }, [props.row]);

  const [history, setHistory] = useState<Editor.History>(() =>
    Editor.HistoryUtils.create(memoizedState),
  );
  const state = history.present;
  // Records a new state. Content changes become undo steps, cursor and
  // selection changes don't (see HistoryUtils.push).
  const setState = useCallback((newState: Editor.State): void => {
    setHistory((history) => Editor.HistoryUtils.push(history, newState));
  }, []);
  const [active, setActive] = useState<boolean>(false);
  const [mouseDown, setMouseDown] = useState<boolean>(false);

  const fontData = useFontData('MathEditor');
  const recordMissingGlyph = useMissingGlyphs(props.onMissingGlyph);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // The platform picks the default shortcuts and what `Mod` means.
  const platform = useMemo(detectShortcutPlatform, []);
  const shortcuts = useMemo(
    () => resolveShortcuts(props.readonly ? false : props.shortcuts, platform),
    [props.readonly, props.shortcuts, platform],
  );

  // Tab and Shift+Tab only move out of a sub-formula when the cursor is in
  // one. Otherwise they're left alone, so they move focus out of the editor.
  const insideSubformula = state.selection.focus.path.length > 0;
  const isShortcutEnabled = (command: ShortcutCommand): boolean =>
    (command !== 'exitRowForward' && command !== 'exitRowBackward') ||
    insideSubformula;

  const runShortcut = (command: ShortcutCommand): void => {
    let newHistory: Editor.History;
    if (command === 'undo') {
      newHistory = Editor.HistoryUtils.undo(history);
    } else if (command === 'redo') {
      newHistory = Editor.HistoryUtils.redo(history);
    } else {
      newHistory = Editor.HistoryUtils.push(
        history,
        reducer(state, SHORTCUT_ACTIONS[command]),
      );
    }
    if (newHistory === history) {
      return;
    }
    setHistory(newHistory);
    // Like typing, every shortcut calls onChange, even when only the cursor
    // moves.
    props.onChange?.(newHistory.present);
  };

  useShortcuts(inputRef, shortcuts, isShortcutEnabled, runShortcut, platform);

  const handleKeydown = useCallback(
    (e: KeyboardEvent): void => {
      if (active && !props.readonly) {
        // Leave shortcuts to the handlers useShortcuts registers on the
        // input. Stopping the event here, in the capture phase on window,
        // would keep it from reaching them.
        if (isShortcutEvent(e, shortcuts, isShortcutEnabled, platform)) {
          return;
        }

        const action = keydownToAction(e);

        if (e.key === 'Enter' && props.onSubmit) {
          props.onSubmit(state);
        }

        if (action) {
          const newState = reducer(state, action);
          setState(newState);

          // We always call on change even when the user is moving the
          // cursor.  The underlying content doesn't change, but how
          // it's represented in memory is.  If we don't do this, when
          // the tutor tries to highlight mistakes it will be doing so
          // with a stale value.
          if (props.onChange) {
            props.onChange(newState);
          }
        }

        // Keep the page from also handling a key the editor used, e.g. a
        // '/' shortcut that would move focus to a search box.
        e.stopPropagation();
      }
    },
    // isShortcutEnabled only depends on state, which is listed.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [state, props, active, shortcuts, platform, setState],
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent): void => {
      if (active && !props.readonly) {
        const action = keyupToAction(e.key);
        if (action) {
          setState(reducer(state, action));
        }
      }
    },
    [props, state, active, setState],
  );

  useEventListener('keydown', handleKeydown);
  useEventListener('keyup', handleKeyUp);

  type FormattingEvent =
    | {
        type: 'color';
        value: string;
      }
    | {
        type: 'cancel';
      }
    | {
        type: 'uncancel';
      };

  const handleFormatting = useCallback(
    (e: CustomEvent<FormattingEvent>): void => {
      if (!active || props.readonly) {
        return;
      }
      const { detail } = e;
      if (detail.type === 'color') {
        const newState = reducer(state, {
          type: 'Color',
          color: detail.value,
        });
        setState(newState);
      } else if (detail.type === 'cancel') {
        const newState = reducer(state, { type: 'Cancel' });
        setState(newState);
      } else if (detail.type === 'uncancel') {
        const newState = reducer(state, { type: 'Uncancel' });
        setState(newState);
      }
    },
    [state, active, props.readonly, setState],
  ) as EventListener;

  // TODO: don't add event listener to window otherwise this event will
  // affect multiple MathEditor instances
  useEffect(
    () => {
      // Add event listener
      window.addEventListener('formatting', handleFormatting);

      // Remove event listener on cleanup
      return () => {
        window.removeEventListener('formatting', handleFormatting);
      };
    },
    [handleFormatting], // Re-run if the handler changes
  );

  const handleEditing = useCallback(
    ({ detail }: CustomEvent<EditingEvent>): void => {
      if (!active || props.readonly) {
        return;
      }
      const newState = reducer(state, detail);
      setState(newState);
    },
    [state, active, props.readonly, setState],
  ) as EventListener;

  // TODO: don't add event listener to window otherwise this event will
  // affect multiple MathEditor instances
  useEffect(
    () => {
      // Add event listener
      window.addEventListener('editing', handleEditing);

      // Remove event listener on cleanup
      return () => {
        window.removeEventListener('editing', handleEditing);
      };
    },
    [handleEditing], // Re-run if the handler changes
  );

  const positionCursor = (e: React.MouseEvent, selecting: boolean): void => {
    if (!svgRef?.current) {
      return;
    }
    const bounds = svgRef.current.getBoundingClientRect();
    const point = { x: e.clientX - bounds.x, y: e.clientY - bounds.y };

    const intersections = Typesetter.SceneGraph.findIntersections(
      point,
      scene.hitboxes,
    );

    // TODO: handle select === true
    const newState = reducer(state, {
      type: 'UpdateSelection',
      intersections,
      selecting,
    });
    setState(newState);
  };

  // We need to update the state.zipper when props.zipper changes otherwise
  // it looks like fast-refresh is broken.
  // A new row starts a new undo history.
  React.useEffect(() => {
    const newState = {
      selecting: false,
      selection: Editor.SelectionUtils.makeSelection([], 0),
      row: props.row,
    };
    setHistory(Editor.HistoryUtils.create(newState));
  }, [props.row]);

  const { className, style = {}, fontSize = 64, showHitboxes, inline } = props;

  const context: Typesetter.Context = {
    fontData: fontData,
    baseFontSize: fontSize,
    mathStyle: inline
      ? Typesetter.MathStyle.Text
      : Typesetter.MathStyle.Display,
    cramped: false,
    renderMode: Typesetter.RenderMode.Dynamic,
    radicalDegreeAlgorithm: props.radicalDegreeAlgorithm,
    selection: state.selection,
    operators: operators,
    recordMissingGlyph,
  };

  // TODO: properly type this
  const options = {
    showCursor: active,
    debug: true, // this is no longer on the typeset.ts::Options
  };

  const scene = Typesetter.typeset(state.row, context, options);

  const classNames: Record<string, boolean> = {
    [styles.container]: true,
    [styles.focus]: active,
  };

  if (className) {
    classNames[className] = true;
  }

  return (
    <div
      tabIndex={!props.readonly ? 0 : undefined}
      ref={containerRef}
      onClick={(e) => {
        inputRef?.current?.focus();
      }}
      onMouseDown={(e) => {
        e.preventDefault(); // prevent blurring the input
        setActive(true);
        setMouseDown(true);
        positionCursor(e, e.shiftKey);
      }}
      onMouseMove={(e) => {
        if (mouseDown) {
          positionCursor(e, true);
        }
      }}
      onMouseUp={(e) => {
        setMouseDown(false);
        setState(reducer(state, { type: 'StopSelecting' }));

        console.log(state.selection);
        console.log(Editor.SelectionUtils.getPathAndRange(state.selection));
      }}
      className={cx(classNames)}
      style={style}
      role="textbox"
    >
      <input
        ref={inputRef}
        type="text"
        style={{
          transform: 'scale(0)',
          width: 0,
          height: 0,
          margin: 0,
          padding: 0,
          border: 'none',
        }}
        onBlur={() => setActive(false)}
        onFocus={() => setActive(true)}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck="false"
      />
      <SceneRenderer scene={scene} ref={svgRef} showHitboxes={showHitboxes} />
    </div>
  );
};

export default MathEditor;
