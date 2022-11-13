# 02 Rendering

It's important to see what we're editing.  That's where rendering comes in.

Rendering is a multi-step process that starts with the tree structured described
in [Editing](02_editing.md).  Even if you just want to display some static math
that won't be edited, you'll need to describe it using that data structure.

## Typesetting

`@math-blocks/typesetter` converts that structure to a scene graph which
describes where each glyph should be rendered, their size and color, any lines
that need to be drawn (for fractions, roots, or canceling), and finally the
cursor or selection highlight.

The information the typesetter needs to do this is stored within OpenType math
fonts.  These fonts have a special [MATH
table](https://learn.microsoft.com/en-us/typography/opentype/spec/math) which
contains the following data: 

- a list of constants with various measurements for things like
  subscript/superscript vertical shifts, fraction bar height, etc.
- the location of veritcally stretched variants of various delimiters (these
  glyphs are not normally accessible)
- where accents (hats, vectors, etc.) should be attached to various glyphs
- italics corrections

The `@math-blocks/opentype` package parse OpenType fonts to extract this data
along with glyph metrics and glyph outlines.  The outlines are necessary for
glyphs that aren't normally accessible.  The reason why we can't use opentype.js
is that that library doesn't support the `MATH` tables yet.

## Frontends

The typesetter doesn't actually render anything to screen.  The actually
rendering is done by components in `@math-blocks/react`.  This package contains
the following components:

- `MathRenderer` - use the typesetter to convert an editor tree to a scene
  graph and then renders it using SVG nodes
- `MathEditor` - same as `MathRender`, but also adds event listeners that
  integrate with the reducer from `@math-blocks/editor` to implement editing

By splitting up the process into these distinct steps, it makes it easier to
support other rendering frontends in the future (e.g. React Native, Canvas, Vue,
etc.).

Implementing at least one other frontend is an important step in validating this
approach.  The Canvas renderer is likely the easiest to implement while the
React Native one would be the most important since there aren't good solutions
for rendering math on mobile.
