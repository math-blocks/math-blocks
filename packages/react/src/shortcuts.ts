// Keyboard shortcuts for MathEditor.
//
// This is the only module that imports TanStack Hotkeys, which is still in
// beta. The types it exports are our own, so the library can be replaced
// without changing MathEditor's props or the package's exports. Hotkeys are
// written as strings such as 'Mod+Shift+Z' (see `ShortcutsConfig`).
import {
  detectPlatform,
  formatForDisplay,
  matchesKeyboardEvent,
  parseHotkey,
} from '@tanstack/hotkeys';
import type { Hotkey, HotkeyChord } from '@tanstack/hotkeys';
import { useHotkeys } from '@tanstack/react-hotkeys';
import type { UseHotkeyDefinition } from '@tanstack/react-hotkeys';
import type { RefObject } from 'react';

/** The commands that MathEditor's keyboard shortcuts run. */
export type ShortcutCommand =
  | 'moveToRowStart'
  | 'moveToRowEnd'
  | 'moveToFormulaStart'
  | 'moveToFormulaEnd'
  | 'exitRowForward'
  | 'exitRowBackward'
  | 'extendLeft'
  | 'extendRight'
  | 'extendToRowStart'
  | 'extendToRowEnd'
  | 'extendToFormulaStart'
  | 'extendToFormulaEnd'
  | 'selectAll'
  | 'undo'
  | 'redo';

/** The hotkeys bound to each command. */
export type ShortcutBindings = {
  readonly [Command in ShortcutCommand]: readonly string[];
};

/**
 * How an app configures MathEditor's shortcuts, through its `shortcuts` prop.
 *
 * - `false` turns every shortcut off.
 * - An object rebinds the commands it names and keeps the defaults for the
 *   rest. A command's value is a hotkey, such as `'Mod+Shift+Z'`, a list of
 *   hotkeys, or `null` (or `[]`) to turn that command's shortcut off.
 *
 * A hotkey is modifiers and a key joined by `+`. The modifiers are `Mod`
 * (Command on macOS, Control elsewhere), `Control`, `Alt`, `Shift` and `Meta`.
 * The key is a character, such as `A`, or a key name from
 * `KeyboardEvent.key`, such as `Home` or `ArrowLeft`.
 */
export type ShortcutsConfig =
  | false
  | {
      readonly [Command in ShortcutCommand]?: string | readonly string[] | null;
    };

/** The platform that decides what `Mod` means and how hotkeys are shown. */
export type ShortcutPlatform = 'mac' | 'windows' | 'linux';

/** An active shortcut, as `getShortcuts` lists it for a help screen. */
export type Shortcut = {
  readonly command: ShortcutCommand;
  /** What the command does, in English, e.g. "Undo". */
  readonly description: string;
  /** The hotkeys bound to it, as configured, e.g. `['Mod+Z']`. */
  readonly hotkeys: readonly string[];
  /** The hotkeys formatted for the platform, e.g. `['⌘ Z']` on macOS. */
  readonly labels: readonly string[];
};

/** The shortcuts MathEditor uses unless its `shortcuts` prop changes them. */
export const DEFAULT_SHORTCUTS: ShortcutBindings = {
  moveToRowStart: ['Home'],
  moveToRowEnd: ['End'],
  moveToFormulaStart: ['Mod+Home'],
  moveToFormulaEnd: ['Mod+End'],
  exitRowForward: ['Tab'],
  exitRowBackward: ['Shift+Tab'],
  extendLeft: ['Shift+ArrowLeft'],
  extendRight: ['Shift+ArrowRight'],
  extendToRowStart: ['Shift+Home'],
  extendToRowEnd: ['Shift+End'],
  extendToFormulaStart: ['Mod+Shift+Home'],
  extendToFormulaEnd: ['Mod+Shift+End'],
  selectAll: ['Mod+A'],
  undo: ['Mod+Z'],
  redo: ['Mod+Shift+Z', 'Mod+Y'],
};

const DESCRIPTIONS: { readonly [Command in ShortcutCommand]: string } = {
  moveToRowStart: 'Move to the start of the current part',
  moveToRowEnd: 'Move to the end of the current part',
  moveToFormulaStart: 'Move to the start of the formula',
  moveToFormulaEnd: 'Move to the end of the formula',
  exitRowForward: 'Move out of the current part, forward',
  exitRowBackward: 'Move out of the current part, backward',
  extendLeft: 'Extend the selection left',
  extendRight: 'Extend the selection right',
  extendToRowStart: 'Select to the start of the current part',
  extendToRowEnd: 'Select to the end of the current part',
  extendToFormulaStart: 'Select to the start of the formula',
  extendToFormulaEnd: 'Select to the end of the formula',
  selectAll: 'Select all',
  undo: 'Undo',
  redo: 'Redo',
};

// The commands in the order DEFAULT_SHORTCUTS lists them.
const COMMANDS = Object.keys(DEFAULT_SHORTCUTS) as readonly ShortcutCommand[];

const toList = (
  value: string | readonly string[] | null | undefined,
  fallback: readonly string[],
): readonly string[] => {
  if (value === undefined) {
    return fallback;
  }
  if (value === null) {
    return [];
  }
  return typeof value === 'string' ? [value] : value;
};

/**
 * Applies a `shortcuts` prop to the defaults: the hotkeys bound to each
 * command, with `[]` for a command that's turned off.
 */
export const resolveShortcuts = (
  config: ShortcutsConfig | undefined,
): ShortcutBindings => {
  if (config === false) {
    return Object.fromEntries(
      COMMANDS.map((command) => [command, []]),
    ) as unknown as ShortcutBindings;
  }
  if (config === undefined) {
    return DEFAULT_SHORTCUTS;
  }
  return Object.fromEntries(
    COMMANDS.map((command) => [
      command,
      toList(config[command], DEFAULT_SHORTCUTS[command]),
    ]),
  ) as unknown as ShortcutBindings;
};

/**
 * Lists the shortcuts that are on for a `shortcuts` prop (the defaults when
 * it's left out), for a help screen or cheatsheet. Commands whose shortcut is
 * turned off are left out.
 *
 * `platform` sets what `Mod` shows as. It's detected from the browser when
 * left out, which matches what MathEditor does.
 *
 * `Tab` and `Shift+Tab` only apply while the cursor is inside a part of the
 * formula, such as a numerator, so they still move focus out of the editor
 * otherwise. They're listed either way.
 */
export const getShortcuts = (
  config?: ShortcutsConfig,
  options: { readonly platform?: ShortcutPlatform } = {},
): readonly Shortcut[] => {
  const bindings = resolveShortcuts(config);
  const platform = options.platform ?? detectPlatform();
  return COMMANDS.filter((command) => bindings[command].length > 0).map(
    (command) => ({
      command,
      description: DESCRIPTIONS[command],
      hotkeys: bindings[command],
      labels: bindings[command].map((hotkey) =>
        formatForDisplay(hotkey as Hotkey, { platform }),
      ),
    }),
  );
};

/**
 * Whether `event` is one of the hotkeys in `bindings` for a command that
 * `isEnabled` allows. MathEditor's own key handler uses this to leave those
 * keys to the shortcut handlers.
 */
export const isShortcutEvent = (
  event: KeyboardEvent,
  bindings: ShortcutBindings,
  isEnabled: (command: ShortcutCommand) => boolean,
): boolean =>
  COMMANDS.some(
    (command) =>
      isEnabled(command) &&
      bindings[command].some((hotkey) =>
        matchesKeyboardEvent(event, parseHotkey(hotkey as HotkeyChord)),
      ),
  );

/**
 * Registers the shortcuts in `bindings` on `target`, the editor's hidden
 * input, so they only fire while it has focus. Each one calls `run` with its
 * command. A command that `isEnabled` rejects lets its key through, e.g. so
 * `Tab` moves focus when there's no sub-formula to leave.
 */
export const useShortcuts = (
  target: RefObject<HTMLElement | null>,
  bindings: ShortcutBindings,
  isEnabled: (command: ShortcutCommand) => boolean,
  run: (command: ShortcutCommand) => void,
): void => {
  const definitions: UseHotkeyDefinition[] = [];
  for (const command of COMMANDS) {
    const enabled = isEnabled(command);
    for (const hotkey of bindings[command]) {
      definitions.push({
        hotkey: hotkey as Hotkey,
        callback: () => run(command),
        options: { enabled, meta: { name: DESCRIPTIONS[command] } },
      });
    }
  }
  useHotkeys(definitions, {
    target,
    // The target is the input itself, which uses typing keys, so don't skip
    // them the way TanStack Hotkeys does for inputs inside a target.
    ignoreInputs: false,
    preventDefault: true,
    stopPropagation: true,
    // Two editors on a page each register the same hotkeys on their own input.
    conflictBehavior: 'allow',
  });
};
