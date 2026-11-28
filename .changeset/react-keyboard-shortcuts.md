---
'@math-blocks/react': patch
---

`MathEditor` has keyboard shortcuts that follow the platform's own text fields, with a part of the formula (numerator, exponent, …) working like a word and the whole formula like the line. They only fire while the editor has focus.

- macOS: `Option+←/→` move to the start or end of the current part, and keep going into the previous or next part when pressed again, like moving by word, `Cmd+←/→`, `Cmd+↑/↓` and `Ctrl+A/E` to the start or end of the whole formula, and `Shift` with these extends the selection. `Cmd+A` selects all, and `Cmd+Z` / `Cmd+Shift+Z` undo and redo. `Home` and `End` do nothing, as in a macOS text field.
- Windows and Linux: `Home` / `End` move to the start or end of the current part, `Ctrl+←/→` do too and keep going into the previous or next part, like moving by word, `Ctrl+Home` / `Ctrl+End` to the start or end of the whole formula, and `Shift` with these extends the selection. `Ctrl+A` selects all, and `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` undo and redo.
- Everywhere: `Shift+←/→` extend the selection, and `Tab` / `Shift+Tab` move out of the current part (only when the cursor is in one).
- New `shortcuts` prop on `MathEditor`: `false` turns them off, and an object rebinds commands or turns them off with `null`.
- New `getShortcuts(shortcuts?, {platform?})` lists the active shortcuts, with descriptions and labels formatted for the platform, for a help screen. `getDefaultShortcuts(platform?)` and the `Shortcut`, `ShortcutBindings`, `ShortcutCommand`, `ShortcutPlatform` and `ShortcutsConfig` types are exported too.
- Fix: a character typed with Ctrl (but not AltGr) or Cmd held, such as Ctrl+C, no longer inserts the character, and an arrow key with Alt, Ctrl or Cmd held no longer moves the cursor one step unless it's a shortcut. So `Alt+←` on Windows is left to the browser.
