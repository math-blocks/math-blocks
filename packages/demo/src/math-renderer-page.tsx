import * as React from "react";

import {MathRenderer} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor";
import {typesetWithWork} from "@math-blocks/typesetter";
import fontMetrics from "@math-blocks/metrics";

const fontSize = 60;
const context = {
    fontMetrics: fontMetrics,
    baseFontSize: fontSize,
    multiplier: 1.0,
    cramped: false,
};

const above1 = Editor.Util.row("2x+5=\u0008\u000810");
const below1 = Editor.Util.row("\u0008\u0008-5\u0008\u0008-5");

// TODO: render paren wrapped negatives, like (-5) with the correct kerning
const linearEquation = typesetWithWork(above1, below1, context);

const linearEquation2 = typesetWithWork(
    Editor.Util.row("2x+10=\u0008\u000820"),
    Editor.Util.row("\u0008\u0008-5\u0008\u0008-5"),
    context,
);

const linearEquation3 = typesetWithWork(
    Editor.Util.row("(2x+1)+5-y=\u0008\u000810"),
    Editor.Util.row("\u0008\u0008+123\u0008\u0008\u0008\u0008+5"),
    context,
);

const linearEquation4 = typesetWithWork(
    Editor.Util.row("\u0008\u00085+2x=\u0008\u000810"),
    Editor.Util.row("-5\u0008\u0008\u0008\u0008-5"),
    context,
);

const linearEquation5 = typesetWithWork(
    Editor.Util.row("\u0008\u00085+2x=\u0008\u000810"),
    Editor.Util.row("+(-5)\u0008\u0008\u0008\u0008+(-5)"),
    context,
);

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

const cursor: Editor.Cursor = {
    path: [],
    prev: 0,
    next: 1,
};

const layoutCursor = Editor.layoutCursorFromState({
    math: below1,
    cursor: cursor,
});

const RendererPage: React.SFC<{}> = () => (
    <div style={{display: "flex", flexDirection: "column"}}>
        <MathRenderer box={linearEquation} cursor={layoutCursor} />
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
