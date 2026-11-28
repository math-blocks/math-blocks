---
'@math-blocks/editor': patch
---

New reducer actions for keyboard shortcuts and other ways to drive the editor, such as an on-screen keypad:

- `MoveToStart` and `MoveToEnd` move the cursor to the start or end of the row it's in (`scope: 'row'`), such as a numerator or an exponent, or of the whole formula (`scope: 'formula'`).
- `MoveByRow` moves by row, the way moving by word works in a text field: to the start (`direction: 'backward'`) or end (`'forward'`) of the current row or, when the cursor is already there, into the previous or next row and to its start or end. Pressed repeatedly, it visits each row in turn.
- `ExitRow` moves the cursor out of the row it's in, to just after (`direction: 'forward'`) or just before (`direction: 'backward'`) the node that contains it. In the top-level row it returns the same state.
- `SelectAll` selects the whole formula.
- `ArrowLeft`, `ArrowRight`, `MoveToStart`, `MoveToEnd` and `MoveByRow` take an optional `extend: true`, which moves the selection's focus and keeps its anchor without having to send `StartSelecting` first.

New `HistoryUtils` (`create`, `push`, `undo`, `redo`, `canUndo`, `canRedo`) and `History` type for keeping an undo history of editor states. Cursor and selection changes update the present state instead of adding an undo step, so undo restores the cursor to where it was before the edit. The `MoveScope` type is exported too.
