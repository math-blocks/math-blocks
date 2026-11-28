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
//   <math display="block"><mfrac>...</mfrac></math>
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

### Keyboard shortcuts

`MathEditor` has these keyboard shortcuts. `Mod` is Cmd on macOS and Ctrl
elsewhere.

| Action | Shortcut |
| --- | --- |
| Start / end of the current part of the formula (numerator, exponent, root, …) | `Home` / `End` |
| Start / end of the whole formula | `Mod+Home` / `Mod+End` |
| Move out of the current part, forward / backward | `Tab` / `Shift+Tab` |
| Extend the selection left / right | `Shift+ArrowLeft` / `Shift+ArrowRight` |
| Select to the start / end of the current part | `Shift+Home` / `Shift+End` |
| Select to the start / end of the whole formula | `Mod+Shift+Home` / `Mod+Shift+End` |
| Select all | `Mod+A` |
| Undo / redo | `Mod+Z` / `Mod+Shift+Z` or `Mod+Y` |

They only fire while the editor has focus, so they don't clash with the page's
own shortcuts. `Tab` and `Shift+Tab` only apply while the cursor is inside a
part of the formula, so otherwise they move focus out of the editor as usual.
A read-only editor has no shortcuts.

Undo and redo step through changes to the math. Moving the cursor isn't a
step, and undo puts the cursor back where it was before the change. Passing a
new `row` starts a new history.

#### Changing them

Pass `shortcuts={false}` to turn them all off. To rebind or turn off some of
them, pass an object keyed by command. A value is a hotkey, a list of hotkeys,
or `null` to turn that shortcut off. Commands you leave out keep their
defaults.

```tsx
<MathEditor
  row={row}
  readonly={false}
  shortcuts={{
    redo: ['Mod+Shift+Z'], // drop Mod+Y
    selectAll: null, // turn Select All off
    // Add Emacs-style Ctrl+A. Only do this on macOS, where Mod+A is Cmd+A.
    moveToRowStart: ['Home', 'Control+A'],
  }}
/>
```

The commands are `moveToRowStart`, `moveToRowEnd`, `moveToFormulaStart`,
`moveToFormulaEnd`, `exitRowForward`, `exitRowBackward`, `extendLeft`,
`extendRight`, `extendToRowStart`, `extendToRowEnd`, `extendToFormulaStart`,
`extendToFormulaEnd`, `selectAll`, `undo` and `redo`. `DEFAULT_SHORTCUTS` has
the default hotkeys for each.

A hotkey is modifiers and a key joined by `+`, such as `Mod+Shift+Z`. The
modifiers are `Mod`, `Control`, `Alt`, `Shift` and `Meta`, and the key is a
character or a `KeyboardEvent.key` name such as `Home` or `ArrowLeft`.

#### Listing them

`getShortcuts` lists the active shortcuts for a help screen or cheatsheet.
Pass it the same value as the `shortcuts` prop:

```tsx
const shortcuts = getShortcuts(myShortcuts);
// [{command: 'undo', description: 'Undo', hotkeys: ['Mod+Z'], labels: ['⌘ Z']}, ...]
```

`labels` are formatted for the user's platform. Pass `{platform: 'mac'}` (or
`'windows'` or `'linux'`) as the second argument to pick one, for example when
rendering on the server.

The shortcuts are built on [TanStack Hotkeys](https://tanstack.com/hotkeys),
but none of its types are part of this package's API.

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
