---
'@math-blocks/react': patch
---

`MathEditor` has keyboard shortcuts: `Home` / `End` move to the start or end of the current part of the formula (numerator, exponent, …), `Mod+Home` / `Mod+End` to the start or end of the whole formula, `Tab` / `Shift+Tab` move out of the current part (only when the cursor is in one), `Shift` with the arrows, `Home` and `End` extends the selection, `Mod+A` selects all, and `Mod+Z` / `Mod+Shift+Z` / `Mod+Y` undo and redo. `Mod` is Cmd on macOS and Ctrl elsewhere. They only fire while the editor has focus.

- New `shortcuts` prop on `MathEditor`: `false` turns them off, and an object rebinds commands or turns them off with `null`.
- New `getShortcuts(shortcuts?, {platform?})` lists the active shortcuts, with descriptions and labels formatted for the platform, for a help screen. `DEFAULT_SHORTCUTS` and the `Shortcut`, `ShortcutBindings`, `ShortcutCommand`, `ShortcutPlatform` and `ShortcutsConfig` types are exported too.
- Fix: a character typed with Ctrl (but not AltGr) or Cmd held, such as Ctrl+C, no longer inserts the character.
