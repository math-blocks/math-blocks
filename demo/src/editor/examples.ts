import * as Editor from "@math-blocks/editor-core";

const simpleRow = Editor.util.row("2x+5=10");

const delimiters = Editor.builders.row([
    Editor.builders.glyph("x"),
    Editor.builders.glyph("+"),
    Editor.builders.delimited(
        [
            Editor.builders.frac(
                [
                    Editor.builders.glyph("y"),
                    Editor.builders.glyph("\u2212"),
                    Editor.builders.glyph("1"),
                ],
                [Editor.builders.glyph("x")],
            ),
        ],
        Editor.builders.glyph("("),
        Editor.builders.glyph(")"),
    ),
    Editor.builders.subsup(
        [Editor.builders.glyph("n")],
        [Editor.builders.glyph("2")],
    ),
    Editor.builders.glyph("+"),
    Editor.builders.glyph("z"),
]);

const allNodeTypes = Editor.builders.row([
    Editor.builders.glyph("2"),
    Editor.builders.glyph("+"),
    Editor.builders.frac(
        [Editor.builders.glyph("1")],
        [
            Editor.builders.root(
                [
                    Editor.builders.glyph("1"),
                    Editor.builders.glyph("2"),
                    Editor.builders.glyph("3"),
                ],
                [
                    Editor.builders.glyph("x"),
                    Editor.builders.subsup(undefined, [
                        Editor.builders.glyph("2"),
                    ]),
                    Editor.builders.glyph("+"),
                    Editor.builders.frac(
                        [Editor.builders.glyph("1")],
                        [
                            Editor.builders.glyph("a"),
                            Editor.builders.subsup(
                                [Editor.builders.glyph("n")],
                                undefined,
                            ),
                        ],
                    ),
                ],
            ),
        ],
    ),
    Editor.builders.glyph("\u2212"),
    Editor.builders.glyph("\u2212"),
    Editor.builders.glyph("y"),
    Editor.builders.glyph("+"),
    Editor.builders.limits(
        Editor.builders.row([
            Editor.builders.glyph("l"),
            Editor.builders.glyph("i"),
            Editor.builders.glyph("m"),
        ]),
        [
            Editor.builders.glyph("x"),
            Editor.builders.glyph("\u2192"), // \rightarrow
            Editor.builders.glyph("0"),
        ],
    ),
    Editor.builders.glyph("x"),
    Editor.builders.glyph("+"),
    Editor.builders.limits(
        Editor.builders.glyph("\u2211"), // \sum
        [
            Editor.builders.glyph("i"),
            Editor.builders.glyph("="),
            Editor.builders.glyph("0"),
        ],
        [Editor.builders.glyph("\u221E")], // \infty
    ),
    Editor.builders.glyph("i"),
]);

const nestedFractions = Editor.builders.row([
    Editor.builders.glyph("a"),
    Editor.builders.glyph("+"),
    Editor.builders.frac(
        [
            Editor.builders.glyph("2"),
            Editor.builders.glyph("+"),
            Editor.builders.frac(
                [
                    Editor.builders.glyph("x"),
                    Editor.builders.glyph("+"),
                    Editor.builders.glyph("1"),
                ],
                [Editor.builders.glyph("1")],
            ),
            Editor.builders.glyph("+"),
            Editor.builders.glyph("\u2212"),
            Editor.builders.glyph("y"),
        ],
        [Editor.builders.glyph("1")],
    ),
    Editor.builders.glyph("+"),
    Editor.builders.glyph("b"),
]);

const addingFractions = Editor.builders.row([
    Editor.builders.glyph("2"),
    Editor.builders.glyph("+"),
    Editor.builders.frac(
        [
            Editor.builders.frac(
                [Editor.builders.glyph("a")],
                [Editor.builders.glyph("b")],
            ),
            Editor.builders.glyph("+"),
            Editor.builders.frac(
                [Editor.builders.glyph("c")],
                [Editor.builders.glyph("d")],
            ),
        ],
        [Editor.builders.glyph("1")],
    ),
    Editor.builders.glyph("+"),
    Editor.builders.frac(
        [
            Editor.builders.frac(
                [Editor.builders.glyph("x")],
                [Editor.builders.glyph("y")],
            ),
            Editor.builders.glyph("+"),
            Editor.builders.glyph("1"),
        ],
        [Editor.builders.glyph("1")],
    ),
    Editor.builders.glyph("\u2212"),
    Editor.builders.glyph("y"),
]);

export const examples = [
    simpleRow,
    addingFractions,
    allNodeTypes,
    delimiters,
    nestedFractions,
];
