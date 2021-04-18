import * as React from "react";
import type {Story} from "@storybook/react";

import * as Editor from "@math-blocks/editor-core";
import * as Semantic from "@math-blocks/semantic";
import * as Typesetter from "@math-blocks/typesetter";
import {getFontData, parse} from "@math-blocks/opentype";
import type {FontData} from "@math-blocks/opentype";

import MathRenderer from "../math-renderer";

// @ts-expect-error: TypeScript doesn't know about this path
import fontPath from "../../../../assets/STIX2Math.otf";

const {row, glyph, frac, limits, root} = Editor.builders;

const fontLoader = async (): Promise<FontData> => {
    const res = await fetch(fontPath);
    const blob = await res.blob();
    const font = await parse(blob);
    return getFontData(font, "STIX2");
};

export default {
    title: "MathRenderer",
    component: MathRenderer,
    loaders: [fontLoader],
};

type EmptyProps = Record<string, never>;

export const Small: Story<EmptyProps> = (args, {loaded: fontData}) => {
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
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
    };
    const scene = Typesetter.typeset(math, context);

    return <MathRenderer scene={scene} />;
};

export const Equation: Story<EmptyProps> = (args, {loaded: fontData}) => {
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
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
    };
    const scene = Typesetter.typeset(math, context);

    return <MathRenderer scene={scene} />;
};

export const Cursor: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const math = row([
        glyph("2"),
        glyph("x"),
        glyph("+"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("0"),
    ]);
    const zipper: Editor.Zipper = {
        row: {
            type: "zrow",
            id: math.id,
            left: math.children.slice(0, 1),
            right: math.children.slice(1),
            selection: null,
        },
        breadcrumbs: [],
    };

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };
    const options = {
        showCursor: true,
    };

    const scene = Typesetter.typesetZipper(zipper, context, options);

    return <MathRenderer scene={scene} />;
};

export const Selection: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const math = row([
        glyph("2"),
        glyph("x"),
        glyph("+"),
        glyph("5"),
        glyph("="),
        glyph("1"),
        glyph("0"),
    ]);
    const zipper: Editor.Zipper = {
        row: {
            type: "zrow",
            id: math.id,
            left: math.children.slice(0, 1),
            selection: {
                dir: Editor.Dir.Right,
                nodes: math.children.slice(1, 5),
            },
            right: math.children.slice(5),
        },
        breadcrumbs: [],
    };

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };

    const scene = Typesetter.typesetZipper(zipper, context);

    return <MathRenderer scene={scene} />;
};

export const Pythagoras: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
    };

    const pythagoras = Typesetter.typeset(
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

export const QuadraticEquation: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
    };

    const quadraticEquation = Typesetter.typeset(
        row([
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
        ]),

        context,
    );

    return <MathRenderer scene={quadraticEquation} />;
};

export const Limit: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
    };

    const lim = Typesetter.typeset(
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

export const Summation: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
    };

    const sum = Typesetter.typeset(
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

export const ColorizedFraction: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const fontSize = 60;
    const colorMap = new Map<number, string>();
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
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

    const sum = Typesetter.typeset(row([fracNode]), context);

    return <MathRenderer scene={sum} />;
};

export const ColorizedSum: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const editNode = Editor.util.row("8+10+12+14");

    const semNode = Editor.parse(editNode) as Semantic.types.Add;

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
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
        colorMap: colorMap,
    };
    const prod = Typesetter.typeset(editNode, context);

    return <MathRenderer scene={prod} />;
};

export const SimpleSemanticColoring: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const editNode = Editor.builders.row([
        Editor.builders.delimited(
            Editor.util.row("11+x").children,
            Editor.builders.glyph("("),
            Editor.builders.glyph(")"),
        ),
        Editor.builders.delimited(
            Editor.util.row("12-y").children,
            Editor.builders.glyph("("),
            Editor.builders.glyph(")"),
        ),
    ]);

    const colorMap = new Map<number, string>();

    const semNode = Editor.parse(editNode) as Semantic.types.Mul;
    const secondTerm = semNode.args[1] as Semantic.types.Add;
    const num12 = secondTerm.args[0];
    const sum0 = semNode.args[0];

    if (num12.loc) {
        for (let i = num12.loc.start; i < num12.loc.end; i++) {
            colorMap.set(
                // @ts-expect-error: we know the structure
                editNode.children[1].children[0].children[i].id,
                "darkCyan",
            );
        }
    }
    if (sum0.loc) {
        for (let i = sum0.loc.start; i < sum0.loc.end; i++) {
            colorMap.set(
                // @ts-expect-error: we know the structure
                editNode.children[0].children[0].children[i].id,
                "orange",
            );
        }
    }

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
        colorMap: colorMap,
    };
    const prod = Typesetter.typeset(editNode, context);

    return <MathRenderer scene={prod} />;
};

export const NestedSemanticColoring: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const editNode = Editor.builders.row([Editor.util.frac("11+x", "12-y")]);

    const semNode = Editor.parse(editNode) as Semantic.types.Div;
    const denominator = semNode.args[1] as Semantic.types.Add;

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
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
        colorMap: colorMap,
    };
    const prod = Typesetter.typeset(editNode, context);

    return <MathRenderer scene={prod} />;
};

export const TallDelimiters: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const editNode = Editor.builders.row([
        Editor.builders.delimited(
            [frac([glyph("1")], [glyph("1"), glyph("+"), glyph("x")])],
            glyph("("),
            glyph(")"),
        ),
        glyph("+"),
        root(null, [frac([glyph("1")], [glyph("1"), glyph("+"), glyph("x")])]),
    ]);

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Static,
        cramped: false,
    };
    const prod = Typesetter.typeset(editNode, context);

    return <MathRenderer scene={prod} />;
};
