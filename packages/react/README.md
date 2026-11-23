# @math-blocks/react

A set of React components for rendering and editing math expressions.

## MathRenderer

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
