# 06 Accessibility (investigation)

Status: investigation / proposal, November 2026. Nothing here is implemented yet.

This doc answers: how much work would it be to make `MathEditor` and
`MathRenderer` accessible to screen reader, braille, keyboard-only, and
low-vision users? It's based on:

1. an audit of `@math-blocks/react`, `@math-blocks/editor`, and
   `@math-blocks/typesetter`
2. a read of the accessibility layer in MathQuill (the editor Desmos is built
   on — Desmos's own app is closed source, but its a11y work lives in
   `desmosinc/mathquill`, mainly `src/services/aria.ts`, `keystroke.ts`,
   `textarea.ts`, and the `mathspeak()` methods in `src/commands/math/*.ts`)
3. a literature / state-of-the-art survey (references at the bottom)

## TL;DR

| Phase | What | Rough effort |
| --- | --- | --- |
| 0 | Keyboard/focus fixes, labels, keypad buttons, focus ring, forced colors, `aria-label` fallback on static SVG | 1–3 days |
| 1 | Static math: hidden MathML (with `intent`) next to the `aria-hidden` SVG | 1–2 weeks |
| 2 | Editor: MathSpeak-style speech + live-region announcements for every edit/move | 2–4 weeks |
| 3 | Optional: verbosity/ClearSpeak settings, explorer for static math, braille output via SRE | 2–4 weeks |
| 4 | Optional: braille *input* (Nemeth/UEB, six-key) à la Desmos | months |

Phases 0–2 (~1–1.5 months for one person) gets math-blocks to roughly
MathQuill/Desmos parity for screen reader users. The architecture helps a lot:
the editor reducer is pure, so announcements can be computed as a pure function
of `(prevState, action, nextState)` and golden-tested without a browser.

## Current state (audit)

### `MathRenderer` / `SceneRenderer` (static)

- Glyph `<path>`s are `aria-hidden="true"` (`packages/react/src/scene-renderer.tsx`),
  but the `<svg>` itself has no role, `<title>`, or `aria-label`. Screen readers
  announce nothing, or "image" — the math is invisible to AT (fails WCAG 1.1.1, 1.3.1).
- Glyphs and rules draw with `currentColor` and the selection uses the system
  `Highlight` color (`typesetter/src/scene-graph.ts`) — good for forced-colors
  / high-contrast mode already.
- Sizing is in px (`fontSize` default 64) rather than following the user's font size.

### `MathEditor`

- Two tab stops: the `role="textbox"` `<div tabIndex=0>` and a hidden
  `<input>` inside it. Focusing the div (what Tab does first) doesn't set
  `active`, so typing does nothing until the user tabs a second time onto an
  invisible input. (fails 2.1.1 in practice)
- The `<input>` has no label, and the textbox has no accessible name or value
  (fails 4.1.2). Nothing is ever announced on edits or cursor moves (fails 4.1.3).
- `keydown`/`keyup`, `editing` and `formatting` listeners are on `window`,
  gated by `active`. That works for one editor but doesn't scale to several, and
  it eats keys screen readers might want.
- `outline: none` with focus shown only by a 1px border colour change — weak
  focus indicator (2.4.7 / 2.4.11; check 3:1 contrast).
- Leftover `console.log`s in `keydownToAction` and `onMouseUp`.

### `MathKeypad`

- Buttons are `<div onClick>` — not focusable, no role, no names (e.g. the
  `√` button should be named "square root"). Fails 2.1.1 / 4.1.2. Easy fix:
  `<button type="button" aria-label=…>`.

### Things we can build on

- `packages/react/src/mathml-renderer.tsx` — a Semantic → Presentation MathML
  printer. It's **not exported** from `@math-blocks/react` and handles ~10 of the
  ~63 semantic node types (Add, Mul, Neg, PlusMinus, Equals, Div, Power, Root,
  Number, Identifier).
- `demo/src/mathml/accessible-math.tsx` — a prototype overlaying transparent
  MathML on top of the SVG. Right idea, but scaling via `getBoundingClientRect`
  is fragile, and positioning only matters for screen-magnifier/touch
  exploration — a visually-hidden MathML sibling is enough for most AT.
- Semantic nodes carry `loc: {path, start, end}` pointing back into the editor
  tree. That makes it possible to map cursor position ↔ semantic node, and to
  highlight SVG boxes for a navigated semantic node (editor node `id`s flow
  into scene-graph `id`s).
- The editor tree has only 9 structural node types (`row`, `delimited`,
  `accent`, `macro`, `table`, `subsup`, `limits`, `frac`, `root`) plus chars,
  so a speech generator over it is small.

**Caveat:** `Editor.parse` throws on incomplete input (e.g. `2+`), which is the
editor's normal state mid-typing. Anything the editor speaks must work from the
**editor tree** and only *enrich* from the semantic tree when parsing succeeds.

## How MathQuill / Desmos does it

MathQuill's design is compact and maps cleanly onto ours:

- **Static math**: the rendered DOM is `aria-hidden`; a visually-hidden span
  holds the MathSpeak string (`mathspeak()` on the root) and labels the field.
- **Editable math**: a hidden `<textarea>` is the single focus target. Its
  `aria-labelledby` points at a span containing
  `<field label>: <mathspeak of whole expression> <ariaPostLabel>`, updated on
  every change and on focus/blur.
- **Announcements**: one `<span class="mq-aria-alert" aria-live="assertive"
  aria-atomic="true">` per field, prepended empty on attach (with a 50ms delay
  for the first message so AT registers the region). An `Aria` class queues
  fragments during a keystroke and flushes once at the end, only if the field
  has focus.
- **Speech generation**: every node has `mathspeak()`. Structures have
  `mathspeakTemplate`s, e.g. fraction `['StartFraction,', 'Over', ', EndFraction']`,
  and blocks have `ariaLabel`s like `numerator` / `denominator` /
  `lower bound`. Shorthand ("one half", "x squared") is used when reading a whole
  expression but suppressed during navigation to avoid ambiguity.
- **What's announced**:
  - moving: the char crossed, or `before`/`after` + structure, or
    `beginning of`/`end of` + block label (e.g. "beginning of denominator 2")
  - typing: the inserted item; for structures, how it was created
  - deleting: the item removed, or the template piece ("over") when
    backspacing out of a structure
  - selection: "`<mathspeak>` selected"
  - leaving the field: "end of Math Input: `<label>` …"
- **Screen-reader-only hotkeys**: Ctrl+Alt+Up (speak parent), Ctrl+Alt+Down
  (current block), Ctrl+Alt+Left/Right (siblings), Ctrl+Alt+Shift+Down
  (selection), Ctrl+Alt+= (`ariaPostLabel`, e.g. evaluation result or error).
- **API**: `setAriaLabel`, `setAriaPostLabel(text, timeout)`, `mathspeak()`.
- Desmos adds on top (confirmed in the Desmos API v1.12 docs):
  - **Braille mode:** `brailleMode: 'nemeth' | 'ueb'` sets input *and* output
    code, and `brailleControls` adds a settings menu entry plus shortcut keys to switch modes.
  - **Six-key entry:** `sixKeyInput` types six-dot braille with S D F J K L.
  - **Screen-reader positions:** `screenReaderPositions` sets how positions on the graph are reported.
  - **Audio trace** for graphs.
  - Desmos recommends letting users switch between braille and visual math with shortcuts.
- Desmos's **Abraham** library converts LaTeX ↔ Nemeth/UEB
  (`latexToNemeth`, `nemethToLatex`, `latexToUeb`, `uebToLatex`). In permissive mode
  it inserts missing fraction and radical delimiters, so it can translate while
  the user is still typing. It's available only by agreement with Desmos
  (partnerships@desmos.com). Since `@math-blocks/tex` already prints editor
  trees as LaTeX, Abraham would cover both braille output and braille input.

MathLive is similar: a `role=textbox` sink, an `aria-live` status span, and a
`relationName()` table for "numerator", "radicand", "start of fraction" etc.

Note: since MathJax 4, MathJax announces explorer moves by moving focus to a
freshly labelled node instead of using a live region, because assertive live
regions interrupted users. The editors above still use live regions; it works
well enough for editors because announcements follow the user's own keystrokes.

## State of the art (summary of the survey)

- **MathML Core** ships in all three engines (Chrome since 109). Chromium's
  MathML accessibility-tree mappings now match Gecko/WebKit on macOS and Linux.
  wpt.fyi stable runs (Nov 15–16 2026) for `/mathml/`, counting subtests:
  - Chrome 157: 97.7%
  - Firefox 160: 80.6%
  - Safari 27.2: 83.6%

  The `/mathml-aam/` accessibility-mapping tests:
  - Chrome: 62/64
  - Firefox: 64/64
  - Safari: not run

  Rendering differences don't matter much to us, since our MathML would be visually hidden.
- **Screen readers**: MathCAT (Neil Soiffer, now DAISY) is built into NVDA
  2026.1 and on by default in JAWS 2026. It gives ClearSpeak/SimpleSpeak
  speech (MathCAT ships no MathSpeak rules), Nemeth/UEB/etc. braille, and tree navigation from **real
  MathML** in the accessibility tree. VoiceOver reads MathML with its own (less
  granular) engine. So on Windows, exposing MathML beats any author-written label.
- **MathML 4 `intent`** (Working Draft Oct 2026, CR expected around Q4 2026) lets
  authors disambiguate meaning (`intent="binomial($n,$k)"`, `:unit`,
  `f:prefix($x)`); MathCAT implements most of it. We know the semantics from the
  AST, so we're well placed to emit it.
- **MathJax 4** switched its default from hidden MathML to `aria-label`
  speech + `aria-braillelabel` (generated by Speech Rule Engine) for
  consistency across AT, plus a keyboard explorer over the semantic tree
  (arrows navigate, Enter collapses, `>` switches MathSpeak/ClearSpeak). Sources
  disagree on which approach is better. Pick **one** channel per expression
  either way — label + exposed MathML gets read twice.
- **Speech Rule Engine** (SRE) can be called directly to turn MathML into MathSpeak/ClearSpeak speech
  and Nemeth braille, if we'd rather not write our own rules.
- **`aria-braillelabel`** has shipped in Chromium, but AT support is patchy;
  axe requires it to be paired with an `aria-label`.
- **Navigation research** (AsTeR, Gillan et al., Sorge/Cervone walkers,
  MathCAT) prefers walking a semantic tree with summarisation/collapse over the
  layout tree for *reading*. For *editing*, every shipping editor uses the
  layout tree (numerator/denominator/superscript), because that's where the
  cursor actually is.
- **AI-generated descriptions** of math are not reliable yet, and we have the AST anyway.
  Generate speech deterministically.

Verification status:
- **Checked against primary sources:**
  - the MathJax 4 claims (docs.mathjax.org accessibility and explorer-command pages)
  - the Desmos API and Abraham docs
  - wpt.fyi results
  - the DAISY page on recommended JAWS settings: MathCAT is on by default from JAWS 2026
  - the arXiv papers
- **Still second-hand:** W3C material (MathML 4 WD dates, `intent` status,
  charter, WG minutes). The W3C sites couldn't be reached from this environment,
  and help.desmos.com and dl.acm.org block automated fetches. Check those before
  quoting them.

## Proposed plan

### Phase 0 — quick wins (1–3 days)

- Make the hidden `<input>` (or the div, not both) the single focus target;
  move `role="textbox"`, `aria-multiline="false"`, and the accessible name onto
  it. Accept `aria-label` / `aria-labelledby` props on `MathEditor`.
- Attach key listeners to the focus target instead of `window`; route keypad
  events to the last-focused editor instead of every editor.
- Keypad: real `<button>`s with names ("square root", "fraction",
  "add row above", …).
- Visible focus ring (`:focus-visible`, ≥3:1 contrast) and a
  `@media (forced-colors: active)` pass for border/cursor/placeholder boxes.
- `MathRenderer`: `role="img"` + `aria-label` from a basic linear reading as
  a stopgap until Phase 1 lands.
- Remove debug `console.log`s.

### Phase 1 — static math (1–2 weeks)

- Write an **editor-tree → Presentation MathML** printer (9 node types +
  chars → `mrow`/`mfrac`/`msqrt`/`mroot`/`msub`/`msup`/`msubsup`/`munderover`/
  `mover`/`mtable`/`mo`/`mi`/`mn`). It never fails, so it works for any
  `CharRow`, including incomplete ones.
- Enrich with semantics where `Editor.parse` succeeds: use the semantic tree
  (via `loc`) to pick `mi` vs `mo` vs `mn`, insert `&InvisibleTimes;` /
  `&ApplyFunction;`, and add `intent` for things like derivatives, absolute
  value, and long arithmetic layouts. Reuse or retire `mathml-renderer.tsx`.
- Render: SVG stays `aria-hidden`, and a visually-hidden `<math>` sibling is the
  single accessible channel. Option `a11y="mathml" | "label" | "none"`, where
  `"label"` produces `role="math"`/`role="img"` + `aria-label` (+ optional
  `aria-braillelabel`) for environments without MathML-aware AT.
- Export the MathML printer (useful for copy/paste and for consumers). That
  needs a changeset for `@math-blocks/react` (and wherever the printer lives).
- Test: snapshot the MathML; axe in jsdom/Playwright; a manual pass on
  NVDA+MathCAT and VoiceOver.

### Phase 2 — editor speech (2–4 weeks)

- **`mathspeak(node, opts)`** over the editor tree: templates per node type
  ("StartFraction, … Over … EndFraction", "Superscript … Baseline",
  "StartRoot … EndRoot", "StartRootIndex"…), char names (`−` → "minus",
  `·` → "times", `±` → "plus or minus", Greek letters), and opt-in shorthand
  ("x squared", "one half") for whole-expression reads only. ~300–500 LOC plus
  tests — MathQuill's equivalent is spread across a few hundred lines.
  Keep the words out of the code from the start. MathQuill hard-codes English
  strings and has no localization. Instead, follow Speech Rule Engine's layout for each
  locale:
  - a message table (`START`, `FRAC_OVER`, `ENDFRAC`, `SUPER`, `BASELINE`, …)
  - a table of character names
  - a function that turns numbers into words
  - per-locale overrides where word order or grammar differs, e.g. German
    inflects adjectives like "fettes" and puts some of them after the noun

  English ships first. Other languages can then be added without touching
  the generator, or delegated to SRE.
- **`describe(prev, action, next): string`** — a pure function in
  `@math-blocks/editor`. It compares cursor paths to work out "beginning of
  numerator", "after StartFraction … EndFraction", "end of superscript", what
  was inserted or deleted, and what's selected. Pure and reducer-adjacent, so it
  can be exhaustively unit tested with golden strings (MathQuill's
  `test/unit/aria.test.js` is a good source of expected outputs).
- **React wiring**: one `aria-live="assertive" aria-atomic="true"` region
  per editor (added empty on mount), flushed once per action. The focus
  target's description is the full-expression mathspeak, refreshed on change.
  Add an `ariaPostLabel`-style prop for results and errors (`role="status"`,
  polite) — useful for the solver demo and for "checking work".
- **Hotkeys** for screen reader users: speak whole expression, speak current
  block/parent, speak selection, speak post-label (MathQuill's Ctrl+Alt+…
  set, or MathCAT-style keys — pick one and document it).
- **Test matrix**: NVDA (+MathCAT) and JAWS on Chrome/Firefox; VoiceOver on
  Safari macOS and iOS; TalkBack on Chrome. Watch for browse/focus-mode
  switching on the textbox.

### Phase 3 — optional polish (2–4 weeks)

- Verbosity (terse/medium/verbose) and a ClearSpeak-style option, or delegate
  static speech/braille to SRE by feeding it our MathML (adds a sizeable
  dependency; MathJax and MathLive both lean on it).
- Keyboard explorer for static math: walk the semantic tree, highlight the
  matching scene-graph boxes using the `loc`↔`id` mapping, and support collapse
  and summaries.
- Size math in `em` so it follows user font size and zoom. Give long display math
  a horizontal scroll container for reflow (1.4.10).

### Phase 4 — braille input (months, only if there's demand)

Nemeth/UEB back-translation and six-key entry, as Desmos does. This needs braille
expertise and user testing. Braille *output* in Phase 3 via SRE or MathCAT
covers most of the value first. Licensing Desmos's Abraham (LaTeX ↔ Nemeth/UEB,
tolerant of incomplete input) through `@math-blocks/tex` would cut this
from months to weeks, if a partnership is possible.

How Desmos does it, read from its public (minified) calculator bundle:
- **A native input replaces the editor.** In braille mode the MathQuill field is
  swapped for a plain `<input class="dcg-braille-input">`.
- **The input holds Braille ASCII.** Its value is the expression translated
  LaTeX → Nemeth/UEB and stored as lowercase North American Braille ASCII,
  one character per braille cell. Its `aria-label` is translated the same way.
- **The screen reader drives the display.** It shows the field's text like any other
  text field. Desmos doesn't use `aria-braillelabel` anywhere.
- **Input comes back through the same field.** Typing on the display's keys, or
  six-key entry with S D F J K L, edits the field. The text is normalized to
  Unicode six-dot cells (both Braille ASCII and Unicode braille are accepted,
  and 8-dot cells are reduced to 6-dot). It's then translated back to LaTeX and
  into the editor model. If translation fails, the user's text is left as it is.

This makes braille editing ordinary text editing, which every screen reader and
display already handles, cursor-routing keys included. For us the round trip
would be editor tree ↔ LaTeX (`@math-blocks/tex` has both a printer and a
parser) ↔ braille.

## References

- MathQuill a11y: https://github.com/mathquill/mathquill (`src/services/aria.ts`,
  `test/unit/aria.test.js`); Desmos fork: https://github.com/desmosinc/mathquill
- Desmos accessibility help: https://help.desmos.com/hc/en-us/articles/4404860698253 ;
  API braille options: https://www.desmos.com/api/v1.12/docs/index.html
- MathLive a11y: https://github.com/arnog/mathlive (`src/editor/a11y.ts`)
- MathJax 4 accessibility: https://docs.mathjax.org/en/latest/basic/accessibility.html ;
  explorer: https://github.com/mathjax/MathJax-src/blob/master/ts/a11y/explorer/KeyExplorer.ts
- Speech Rule Engine: https://github.com/Speech-Rule-Engine/speech-rule-engine
- MathCAT: https://github.com/daisy/MathCAT , https://daisy.github.io/MathCAT/
- MathML Core: https://w3c.github.io/mathml-core/ ; MathML 4 WD:
  https://www.w3.org/TR/2026/WD-mathml4-20261008/ ; intent concepts:
  https://w3c.github.io/mathml-docs/intent-core-concepts ; MathML-AAM:
  https://w3c.github.io/math-aam
- Carlisle, Libbrecht, Schubotz, Soiffer, "Author Intent": https://arxiv.org/abs/2407.06720
- Cervone & Sorge, "Adaptable Accessibility Features for Mathematics on the
  Web", W4A 2019: https://doi.org/10.1145/3315002.3317567
- StereoMath (accessibility-first editor), ASSETS'24: https://arxiv.org/abs/2501.01404
- ARIA braille attributes: https://openaccess-website.pages.dev/blog/aria-braille-accessibility-support-tests/
- Forced colors: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors
