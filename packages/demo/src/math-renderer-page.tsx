import * as React from "react";

import {MathRenderer} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor";
import {typesetWithWork, splitRow} from "@math-blocks/typesetter";
import fontMetrics from "@math-blocks/metrics";

const fontSize = 60;
const context = {
    fontMetrics: fontMetrics,
    baseFontSize: fontSize,
    multiplier: 1.0,
    cramped: false,
};

const row1 = splitRow(Editor.Util.row("2x+5=10"));
// Insert a column for the "-" infront of the "10"
row1.splice(4, 0, Editor.Util.row(""));

// TODO: render paren wrapped negatives, like (-5) with the correct kerning
const linearEquation = typesetWithWork(
    row1,
    [
        Editor.Util.row(""),
        Editor.Util.row("-"),
        Editor.Util.row("5"),
        Editor.Util.row(""),
        Editor.Util.row("-"),
        Editor.Util.row("5"),
    ],
    context,
);

const row2 = splitRow(Editor.Util.row("2x+10=20"));
row2.splice(4, 0, Editor.Util.row(""));

const linearEquation2 = typesetWithWork(
    row2,
    [
        Editor.Util.row(""),
        Editor.Util.row("-"),
        Editor.Util.row("5"),
        Editor.Util.row(""),
        Editor.Util.row("-"),
        Editor.Util.row("5"),
    ],
    context,
);

const row3 = splitRow(Editor.Util.row("(2x+1)+5-y=10"));
row3.splice(6, 0, Editor.Util.row(""));

const linearEquation3 = typesetWithWork(
    row3,
    [
        Editor.Util.row(""),
        Editor.Util.row("+"),
        Editor.Util.row("123"),
        Editor.Util.row(""),
        Editor.Util.row(""),
        Editor.Util.row(""),
        Editor.Util.row("+"),
        Editor.Util.row("5"),
    ],
    context,
);

const row4 = splitRow(Editor.Util.row("5+2x=10"));
// Insert a column for the "-" infront of the "10"
row4.splice(4, 0, Editor.Util.row(""));
row4.splice(0, 0, Editor.Util.row(""));

const linearEquation4 = typesetWithWork(
    row4,
    [
        Editor.Util.row("-"),
        Editor.Util.row("5"),
        Editor.Util.row(""),
        Editor.Util.row(""),
        Editor.Util.row(""),
        Editor.Util.row("-"),
        Editor.Util.row("5"),
    ],
    context,
);

const row5 = splitRow(Editor.Util.row("5+2x=10"));
// Insert a column for the "-" infront of the "10"
row5.splice(0, 0, Editor.Util.row(""));
row5.splice(4, 0, Editor.Util.row(""));

const linearEquation5 = typesetWithWork(
    row5,
    [
        Editor.Util.row("+"),
        Editor.Util.row("(-5)"),
        Editor.Util.row(""),
        Editor.Util.row(""),
        Editor.Util.row(""),
        Editor.Util.row("+"),
        Editor.Util.row("(-5)"),
    ],
    context,
);

// const linearEquation4 = typeset(Editor.Util.row("(2x+1)+5-y=10"), context, {
//     lhs: Editor.Util.row("+123"),
//     rhs: Editor.Util.row("+5"),
// }) as Layout.Box;

// const linearEquation3 = typeset(Editor.Util.row("(2x-1)+5=10"), context, {
//     lhs: Editor.Util.row("-5"),
//     rhs: Editor.Util.row("-5"),
// }) as Layout.Box;

// const linearEquation4 = typeset(Editor.Util.row("(2x+1)+5-y=10"), context, {
//     lhs: Editor.Util.row("+123"),
//     rhs: Editor.Util.row("+5"),
// }) as Layout.Box;

// const linearEquation5 = typeset(Editor.Util.row("(2x+1)+5-y=10"), context, {
//     lhs: Editor.Util.row("+-123"),
//     rhs: Editor.Util.row("+-5"),
// }) as Layout.Box;

// const {glyph, row, frac, root, limits} = Editor;

// const pythagoras = typeset(
//     row([
//         glyph("a"),
//         Editor.Util.sup("2"),
//         glyph("+"),
//         glyph("b"),
//         Editor.Util.sup("2"),
//         glyph("="),
//         glyph("c"),
//         Editor.Util.sup("2"),
//     ]),
//     context,
// ) as Layout.Box;

// const quadraticEquation = typeset(
//     row([
//         glyph("x"),
//         glyph("="),
//         frac(
//             [
//                 glyph("\u2212"),
//                 glyph("b"),
//                 glyph("\u00B1"),
//                 root(
//                     [
//                         glyph("b"),
//                         Editor.Util.sup("2"),
//                         glyph("\u2212"),
//                         glyph("4"),
//                         glyph("a"),
//                         glyph("c"),
//                     ],
//                     [],
//                 ),
//             ],
//             [glyph("2"), glyph("a")],
//         ),
//     ]),
//     context,
// ) as Layout.Box;

// const lim = typeset(
//     row([
//         limits(row([glyph("l"), glyph("i"), glyph("m")]), [
//             glyph("x"),
//             glyph("—"),
//             glyph(">"),
//             glyph("0"),
//         ]),
//         glyph("x"),
//     ]),
//     context,
// ) as Layout.Box;

// const sum = typeset(
//     row([
//         limits(
//             glyph("\u03a3"),
//             [glyph("i"), glyph("="), glyph("0")],
//             [glyph("\u221e")],
//         ),
//         frac([glyph("1")], [glyph("2"), Editor.Util.sup("i")]),
//     ]),
//     context,
// ) as Layout.Box;

const RendererPage: React.SFC<{}> = () => (
    <div style={{display: "flex", flexDirection: "column"}}>
        <MathRenderer box={linearEquation} />
        <MathRenderer box={linearEquation2} />
        <MathRenderer box={linearEquation3} />
        <MathRenderer box={linearEquation4} />
        <MathRenderer box={linearEquation5} />
        {/* <MathRenderer box={pythagoras} />
        <MathRenderer box={quadraticEquation} />
        <MathRenderer box={lim} />
        <MathRenderer box={sum} /> */}
    </div>
);

export default RendererPage;
