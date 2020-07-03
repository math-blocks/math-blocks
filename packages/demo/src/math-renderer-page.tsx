import * as React from "react";

import {MathRenderer} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor";
import {typeset, Layout} from "@math-blocks/typesetter";
import fontMetrics from "@math-blocks/metrics";

const fontSize = 60;
const context = {
    fontMetrics: fontMetrics,
    baseFontSize: fontSize,
    multiplier: 1.0,
    cramped: false,
};

const linearEquation = typeset(
    Editor.Util.row("2x+5=10"),
    context,
) as Layout.Box;

const {glyph, row, frac, root} = Editor;

const pythagoras = typeset(
    row([
        glyph("a"),
        Editor.Util.sup("2"),
        glyph("+"),
        glyph("b"),
        Editor.Util.sup("2"),
        glyph("="),
        glyph("c"),
        Editor.Util.sup("2"),
    ]),
    context,
) as Layout.Box;

const quadraticEquation = typeset(
    row([
        glyph("x"),
        glyph("="),
        frac(
            [
                glyph("\u2212"),
                glyph("b"),
                glyph("\u00B1"),
                root(
                    [
                        glyph("b"),
                        Editor.Util.sup("2"),
                        glyph("\u2212"),
                        glyph("4"),
                        glyph("a"),
                        glyph("c"),
                    ],
                    [],
                ),
            ],
            [glyph("2"), glyph("a")],
        ),
    ]),
    context,
) as Layout.Box;

const RendererPage: React.SFC<{}> = () => (
    <div style={{display: "flex", flexDirection: "column"}}>
        <MathRenderer box={linearEquation} />
        <MathRenderer box={pythagoras} />
        <MathRenderer box={quadraticEquation} />
    </div>
);

export default RendererPage;