# 01 Editing

Being able to enter mathematical expressions is core to any interactive math
system.

The core implementation of the editor is decoupled from rendering.  This was
done so that multiple frontends could be implemented for different frameworks
(React, React Native, Vue, etc.) using the same editing logic.

The editor manipulates a tree structure containing the following node types:
- `Row` - a horizontal run (contains an array of base nodes and/or other node in
  this list)
- `Delimited` - parens, brackets, etc.
- `Macro` - things like `\pi` which are replaced with `π`
- `Table` - grid layouts, e.g. matrices, vertical work, etc.
- `SubSup` - subscripts and superscripts 
- `Limits` - `\lim`, `\sum`, `\prod` that have expresions above and/or below an
  operator 
- `Frac` - fractions
- `Root` - square roots and roots with an explicit index

The nodes in this tree are generic over the base node type.  The editor uses
`Char` as the base node.  See [Printing and Parsing](03_parsing_and_printing.md)
for other base nodes that are used with this tree.

```ts
// 2x + 5 = 10
const equation = {
    type: "row",
    children: [
        {type: "char": value: "2"},
        {type: "char": value: "x"},
        {type: "char": value: "+"},
        {type: "char": value: "5"},
        {type: "char": value: "="},
        {type: "char": value: "1"},
        {type: "char": value: "0"},
    ]
}
```

The base node can have a style object associated with it.  This allows users to
apply different colors to nodes as well as cancelling.  Although setting these
style values on each node they're applied to may seem a little wasteful, it
makes the editing logic less complex.

The editor itself is a reducer that takes in different actions and returns an
updated editor state.  The actions into the following categories:

- selection modification / cursor positioning (both by keyboard and mouse)
- adding a special node (subscript, superscript, fraction, root, etc.)
- formatting (color, cancelling)

The state combines an editor tree along with a selection.  The `Selection` type
contains an `anchor` (where the selection started) and a `focus` (where the
cursor currently is).  The `anchor` and `focus` are the same when there is no
selection.

```ts
// 1 / (x + 1)
const fraction = {
    type: "row",
    children: [
        {
            type: "frac", 
            children: [{
                type: "row", 
                children: [
                    {type: "char", value: "1"},
                ],
            }, {
                type: "row",
                children: [
                    {type: "char", value: "1"},
                    {type: "char", value: "+"},
                    {type: "char", value: "x"},
                ],
            }],
        }
    ]
}

// selection of "+1" in the denominator of the fraction
const selection = {
    anchor: {
        path: [0, 1],
        offset: 1,
    },
    focus: {
        path: [0, 1],
        offset: 3,
    }
}
```

The `anchor` and `focus` can have different `Path`s.  The reducer determines how
the focus should jump into and out of nodes in the tree to produce the standard
cursor selection behavior that people expect.  During rendering, the typesetter
will figure out what glyphs should highlighted as selected.

## Vertical Layouts

Vertical layouts are used in a number of places in math:

- manipulating equations
- solving systems of equations
- matrices
- standard arithmetic algorithms, e.g. long addition, long subtraction, etc.

### Manipulating Equations

Equations using inline operations as well as vertically stacked operations.
It's important to support both so that we can accommodate whatever practices
students are learning from their teachers. 

The editor allows you add a line below the equation by pressing down.  This
converts the equation into a grid layout with the terms and operators in the
equation appearing in different cells.  Operators and values are aligned in the
same columns.  New columns can be added by positioning the cursor between
existing columns.  Pressing down a second time will add a third row with a
horizontal line separating the second and third rows.

NOTE: This keyboard UI isn't very discoverable, having some on-screen buttons
will help with this.

### Matrices

TODO
