import * as React from "react";

import * as Editor from "@math-blocks/editor";
import {MathRenderer} from "@math-blocks/react";
import {Layout, typeset, typesetWithWork} from "@math-blocks/typesetter";

import fontMetrics from "@math-blocks/metrics";

const {row, glyph, frac, limits, root} = Editor;

export default {
    title: "MathRenderer",
    component: MathRenderer,
};

type ID = {
    id: number;
};

export const Small: React.SFC<{}> = () => {
    // TODO: write a function to convert a Semantic AST into an Editor AST
    const math: Editor.Row<Editor.Glyph, ID> = row([
        glyph("2"),
        glyph("x"),
        glyph("+"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("0"),
    ]);
    const fontSize = 20;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };
    const box = typeset(math, context) as Layout.Box;

    return <MathRenderer box={box} />;
};

export const Equation: React.SFC<{}> = () => {
    // TODO: how to convert
    const math: Editor.Row<Editor.Glyph, ID> = row([
        glyph("2"),
        glyph("x"),
        glyph("+"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("0"),
    ]);
    const fontSize = 60;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };
    const box = typeset(math, context) as Layout.Box;

    return <MathRenderer box={box} />;
};

const rowsToState = (
    rows: Editor.Row<Editor.Glyph, {id: number}>[],
): Editor.State => {
    return {
        rows: rows.map((row) => ({
            math: row,
            cursor: {
                path: [],
                prev: -Infinity,
                next: 0,
            },
        })),
        rowIndex: 0,
    };
};

export const ShowingWork: React.FunctionComponent<{}> = () => {
    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

    const work = typesetWithWork(
        rowsToState([
            Editor.Util.row(
                "\u00082x\u0008+\u00085\u0008=\u0008\u000810\u0008",
            ),
            Editor.Util.row("\u0008\u0008-\u00085\u0008\u0008-\u00085\u0008"),
        ]),
        context,
    );

    return <MathRenderer box={work} />;
};

export const LinearEquations: React.SFC<{}> = () => {
    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

    const above1 = Editor.Util.row(
        "\u00082x\u0008+\u00085\u0008=\u0008\u000810\u0008",
    );
    const below1 = Editor.Util.row(
        "\u0008\u0008-\u00085\u0008\u0008-\u00085\u0008",
    );

    // TODO: render paren wrapped negatives, like (-5) with the correct kerning
    const linearEquation = typesetWithWork(
        rowsToState([above1, below1]),
        context,
    );

    const linearEquation2 = typesetWithWork(
        rowsToState([
            Editor.Util.row(
                "\u00082x\u0008+\u000810\u0008=\u0008\u000820\u0008",
            ),
            Editor.Util.row("\u0008\u0008-\u00085\u0008\u0008-\u00085\u0008"),
        ]),
        context,
    );

    const linearEquation3 = typesetWithWork(
        rowsToState([
            Editor.Util.row(
                "\u0008(2x+1)\u0008+\u00085\u0008-\u0008y\u0008=\u0008\u000810\u0008",
            ),
            Editor.Util.row(
                "\u0008\u0008+\u0008123\u0008\u0008\u0008\u0008+\u00085\u0008",
            ),
        ]),
        context,
    );

    const linearEquation4 = typesetWithWork(
        rowsToState([
            Editor.Util.row(
                "\u0008\u00085\u0008+\u00082x\u0008=\u0008\u000810\u0008",
            ),
            Editor.Util.row(
                "\u0008-\u00085\u0008\u0008\u0008\u0008-\u00085\u0008",
            ),
        ]),
        context,
    );

    const linearEquation5 = typesetWithWork(
        rowsToState([
            Editor.Util.row(
                "\u0008\u00085\u0008+\u00082x\u0008=\u0008\u000810\u0008",
            ),
            Editor.Util.row(
                "\u0008+\u0008(-5)\u0008\u0008\u0008\u0008+\u0008(-5)\u0008",
            ),
        ]),
        context,
    );

    const cursor: Editor.Cursor = {
        path: [],
        prev: 0,
        next: 1,
    };

    const layoutCursor = Editor.layoutCursorFromState({
        math: below1,
        cursor: cursor,
    });

    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            <MathRenderer box={linearEquation} cursor={layoutCursor} />
            <MathRenderer box={linearEquation2} />
            <MathRenderer box={linearEquation3} />
            <MathRenderer box={linearEquation4} />
            <MathRenderer box={linearEquation5} />
        </div>
    );
};

export const Pythagoras: React.SFC<{}> = () => {
    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

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

    return <MathRenderer box={pythagoras} />;
};

export const QuadraticEquation: React.SFC<{}> = () => {
    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

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

    return <MathRenderer box={quadraticEquation} />;
};

export const Limit: React.SFC<{}> = () => {
    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

    const lim = typeset(
        row([
            limits(row([glyph("l"), glyph("i"), glyph("m")]), [
                glyph("x"),
                glyph("—"),
                glyph(">"),
                glyph("0"),
            ]),
            glyph("x"),
        ]),
        context,
    ) as Layout.Box;

    return <MathRenderer box={lim} />;
};

export const Summation: React.SFC<{}> = () => {
    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

    const sum = typeset(
        row([
            limits(
                glyph("\u03a3"),
                [glyph("i"), glyph("="), glyph("0")],
                [glyph("\u221e")],
            ),
            frac([glyph("1")], [glyph("2"), Editor.Util.sup("i")]),
        ]),
        context,
    ) as Layout.Box;

    return <MathRenderer box={sum} />;
};

export const ColorizedFraction: React.SFC<{}> = () => {
    const fontSize = 60;
    const colorMap = new Map<number, string>();
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        colorMap: colorMap,
    };

    const fracNode = frac([glyph("1")], [glyph("2"), Editor.Util.sup("i")]);

    colorMap.set(fracNode.id, "darkcyan");
    colorMap.set(fracNode.children[1].id, "orange");
    const subsup = fracNode.children[1].children[1];
    if (subsup.type === "subsup" && subsup.children[1]) {
        colorMap.set(subsup.children[1].id, "pink");
    }

    const sum = typeset(fracNode, context) as Layout.Box;

    return <MathRenderer box={sum} />;
};
