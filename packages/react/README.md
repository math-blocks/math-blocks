# @math-blocks/react

A set of React components for rendering and editing math expressions.

## Styles

`MathEditor` and `MathKeypad` are styled by a stylesheet that ships with the
package. The components don't load it themselves, so import it once in your
app, for example next to where you render them:

```js
import '@math-blocks/react/index.css';
```

Without it, the editor has no border or focus outline and the keypad isn't laid
out as a grid. `MathRenderer` doesn't need the stylesheet.

The class names in the stylesheet are generated and can change between
releases, so don't target them from your own CSS. To restyle `MathEditor`, pass
it a `className` or `style` prop.

## MathRenderer

### Accessibility

`MathRenderer` draws math as an SVG of glyph outlines, which screen readers
can't read on their own. So the SVG is exposed as a single image
(`role="img"`) whose `aria-label` describes the math in words, and everything
drawn inside it is `aria-hidden`:

```tsx
<MathRenderer row={row} />
// <svg role="img" aria-label="the fraction x plus 1 over 2, end fraction" ...>
```

The description is generated from `row` by `getSpokenText`, which you can also
call yourself. It uses short forms for simple parts ("x squared", "1 over 2",
"the square root of 2") and marks where compound ones end (", end fraction",
", end root"). It's English only.

- Pass `aria-label` to use your own wording, for example in another language.
- Pass `aria-hidden` when the math is decorative, or when the page already
  provides an accessible alternative such as MathML, so that it isn't read
  twice.

A label is read as one phrase: screen reader users can't move through the
parts of an expression the way they can with MathML.

## MathEditor

TODO:
- Selection
- Click to position cursor

## GlyphDefsProvider

Wrap a page with lots of math on it in a `GlyphDefsProvider`. Every
`MathRenderer` and `MathEditor` inside it then shares one hidden `<svg>` that
holds the outline of each glyph once, instead of each SVG storing its own copy.

```tsx
<FontDataContext.Provider value={fontData}>
  <GlyphDefsProvider>
    <App />
  </GlyphDefsProvider>
</FontDataContext.Provider>
```

Without a provider, and when rendering on the server, each SVG keeps its own
`<defs>`, so it works on its own. The hidden `<svg>` must be in the same
document tree as the renderers: IDs don't resolve across a shadow root.

An SVG rendered under the provider contains only `<use>` references, so to
copy, download or draw one as an image, pass it to `getStandaloneSvg`. It
returns a copy with the definitions that SVG uses inlined:

```tsx
const svg = getStandaloneSvg(svgRef.current);
const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  svg.outerHTML,
)}`;
```

## MathKeypad

TODO:
- Touch support
- Extract library for simulating KeyboardEvents
