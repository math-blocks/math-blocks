import * as React from "react";

import * as Editor from "@math-blocks/editor-core";
import {FontMetricsContext, comicSans} from "@math-blocks/metrics";

import AccessibleMath from "./accessible-math";

const {row, glyph, frac, root} = Editor.builders;

const MathmlPage: React.FunctionComponent = () => {
    const linearEquation = Editor.util.row("2x+5=10");
    const pythagoras = row([
        glyph("a"),
        Editor.util.sup("2"),
        glyph("+"),
        glyph("b"),
        Editor.util.sup("2"),
        glyph("="),
        glyph("c"),
        Editor.util.sup("2"),
    ]);
    const quadraticEquation = row([
        glyph("x"),
        glyph("="),
        frac(
            [
                glyph("\u2212"),
                glyph("b"),
                glyph("\u00B1"),
                root(null, [
                    glyph("b"),
                    Editor.util.sup("2"),
                    glyph("\u2212"),
                    glyph("4"),
                    glyph("a"),
                    glyph("c"),
                ]),
            ],
            [glyph("2"), glyph("a")],
        ),
    ]);
    const factoring = Editor.util.row("(x-1)(x+1)=0");

    return (
        <FontMetricsContext.Provider value={comicSans}>
            <h1>MathML Test Page</h1>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "auto auto",
                    rowGap: 60,
                }}
            >
                <h2>Linear Equation</h2>
                <AccessibleMath math={linearEquation} />
                <h2>Pythagoras Theorem</h2>
                <AccessibleMath math={pythagoras} />
                <h2>Quadratic Equation</h2>
                <AccessibleMath math={quadraticEquation} />
                <h2>Factoring</h2>
                <AccessibleMath math={factoring} />
            </div>
        </FontMetricsContext.Provider>
    );
};

export default MathmlPage;
