import * as React from "react";

import {MathRenderer} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor";
import {typeset, Layout} from "@math-blocks/typesetter";
import fontMetrics from "../../../metrics/comic-sans.json";

const fontSize = 60;
const comicSansTypeset = typeset(fontMetrics)(fontSize)(1.0);

const linearEquation = comicSansTypeset(
    Editor.Util.row("2x+5=10"),
) as Layout.Box;

const {glyph, row, frac, root} = Editor;

const pythagoras = comicSansTypeset(
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
) as Layout.Box;

const quadraticEquation = comicSansTypeset(
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
) as Layout.Box;

const RendererPage: React.SFC<{}> = () => (
    <div style={{display: "flex", flexDirection: "column"}}>
        <MathRenderer box={linearEquation} />
        <MathRenderer box={pythagoras} />
        <MathRenderer box={quadraticEquation} />
    </div>
);

export default RendererPage;
