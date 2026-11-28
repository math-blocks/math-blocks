/**
 * @vitest-environment jsdom
 */
// Keyboard shortcuts in MathEditor. See
// https://github.com/math-blocks/math-blocks/issues/61.
import fs from 'fs';
import path from 'path';
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
// In the jsdom environment, Vitest resolves 'buffer' to the npm polyfill, which
// has no Blob, so ask for Node's module.
import { Blob } from 'node:buffer';

import * as Editor from '@math-blocks/editor';
import { getFontData, parse } from '@math-blocks/opentype';
import type { FontData } from '@math-blocks/opentype';

import MathEditor from '../math-editor';
import { FontDataContext } from '../font-data-context';
import { getDefaultShortcuts, getShortcuts } from '../shortcuts';
import type { Shortcut, ShortcutsConfig } from '../shortcuts';

const { row, char, frac } = Editor.builders;
const { makeSelection, makeSelection2 } = Editor.SelectionUtils;

const ASSETS = path.join(__dirname, '../../../../assets');

let fontData: FontData;

beforeAll(async () => {
  const font = await parse(
    new Blob([fs.readFileSync(path.join(ASSETS, 'STIX2Math.otf'))]),
  );
  fontData = getFontData(font, 'STIX2');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// a + 1 2 / 3 + b: the fraction is at index 1, its numerator is [1, 0] and its
// denominator is [1, 1].
const math = row([
  char('a'),
  frac([char('1'), char('2')], [char('3')]),
  char('b'),
]);

type Setup = {
  readonly input: HTMLInputElement;
  readonly onChange: ReturnType<typeof vi.fn>;
  // The state from the latest onChange call.
  readonly latest: () => Editor.State;
  // Sends a keydown, and the matching keyup, to the focused element. Returns
  // false if a handler called preventDefault().
  readonly press: (key: string, modifiers?: KeyModifiers) => boolean;
  readonly unmount: () => void;
};

type KeyModifiers = {
  readonly shiftKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly altKey?: boolean;
};

const setup = (
  props: {
    readonly row?: Editor.types.CharRow;
    readonly shortcuts?: ShortcutsConfig;
    readonly readonly?: boolean;
  } = {},
): Setup => {
  const onChange = vi.fn();
  const { container, unmount } = render(
    <FontDataContext.Provider value={fontData}>
      <MathEditor
        row={props.row ?? math}
        readonly={props.readonly ?? false}
        shortcuts={props.shortcuts}
        onChange={onChange}
      />
    </FontDataContext.Provider>,
  );
  const input = container.querySelector('input');
  if (!input) {
    throw new Error('No <input>');
  }
  act(() => input.focus());

  const press = (key: string, modifiers: KeyModifiers = {}): boolean => {
    const target = document.activeElement ?? document.body;
    let notPrevented = true;
    act(() => {
      notPrevented = fireEvent.keyDown(target, { key, ...modifiers });
      fireEvent.keyUp(target, { key, ...modifiers });
    });
    return notPrevented;
  };

  const latest = (): Editor.State => {
    const calls = onChange.mock.calls;
    if (calls.length === 0) {
      throw new Error('onChange was never called');
    }
    return calls[calls.length - 1][0] as Editor.State;
  };

  return { input, onChange, latest, press, unmount };
};

// The text of the top-level row, with '?' for each node that isn't a char.
const text = (state: Editor.State): string =>
  state.row.children
    .map((node) => (node.type === 'char' ? node.value : '?'))
    .join('');

const mockPlatform = (platform: 'MacIntel' | 'Win32'): void => {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
};

// Puts the cursor between the '1' and the '2' in the numerator.
const moveIntoNumerator = (press: Setup['press']): void => {
  press('ArrowRight');
  press('ArrowRight');
  press('ArrowRight');
};

describe('MathEditor shortcuts', () => {
  describe('moving', () => {
    test('Home and End move to the start and end of the sub-formula', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);
      expect(latest().selection).toEqual(makeSelection([1, 0], 1));

      expect(press('End')).toBe(false);
      expect(latest().selection).toEqual(makeSelection([1, 0], 2));

      expect(press('Home')).toBe(false);
      expect(latest().selection).toEqual(makeSelection([1, 0], 0));
    });

    test('Mod+Home and Mod+End move to the start and end of the formula', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      expect(press('End', { ctrlKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 3));

      expect(press('Home', { ctrlKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 0));
    });

    test('Tab and Shift+Tab move out of the sub-formula', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      expect(press('Tab')).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 2));

      press('Home', { ctrlKey: true });
      moveIntoNumerator(press);
      expect(press('Tab', { shiftKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 1));
    });

    test('Tab is left alone outside a sub-formula, so focus can leave', () => {
      const { press, onChange } = setup();
      press('ArrowRight');
      onChange.mockClear();

      expect(press('Tab')).toBe(true);
      expect(press('Tab', { shiftKey: true })).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('selecting', () => {
    test('Shift+ArrowRight and Shift+ArrowLeft extend the selection', () => {
      const { press, latest } = setup();
      expect(press('ArrowRight', { shiftKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection2([], 0, [], 1));
      // Over the fraction, not into it.
      press('ArrowRight', { shiftKey: true });
      expect(latest().selection).toEqual(makeSelection2([], 0, [], 2));
      press('ArrowLeft', { shiftKey: true });
      expect(latest().selection).toEqual(makeSelection2([], 0, [], 1));
    });

    test('Shift+Home and Shift+End select to the start and end of the sub-formula', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      expect(press('End', { shiftKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection2([1, 0], 1, [1, 0], 2));

      expect(press('Home', { shiftKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection2([1, 0], 1, [1, 0], 0));
    });

    test('Mod+Shift+End selects to the end of the formula', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      expect(press('End', { ctrlKey: true, shiftKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection2([1, 0], 1, [], 3));
    });

    test('Mod+A selects everything', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      expect(press('a', { ctrlKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection2([], 0, [], 3));
      expect(latest().row).toBe(math);
    });
  });

  describe('undo and redo', () => {
    const empty = row([]);

    test('Mod+Z undoes and Mod+Shift+Z redoes', () => {
      const { press, latest } = setup({ row: empty });
      press('x');
      press('y');
      expect(text(latest())).toBe('xy');

      expect(press('z', { ctrlKey: true })).toBe(false);
      expect(text(latest())).toBe('x');
      expect(latest().selection).toEqual(makeSelection([], 1));

      press('z', { ctrlKey: true });
      expect(text(latest())).toBe('');

      expect(press('Z', { ctrlKey: true, shiftKey: true })).toBe(false);
      expect(text(latest())).toBe('x');
    });

    test('Mod+Y redoes', () => {
      const { press, latest } = setup({ row: empty });
      press('x');
      press('z', { ctrlKey: true });
      expect(text(latest())).toBe('');

      expect(press('y', { ctrlKey: true })).toBe(false);
      expect(text(latest())).toBe('x');
    });

    test('undo puts the cursor back where it was before the edit', () => {
      const { press, latest } = setup({ row: empty });
      press('x');
      press('y');
      press('Home');
      press('a');
      expect(text(latest())).toBe('axy');

      press('z', { ctrlKey: true });
      expect(text(latest())).toBe('xy');
      expect(latest().selection).toEqual(makeSelection([], 0));
    });

    test('undo with nothing to undo does nothing', () => {
      const { press, onChange } = setup({ row: empty });
      press('z', { ctrlKey: true });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('focus', () => {
    test('shortcuts do nothing when the editor is not focused', () => {
      const { press, onChange, input } = setup();
      const other = document.createElement('input');
      document.body.appendChild(other);
      try {
        act(() => other.focus());
        expect(document.activeElement).not.toBe(input);

        for (const [key, modifiers] of [
          ['Home', {}],
          ['End', { ctrlKey: true }],
          ['a', { ctrlKey: true }],
          ['z', { ctrlKey: true }],
          ['ArrowRight', { shiftKey: true }],
        ] as const) {
          // Not prevented, so the other input gets its usual behaviour.
          expect(press(key, modifiers)).toBe(true);
        }
        expect(onChange).not.toHaveBeenCalled();
      } finally {
        other.remove();
      }
    });

    test('shortcuts stop when the editor loses focus', () => {
      const { press, onChange, input } = setup();
      act(() => input.blur());
      expect(press('End')).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    });

    test("one editor's shortcuts don't affect another editor", () => {
      const first = setup();
      const second = setup();
      act(() => first.input.focus());
      first.press('End');
      expect(first.latest().selection).toEqual(makeSelection([], 3));
      expect(second.onChange).not.toHaveBeenCalled();
    });

    test('a read-only editor has no shortcuts', () => {
      const { press, onChange } = setup({ readonly: true });
      expect(press('End')).toBe(true);
      expect(press('a', { ctrlKey: true })).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('on Windows and Linux', () => {
    test('Ctrl is the modifier, and Cmd (the Windows key) does nothing', () => {
      mockPlatform('Win32');
      const { press, latest, onChange } = setup({ row: row([]) });
      press('x');

      // Neither undoes nor types a 'z'.
      onChange.mockClear();
      press('z', { metaKey: true });
      expect(onChange).not.toHaveBeenCalled();

      press('z', { ctrlKey: true });
      expect(text(latest())).toBe('');
    });

    test('Ctrl+Left and Ctrl+Right move to the ends of the sub-formula, like moving by a word', () => {
      mockPlatform('Win32');
      const { press, latest } = setup();
      moveIntoNumerator(press);

      expect(press('ArrowRight', { ctrlKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([1, 0], 2));
      expect(press('ArrowLeft', { ctrlKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([1, 0], 0));

      press('ArrowRight', { ctrlKey: true, shiftKey: true });
      expect(latest().selection).toEqual(makeSelection2([1, 0], 0, [1, 0], 2));
    });

    test('Alt+Left and Alt+Right do nothing, so the browser can use them', () => {
      mockPlatform('Win32');
      const { press, onChange } = setup();
      moveIntoNumerator(press);
      onChange.mockClear();

      expect(press('ArrowLeft', { altKey: true })).toBe(true);
      expect(press('ArrowRight', { altKey: true })).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    });

    test('Ctrl+Left keeps going into the previous part, and Home stops', () => {
      mockPlatform('Win32');
      const { press, latest } = setup();
      moveIntoNumerator(press);
      press('ArrowDown'); // into the denominator

      press('Home');
      press('Home');
      expect(latest().selection).toEqual(makeSelection([1, 1], 0));

      press('ArrowLeft', { ctrlKey: true });
      expect(latest().selection).toEqual(makeSelection([1, 0], 0));
      press('ArrowLeft', { ctrlKey: true });
      expect(latest().selection).toEqual(makeSelection([], 0));
    });
  });

  describe('on macOS', () => {
    beforeEach(() => mockPlatform('MacIntel'));

    test('Cmd is the modifier, and Ctrl+Z does nothing', () => {
      const { press, latest, onChange } = setup({ row: row([]) });
      press('x');

      // Neither undoes nor types a 'z'.
      onChange.mockClear();
      press('z', { ctrlKey: true });
      expect(onChange).not.toHaveBeenCalled();

      press('z', { metaKey: true });
      expect(text(latest())).toBe('');
      press('z', { metaKey: true, shiftKey: true });
      expect(text(latest())).toBe('x');
    });

    test('Cmd+Y does nothing, since it is not redo on macOS', () => {
      const { press, onChange } = setup({ row: row([]) });
      press('x');
      press('z', { metaKey: true });
      onChange.mockClear();
      expect(press('y', { metaKey: true })).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    });

    test('Cmd+Left and Cmd+Right move to the start and end of the formula', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      expect(press('ArrowRight', { metaKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 3));
      expect(press('ArrowLeft', { metaKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 0));
    });

    test('Cmd+Up and Cmd+Down move to the start and end of the formula', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      expect(press('ArrowDown', { metaKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 3));
      expect(press('ArrowUp', { metaKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 0));
    });

    test('Ctrl+A and Ctrl+E move to the start and end of the formula', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      expect(press('e', { ctrlKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 3));
      expect(press('a', { ctrlKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 0));
    });

    test('Cmd+A selects everything', () => {
      const { press, latest } = setup();
      expect(press('a', { metaKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection2([], 0, [], 3));
    });

    test('Option+Left and Option+Right move to the start and end of the sub-formula', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      expect(press('ArrowRight', { altKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([1, 0], 2));
      expect(press('ArrowLeft', { altKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([1, 0], 0));
    });

    test('Option+Left keeps going into the previous part', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);
      press('ArrowDown'); // to the end of the one-char denominator
      expect(latest().selection).toEqual(makeSelection([1, 1], 1));

      press('ArrowLeft', { altKey: true });
      expect(latest().selection).toEqual(makeSelection([1, 1], 0));
      // From the start of the denominator to the start of the numerator.
      press('ArrowLeft', { altKey: true });
      expect(latest().selection).toEqual(makeSelection([1, 0], 0));
      // Out of the fraction to the start of the formula.
      press('ArrowLeft', { altKey: true });
      expect(latest().selection).toEqual(makeSelection([], 0));
    });

    test('Option+Right keeps going into the next part', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      press('ArrowRight', { altKey: true });
      expect(latest().selection).toEqual(makeSelection([1, 0], 2));
      // From the end of the numerator to the end of the denominator.
      press('ArrowRight', { altKey: true });
      expect(latest().selection).toEqual(makeSelection([1, 1], 1));
      // Out of the fraction to the end of the formula.
      press('ArrowRight', { altKey: true });
      expect(latest().selection).toEqual(makeSelection([], 3));
    });

    test('Shift extends the selection with Option and Cmd arrows', () => {
      const { press, latest } = setup();
      moveIntoNumerator(press);

      press('ArrowRight', { altKey: true, shiftKey: true });
      expect(latest().selection).toEqual(makeSelection2([1, 0], 1, [1, 0], 2));

      press('ArrowLeft', { altKey: true, shiftKey: true });
      expect(latest().selection).toEqual(makeSelection2([1, 0], 1, [1, 0], 0));

      press('ArrowRight', { metaKey: true, shiftKey: true });
      expect(latest().selection).toEqual(makeSelection2([1, 0], 1, [], 3));

      press('ArrowUp', { metaKey: true, shiftKey: true });
      expect(latest().selection).toEqual(makeSelection2([1, 0], 1, [], 0));
    });

    test('Home, End and Ctrl+Home/End do nothing, as in a macOS text field', () => {
      const { press, onChange } = setup();
      moveIntoNumerator(press);
      onChange.mockClear();

      expect(press('Home')).toBe(true);
      expect(press('End')).toBe(true);
      expect(press('Home', { ctrlKey: true })).toBe(true);
      expect(press('End', { ctrlKey: true })).toBe(true);
      expect(press('Home', { shiftKey: true })).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('configuring', () => {
    test('shortcuts={false} turns them all off', () => {
      const { press, onChange } = setup({ shortcuts: false });
      expect(press('End')).toBe(true);
      expect(press('a', { ctrlKey: true })).toBe(true);
      // Typing still works, and Ctrl+A doesn't type an 'a'.
      expect(onChange).not.toHaveBeenCalled();
      press('ArrowRight');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    test('null turns one shortcut off and keeps the others', () => {
      const { press, onChange, latest } = setup({
        shortcuts: { selectAll: null },
      });
      expect(press('a', { ctrlKey: true })).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
      press('End');
      expect(latest().selection).toEqual(makeSelection([], 3));
    });

    test('a shortcut can be rebound', () => {
      const { press, onChange, latest } = setup({
        shortcuts: { moveToRowEnd: 'Mod+E', selectAll: ['Mod+L'] },
      });
      expect(press('End')).toBe(true);
      expect(onChange).not.toHaveBeenCalled();

      expect(press('e', { ctrlKey: true })).toBe(false);
      expect(latest().selection).toEqual(makeSelection([], 3));

      press('l', { ctrlKey: true });
      expect(latest().selection).toEqual(makeSelection2([], 0, [], 3));
    });

    test('a rebound key is free for typing', () => {
      // With Home rebound, Home does nothing, and Ctrl+Home is free too.
      const { press, onChange } = setup({
        shortcuts: { moveToRowStart: 'Mod+J', moveToFormulaStart: [] },
      });
      press('ArrowRight');
      onChange.mockClear();
      expect(press('Home')).toBe(true);
      expect(press('Home', { ctrlKey: true })).toBe(true);
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

describe('getShortcuts', () => {
  test('lists the default shortcuts with descriptions', () => {
    const shortcuts = getShortcuts(undefined, { platform: 'windows' });
    expect(shortcuts.map((s) => s.command)).toEqual(
      Object.keys(getDefaultShortcuts('windows')),
    );
    const undo = shortcuts.find((s) => s.command === 'undo');
    expect(undo).toEqual({
      command: 'undo',
      description: 'Undo',
      hotkeys: ['Control+Z'],
      labels: ['Ctrl+Z'],
    });
    const redo = shortcuts.find((s) => s.command === 'redo');
    expect(redo?.hotkeys).toEqual(['Control+Shift+Z', 'Control+Y']);
  });

  test('lists the macOS defaults with macOS labels', () => {
    const shortcuts = getShortcuts(undefined, { platform: 'mac' });
    const find = (command: string): Shortcut | undefined =>
      shortcuts.find((s) => s.command === command);
    expect(find('undo')?.labels).toEqual(['⌘ Z']);
    expect(find('redo')?.hotkeys).toEqual(['Meta+Shift+Z']);
    expect(find('moveByRowBackward')?.hotkeys).toEqual(['Alt+ArrowLeft']);
    // Home and End aren't bound on macOS, so these aren't listed.
    expect(find('moveToRowStart')).toBeUndefined();
    expect(find('moveToFormulaEnd')?.hotkeys).toEqual([
      'Meta+ArrowRight',
      'Meta+ArrowDown',
      'Control+E',
    ]);
  });

  test('getDefaultShortcuts differs by platform', () => {
    expect(getDefaultShortcuts('linux')).toBe(getDefaultShortcuts('windows'));
    expect(getDefaultShortcuts('mac').moveByRowBackward).toEqual([
      'Alt+ArrowLeft',
    ]);
    expect(getDefaultShortcuts('windows').moveByRowBackward).toEqual([
      'Control+ArrowLeft',
    ]);
    expect(getDefaultShortcuts('windows').moveToRowStart).toEqual(['Home']);
    // Alt+Left is the browser's Back on Windows and Linux, so it isn't bound.
    for (const platform of ['windows', 'linux'] as const) {
      const hotkeys = Object.values(getDefaultShortcuts(platform)).flat();
      expect(hotkeys.filter((hotkey) => hotkey.startsWith('Alt+'))).toEqual([]);
    }
  });

  test('Mod in a rebound shortcut is Cmd on macOS and Ctrl elsewhere', () => {
    const config = { undo: 'Mod+U' };
    const label = (
      platform: 'mac' | 'windows',
    ): readonly string[] | undefined =>
      getShortcuts(config, { platform }).find((s) => s.command === 'undo')
        ?.labels;
    expect(label('mac')).toEqual(['⌘ U']);
    expect(label('windows')).toEqual(['Ctrl+U']);
  });

  test('leaves out shortcuts that are turned off and shows rebound ones', () => {
    const shortcuts = getShortcuts(
      { selectAll: null, redo: [], undo: 'Alt+Backspace' },
      { platform: 'linux' },
    );
    const commands = shortcuts.map((s) => s.command);
    expect(commands).not.toContain('selectAll');
    expect(commands).not.toContain('redo');
    expect(shortcuts.find((s) => s.command === 'undo')?.hotkeys).toEqual([
      'Alt+Backspace',
    ]);
  });

  test('is empty when shortcuts are off', () => {
    expect(getShortcuts(false)).toEqual([]);
  });
});
