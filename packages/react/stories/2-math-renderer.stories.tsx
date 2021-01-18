import * as React from "react";

import * as Editor from "@math-blocks/editor-core";
import {types} from "@math-blocks/semantic";
import {typeset, typesetWithWork} from "@math-blocks/typesetter";
import fontMetrics from "@math-blocks/metrics";

import MathRenderer from "../src/math-renderer";

const {row, glyph, frac, limits, root} = Editor.builders;

export default {
    title: "MathRenderer",
    component: MathRenderer,
};

type EmptyProps = Record<string, never>;

export const Small: React.FunctionComponent<EmptyProps> = () => {
    // TODO: write a function to convert a Semantic AST into an Editor AST
    const math = row([
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
    const scene = typeset(math, context);

    return <MathRenderer scene={scene} />;
};

export const Equation: React.FunctionComponent<EmptyProps> = () => {
    // TODO: how to convert
    const math = row([
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
    const scene = typeset(math, context);

    return <MathRenderer scene={scene} />;
};

const rowsToState = (rows: Editor.types.Row[]): Editor.State => {
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

export const ShowingWork: React.FunctionComponent<EmptyProps> = () => {
    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

    const scene = typesetWithWork(
        rowsToState([
            Editor.util.row(
                "\u00082x\u0008+\u00085\u0008=\u0008\u000810\u0008",
            ),
            Editor.util.row("\u0008\u0008-\u00085\u0008\u0008-\u00085\u0008"),
        ]),
        context,
    );

    return <MathRenderer scene={scene} />;
};

export const LinearEquations: React.FunctionComponent<EmptyProps> = () => {
    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

    const above1 = Editor.util.row(
        "\u00082x\u0008+\u00085\u0008=\u0008\u000810\u0008",
    );
    const below1 = Editor.util.row(
        "\u0008\u0008-\u00085\u0008\u0008-\u00085\u0008",
    );

    const cursor: Editor.types.Cursor = {
        path: [],
        prev: 0,
        next: 1,
    };

    // TODO: render paren wrapped negatives, like (-5) with the correct kerning
    const linearEquation = typesetWithWork(
        rowsToState([above1, below1]),
        context,
        {
            cursor: Editor.layoutCursorFromState({
                math: below1,
                cursor: cursor,
            }),
        },
    );

    const linearEquation2 = typesetWithWork(
        rowsToState([
            Editor.util.row(
                "\u00082x\u0008+\u000810\u0008=\u0008\u000820\u0008",
            ),
            Editor.util.row("\u0008\u0008-\u00085\u0008\u0008-\u00085\u0008"),
        ]),
        context,
    );

    const linearEquation3 = typesetWithWork(
        rowsToState([
            Editor.util.row(
                "\u0008(2x+1)\u0008+\u00085\u0008-\u0008y\u0008=\u0008\u000810\u0008",
            ),
            Editor.util.row(
                "\u0008\u0008+\u0008123\u0008\u0008\u0008\u0008+\u00085\u0008",
            ),
        ]),
        context,
    );

    const linearEquation4 = typesetWithWork(
        rowsToState([
            Editor.util.row(
                "\u0008\u00085\u0008+\u00082x\u0008=\u0008\u000810\u0008",
            ),
            Editor.util.row(
                "\u0008-\u00085\u0008\u0008\u0008\u0008-\u00085\u0008",
            ),
        ]),
        context,
    );

    const linearEquation5 = typesetWithWork(
        rowsToState([
            Editor.util.row(
                "\u0008\u00085\u0008+\u00082x\u0008=\u0008\u000810\u0008",
            ),
            Editor.util.row(
                "\u0008+\u0008(-5)\u0008\u0008\u0008\u0008+\u0008(-5)\u0008",
            ),
        ]),
        context,
    );

    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            <MathRenderer scene={linearEquation} />
            <MathRenderer scene={linearEquation2} />
            <MathRenderer scene={linearEquation3} />
            <MathRenderer scene={linearEquation4} />
            <MathRenderer scene={linearEquation5} />
        </div>
    );
};

export const Cursor: React.FunctionComponent<EmptyProps> = () => {
    const cursor: Editor.types.Cursor = {
        path: [],
        prev: 0,
        next: 1,
    };

    const math = row([
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
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

    const options = {
        cursor: Editor.layoutCursorFromState({
            math,
            cursor,
        }),
    };

    const scene = typeset(math, context, options);

    return <MathRenderer scene={scene} />;
};

export const Selection: React.FunctionComponent<EmptyProps> = () => {
    const cursor: Editor.types.Cursor = {
        path: [],
        prev: 0,
        next: 1,
    };

    const selectionStart = {
        path: [],
        prev: 4,
        next: 5,
    };

    const math = row([
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
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

    const options = {
        cursor: Editor.layoutCursorFromState({
            math,
            cursor,
            selectionStart,
        }),
    };

    const scene = typeset(math, context, options);

    return <MathRenderer scene={scene} />;
};

export const Pythagoras: React.FunctionComponent<EmptyProps> = () => {
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
            Editor.util.sup("2"),
            glyph("+"),
            glyph("b"),
            Editor.util.sup("2"),
            glyph("="),
            glyph("c"),
            Editor.util.sup("2"),
        ]),
        context,
    );

    return <MathRenderer scene={pythagoras} />;
};

export const QuadraticEquation: React.FunctionComponent<EmptyProps> = () => {
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
                            Editor.util.sup("2"),
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
    );

    return <MathRenderer scene={quadraticEquation} />;
};

export const Limit: React.FunctionComponent<EmptyProps> = () => {
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
    );

    return <MathRenderer scene={lim} />;
};

export const Summation: React.FunctionComponent<EmptyProps> = () => {
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
            frac([glyph("1")], [glyph("2"), Editor.util.sup("i")]),
        ]),
        context,
    );

    return <MathRenderer scene={sum} />;
};

export const ColorizedFraction: React.FunctionComponent<EmptyProps> = () => {
    const fontSize = 60;
    const colorMap = new Map<number, string>();
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        colorMap: colorMap,
    };

    const fracNode = frac([glyph("1")], [glyph("2"), Editor.util.sup("i")]);

    colorMap.set(fracNode.id, "darkcyan");
    colorMap.set(fracNode.children[1].id, "orange");
    const subsup = fracNode.children[1].children[1];
    if (subsup.type === "subsup" && subsup.children[1]) {
        colorMap.set(subsup.children[1].id, "pink");
    }

    const sum = typeset(fracNode, context);

    return <MathRenderer scene={sum} />;
};

export const ColorizedSum: React.FunctionComponent<EmptyProps> = () => {
    const editNode = Editor.util.row("8+10+12+14");

    const semNode = Editor.parse(editNode) as types.Add;

    const num10 = semNode.args[1];
    const num12 = semNode.args[2];

    const colorMap = new Map<number, string>();
    if (num10.loc && num12.loc) {
        // Only do this if the indicies of the args differ by one
        const loc = {
            ...num10.loc,
            start: num10.loc.start,
            end: num12.loc.end,
        };

        for (let i = loc.start; i < loc.end; i++) {
            colorMap.set(editNode.children[i].id, "darkCyan");
        }
    }

    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        colorMap: colorMap,
    };
    const prod = typeset(editNode, context);

    return <MathRenderer scene={prod} />;
};

export const SimpleSemanticColoring: React.FunctionComponent<EmptyProps> = () => {
    const editNode = Editor.util.row("(11+x)(12-y)");

    const semNode = Editor.parse(editNode) as types.Mul;

    const secondTerm = semNode.args[1] as types.Add;

    const num12 = secondTerm.args[0];
    const sum0 = semNode.args[0];

    const colorMap = new Map<number, string>();
    if (num12.loc) {
        for (let i = num12.loc.start; i < num12.loc.end; i++) {
            colorMap.set(editNode.children[i].id, "darkCyan");
        }
    }
    if (sum0.loc) {
        for (let i = sum0.loc.start; i < sum0.loc.end; i++) {
            colorMap.set(editNode.children[i].id, "orange");
        }
    }

    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        colorMap: colorMap,
    };
    const prod = typeset(editNode, context);

    return <MathRenderer scene={prod} />;
};

export const NestedSemanticColoring: React.FunctionComponent<EmptyProps> = () => {
    const editNode = Editor.builders.row([Editor.util.frac("11+x", "12-y")]);

    const semNode = Editor.parse(editNode) as types.Div;
    const denominator = semNode.args[1] as types.Add;

    const num12 = denominator.args[0];
    const sum0 = semNode.args[0];

    const colorMap = new Map<number, string>();
    let node;
    if (num12.loc) {
        node = Editor.util.nodeAtPath(editNode, num12.loc.path);
        for (let i = num12.loc.start; i < num12.loc.end; i++) {
            if (Editor.util.hasChildren(node)) {
                colorMap.set(node.children[i].id, "darkCyan");
            }
        }
    }
    if (sum0.loc) {
        node = Editor.util.nodeAtPath(editNode, sum0.loc.path);
        for (let i = sum0.loc.start; i < sum0.loc.end; i++) {
            if (Editor.util.hasChildren(node)) {
                colorMap.set(node.children[i].id, "orange");
            }
        }
    }

    const fontSize = 60;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        colorMap: colorMap,
    };
    const prod = typeset(editNode, context);

    return <MathRenderer scene={prod} />;
};
