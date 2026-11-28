---
'@math-blocks/editor': patch
---

New reducer actions for keyboard shortcuts and other ways to drive the editor, such as an on-screen keypad:

- `MoveToStart` and `MoveToEnd` move the cursor to the start or end of the row it's in (`scope: 'row'`), such as a numerator or an exponent, or of the whole formula (`scope: 'formula'`).
- `ExitRow` moves the cursor out of the row it's in, to just after (`direction: 'forward'`) or just before (`direction: 'backward'`) the node that contains it. In the top-level row it returns the same state.
- `SelectAll` selects the whole formula.
- `ArrowLeft`, `ArrowRight`, `MoveToStart` and `MoveToEnd` take an optional `extend: true`, which moves the selection's focus and keeps its anchor without having to send `StartSelecting` first.

New `HistoryUtils` (`create`, `push`, `undo`, `redo`, `canUndo`, `canRedo`) and `History` type for keeping an undo history of editor states. Cursor and selection changes update the present state instead of adding an undo step, so undo restores the cursor to where it was before the edit. The `MoveScope` type is exported too.
