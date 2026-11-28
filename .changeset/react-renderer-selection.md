---
'@math-blocks/react': patch
---

Users can select math in a `MathRenderer` by dragging across it. The selection follows the math's structure, as in `MathEditor`, and is highlighted the same way. A new `selectable` prop (default `true`) turns this off for math that's decorative or part of a control. A `selection` passed as a prop is drawn in place of the user's.
