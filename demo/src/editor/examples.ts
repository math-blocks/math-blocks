import {builders} from "@math-blocks/editor-core";

const simpleRow = builders.row([
    builders.glyph("2"),
    builders.glyph("x"),
    builders.glyph("+"),
    builders.glyph("5"),
    builders.glyph("="),
    builders.glyph("1"),
    builders.glyph("0"),
]);

const delimiters = builders.row([
    builders.glyph("x"),
    builders.glyph("+"),
    builders.delimited(
        [
            builders.frac(
                [
                    builders.glyph("y"),
                    builders.glyph("\u2212"),
                    builders.glyph("1"),
                ],
                [builders.glyph("x")],
            ),
        ],
        builders.glyph("("),
        builders.glyph(")"),
    ),
    builders.subsup([builders.glyph("n")], [builders.glyph("2")]),
    builders.glyph("+"),
    builders.glyph("z"),
]);

const allNodeTypes = builders.row([
    builders.glyph("2"),
    builders.glyph("+"),
    builders.frac(
        [builders.glyph("1")],
        [
            builders.root(
                [builders.glyph("1"), builders.glyph("2"), builders.glyph("3")],
                [
                    builders.glyph("x"),
                    builders.subsup(undefined, [builders.glyph("2")]),
                    builders.glyph("+"),
                    builders.frac(
                        [builders.glyph("1")],
                        [
                            builders.glyph("a"),
                            builders.subsup([builders.glyph("n")], undefined),
                        ],
                    ),
                ],
            ),
        ],
    ),
    builders.glyph("\u2212"),
    builders.glyph("\u2212"),
    builders.glyph("y"),
    builders.glyph("+"),
    builders.limits(
        builders.row([
            builders.glyph("l"),
            builders.glyph("i"),
            builders.glyph("m"),
        ]),
        [
            builders.glyph("x"),
            builders.glyph("\u2192"), // \rightarrow
            builders.glyph("0"),
        ],
    ),
    builders.glyph("x"),
    builders.glyph("+"),
    builders.limits(
        builders.glyph("\u2211"), // \sum
        [builders.glyph("i"), builders.glyph("="), builders.glyph("0")],
        [builders.glyph("\u221E")], // \infty
    ),
    builders.glyph("i"),
]);

const nestedFractions = builders.row([
    builders.glyph("a"),
    builders.glyph("+"),
    builders.frac(
        [
            builders.glyph("2"),
            builders.glyph("+"),
            builders.frac(
                [builders.glyph("x"), builders.glyph("+"), builders.glyph("1")],
                [builders.glyph("1")],
            ),
            builders.glyph("+"),
            builders.glyph("\u2212"),
            builders.glyph("y"),
        ],
        [builders.glyph("1")],
    ),
    builders.glyph("+"),
    builders.glyph("b"),
]);

const addingFractions = builders.row([
    builders.glyph("2"),
    builders.glyph("+"),
    builders.frac(
        [
            builders.frac([builders.glyph("a")], [builders.glyph("b")]),
            builders.glyph("+"),
            builders.frac([builders.glyph("c")], [builders.glyph("d")]),
        ],
        [builders.glyph("1")],
    ),
    builders.glyph("+"),
    builders.frac(
        [
            builders.frac([builders.glyph("x")], [builders.glyph("y")]),
            builders.glyph("+"),
            builders.glyph("1"),
        ],
        [builders.glyph("1")],
    ),
    builders.glyph("\u2212"),
    builders.glyph("y"),
]);

// @ts-expect-error: ignore readonly
addingFractions.children[2].style.color = "teal";
// @ts-expect-error: we don't both refining the type since we know what it is
addingFractions.children[2].children[0].style.color = "orange";
// @ts-expect-error: we don't both refining the type since we know what it is
addingFractions.children[2].children[0].children[0].style.color = "pink";

const matrix = builders.row([
    builders.glyph("A"),
    builders.glyph("="),
    builders.matrix(
        [
            // first row
            [builders.glyph("a")],
            [builders.glyph("b")],
            [builders.glyph("c")],

            // second row
            [builders.glyph("d")],
            [builders.glyph("e"), builders.glyph("+"), builders.glyph("1")],
            [builders.glyph("f")],

            // third row
            [builders.glyph("0")],
            [builders.glyph("0")],
            [builders.glyph("1")],
        ],
        3,
        3,
        {
            left: builders.glyph("["),
            right: builders.glyph("]"),
        },
    ),
]);

export const examples = [
    simpleRow,
    addingFractions,
    allNodeTypes,
    delimiters,
    nestedFractions,
    matrix,
];
