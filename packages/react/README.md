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
can't read. So next to the SVG it renders the same math as Presentation
MathML, hidden visually but not from assistive technology, and marks the SVG
`aria-hidden` so the math is read once:

```tsx
<MathRenderer row={row} />
// <svg aria-hidden="true" ...>...</svg>
// <span style="position: absolute; width: 1px; height: 1px; ...">
//   <math display="block"><mrow><mfrac>...</mfrac></mrow></math>
// </span>
```

The MathML is built from `row`, the same tree that's drawn, so it works for
incomplete input such as an empty fraction slot.

Screen readers with MathML support read the math, let users move through its
parts (a fraction's numerator, an exponent, ...), and can show it in braille:
VoiceOver with Safari, NVDA with MathCAT, and JAWS. Support is weaker
elsewhere, notably TalkBack on Android. An `aria-label` mode for those
cases is planned in
[#878](https://github.com/math-blocks/math-blocks/issues/878).

Pass `aria-hidden` when the math is decorative, or when the page provides
its own accessible alternative. The SVG stays hidden and the MathML is left
out.

The `<math>` element follows the SVG in the DOM, so `MathRenderer` renders two
elements: the SVG (which a forwarded `ref` points at) and the visually hidden
`<span>`. The `<span>` is absolutely positioned, so it takes up no space.

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
