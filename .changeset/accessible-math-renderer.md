---
'@math-blocks/react': minor
---

`MathRenderer` is now readable by screen readers. Next to its SVG it renders the math as Presentation MathML, visually hidden, and marks the SVG `aria-hidden` so the math isn't read twice. Screen readers that support MathML (VoiceOver with Safari, NVDA with MathCAT, JAWS) can move through the parts of an expression and show it in braille. Pass the new `aria-hidden` prop to leave the MathML out, for decorative math or when the page provides its own alternative.

Breaking: `MathRenderer` now renders two elements instead of one, the `<svg>` followed by a visually hidden `<span>` that holds the `<math>`. The `<span>` is absolutely positioned and takes up no space, and a forwarded `ref` still points at the `<svg>`. But code that expects `MathRenderer`'s output to be a single element, such as `container.firstChild` in tests or CSS sibling selectors like `:last-child`, may need updating. The `<svg>` also gains `aria-hidden="true"`.
