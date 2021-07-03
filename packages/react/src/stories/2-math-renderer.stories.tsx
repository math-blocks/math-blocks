import * as React from "react";
import type {Story} from "@storybook/react";
import type {Mutable} from "utility-types";

import * as Editor from "@math-blocks/editor-core";
import * as Semantic from "@math-blocks/semantic";
import * as Typesetter from "@math-blocks/typesetter";
import {getFontData, parse} from "@math-blocks/opentype";
import type {FontData} from "@math-blocks/opentype";

import MathRenderer from "../math-renderer";

// @ts-expect-error: TypeScript doesn't know about this path
import stixPath from "../../../../assets/STIX2Math.otf";

// @ts-expect-error: TypeScript doesn't know about this path
import lmPath from "../../../../assets/latinmodern-math.otf";

const {row, glyph, frac, limits, root, subsup} = Editor.builders;
const {applyColorMapToEditorNode} = Editor.transforms;

const stixFontLoader = async (): Promise<FontData> => {
    const res = await fetch(stixPath);
    const blob = await res.blob();
    const font = await parse(blob);
    return getFontData(font, "STIX2");
};

const lmFontLoader = async (): Promise<FontData> => {
    const res = await fetch(lmPath);
    const blob = await res.blob();
    const font = await parse(blob);
    return getFontData(font, "LM-Math");
};

export default {
    title: "MathRenderer",
    component: MathRenderer,
    loaders: [stixFontLoader],
};

type EmptyProps = Record<string, never>;

const style = {background: "white"};

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

    return <MathRenderer scene={scene} style={style} />;
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

    return <MathRenderer scene={scene} style={style} />;
};

export const LatinModernEquation: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
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

    return <MathRenderer scene={scene} style={style} />;
};
// @ts-expect-error: Story doesn't include 'loaders' static
LatinModernEquation.loaders = [lmFontLoader];

export const LatinModernRootAndFraction: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const math = row([
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
    const scene = Typesetter.typeset(math, context);

    return <MathRenderer scene={scene} style={style} />;
};
// @ts-expect-error: Story doesn't include 'loaders' static
LatinModernRootAndFraction.loaders = [lmFontLoader];

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
            selection: [],
            right: math.children.slice(1),
            style: {},
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

    return <MathRenderer scene={scene} style={style} />;
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
            selection: math.children.slice(1, 5),
            right: math.children.slice(5),
            style: {},
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

    return <MathRenderer scene={scene} style={style} />;
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

    return <MathRenderer scene={pythagoras} style={style} />;
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

    return <MathRenderer scene={quadraticEquation} style={style} />;
};

export const Limit: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };

    const lim = Typesetter.typeset(
        row([
            limits(row([glyph("l"), glyph("i"), glyph("m")]), [
                glyph("y"),
                glyph("—"),
                glyph(">"),
                glyph("0"),
            ]),
            glyph("x"),
        ]),
        context,
    );

    return <MathRenderer scene={lim} style={style} />;
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

    return <MathRenderer scene={sum} style={style} />;
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
    };

    const fracNode = frac([glyph("1")], [glyph("2"), Editor.util.sup("i")]);

    colorMap.set(fracNode.id, "darkcyan");
    colorMap.set(fracNode.children[1].id, "orange");
    const subsup = fracNode.children[1].children[1];
    if (subsup.type === "subsup" && subsup.children[1]) {
        colorMap.set(subsup.children[1].id, "pink");
    }

    const fracNodeWithColor = applyColorMapToEditorNode(fracNode, colorMap);
    const sum = Typesetter.typeset(row([fracNodeWithColor]), context);

    return <MathRenderer scene={sum} style={style} />;
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
    };

    const editNodeWithColor = applyColorMapToEditorNode(editNode, colorMap);
    const prod = Typesetter.typeset(editNodeWithColor, context);

    return <MathRenderer scene={prod} style={style} />;
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
            Editor.util.row("12\u2212y").children,
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
    };
    const editNodeWithColor = applyColorMapToEditorNode(editNode, colorMap);
    const prod = Typesetter.typeset(editNodeWithColor, context);

    return <MathRenderer scene={prod} style={style} />;
};

export const NestedSemanticColoring: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const editNode = Editor.builders.row([
        Editor.util.frac("11+x", "12\u2212y"),
    ]);

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
    };
    const editNodeWithColor = applyColorMapToEditorNode(editNode, colorMap);
    const prod = Typesetter.typeset(editNodeWithColor, context);

    return <MathRenderer scene={prod} style={style} />;
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

    return <MathRenderer scene={prod} style={style} />;
};

export const TallDelimitersWithCursor: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const math = Editor.builders.row([
        Editor.builders.delimited(
            [frac([glyph("1")], [glyph("1"), glyph("+"), glyph("x")])],
            glyph("("),
            glyph(")"),
        ),
        glyph("+"),
        root(null, [frac([glyph("1")], [glyph("1"), glyph("+"), glyph("x")])]),
    ]);

    const zipper: Editor.Zipper = {
        row: {
            type: "zrow",
            id: math.id,
            left: [],
            right: math.children,
            selection: [],
            style: {},
        },
        breadcrumbs: [],
    };
    let state: Editor.State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
    };

    state = Editor.reducer(state, {type: "ArrowRight"});
    state = Editor.reducer(state, {type: "ArrowRight"});

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
    const prod = Typesetter.typesetZipper(state.zipper, context, options);

    return <MathRenderer scene={prod} style={style} />;
};

export const TallDelimitersWithSelection: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const math = Editor.builders.row([
        Editor.builders.delimited(
            [frac([glyph("1")], [glyph("1"), glyph("+"), glyph("x")])],
            glyph("("),
            glyph(")"),
        ),
        glyph("+"),
        root(null, [frac([glyph("1")], [glyph("1"), glyph("+"), glyph("x")])]),
    ]);

    const zipper: Editor.Zipper = {
        row: {
            type: "zrow",
            id: math.id,
            left: [],
            right: math.children,
            selection: [],
            style: {},
        },
        breadcrumbs: [],
    };
    let state: Editor.State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: true,
    };

    state = Editor.reducer(state, {type: "ArrowRight"});
    state = Editor.reducer(state, {type: "ArrowRight"});

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
    const prod = Typesetter.typesetZipper(state.zipper, context, options);

    return <MathRenderer scene={prod} style={style} />;
};

export const CursorSize: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const math = row([
        frac([glyph("1")], [glyph("1"), glyph("+"), glyph("x")]),
    ]);

    const zipper: Editor.Zipper = {
        row: {
            type: "zrow",
            id: math.id,
            left: math.children,
            right: [],
            selection: [],
            style: {},
        },
        breadcrumbs: [],
    };
    let state: Editor.State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
    };

    state = Editor.reducer(state, {type: "ArrowLeft"});
    state = Editor.reducer(state, {type: "ArrowLeft"});

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Text,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };
    const options = {
        showCursor: true,
    };
    const prod = Typesetter.typesetZipper(state.zipper, context, options);

    return <MathRenderer scene={prod} style={style} />;
};

export const SelectionSize: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const math = row([
        frac(
            [glyph("1")],
            [
                Editor.builders.delimited(
                    [glyph("1"), glyph("+"), glyph("y")],
                    glyph("("),
                    glyph(")"),
                ),
            ],
        ),
    ]);

    const zipper: Editor.Zipper = {
        row: {
            type: "zrow",
            id: math.id,
            left: math.children,
            right: [],
            selection: [],
            style: {},
        },
        breadcrumbs: [],
    };
    let state: Editor.State = {
        startZipper: zipper,
        endZipper: zipper,
        zipper: zipper,
        selecting: false,
    };

    state = Editor.reducer(state, {type: "ArrowLeft"});
    state = Editor.reducer(state, {type: "ArrowLeft"});
    state = {...state, selecting: true};
    state = Editor.reducer(state, {type: "ArrowLeft"});
    state = Editor.reducer(state, {type: "ArrowLeft"});

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Text,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };
    const options = {
        showCursor: true,
    };
    const prod = Typesetter.typesetZipper(state.zipper, context, options);

    return <MathRenderer scene={prod} style={style} />;
};

export const RadicalWithDegreeDynamic: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const editNode = Editor.builders.row([root([glyph("3")], [glyph("x")])]);

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };
    const prod = Typesetter.typeset(editNode, context);

    return <MathRenderer scene={prod} style={style} />;
};

export const RadicalWithLargeDegreeDynamic: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const editNode = Editor.builders.row([
        frac(
            [glyph("1")],
            [root([glyph("1"), glyph("2"), glyph("3")], [glyph("x")])],
        ),
    ]);

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };
    const prod = Typesetter.typeset(editNode, context);

    return <MathRenderer scene={prod} style={style} />;
};

export const SubscriptSuperscriptStressTest: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const editNode = Editor.builders.row([
        glyph("x"),
        subsup(
            [glyph("n"), subsup(undefined, [glyph("2")])],
            [glyph("n"), subsup([glyph("j")], undefined)],
        ),
        glyph("+"),
        glyph("x"),
        subsup(
            [glyph("n"), subsup([glyph("j")], undefined)],
            [glyph("n"), subsup(undefined, [glyph("2")])],
        ),
    ]);

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };
    const prod = Typesetter.typeset(editNode, context);

    return <MathRenderer scene={prod} style={style} />;
};

export const ScriptsOnTallDelimiters: Story<EmptyProps> = (
    args,
    {loaded: fontData},
) => {
    const editNode = Editor.builders.row([
        glyph("x"),
        glyph("+"),
        Editor.builders.delimited(
            [frac([glyph("y"), glyph("\u2212"), glyph("1")], [glyph("x")])],
            glyph("("),
            glyph(")"),
        ),
        subsup([glyph("n")], [glyph("2")]),
        glyph("+"),
        glyph("z"),
    ]);

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };
    const prod = Typesetter.typeset(editNode, context);

    return <MathRenderer scene={prod} style={style} />;
};

export const Cancelling: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const editNode = Editor.builders.row([
        glyph("x"),
        glyph("y"),
        glyph("+"),
        Editor.builders.frac([glyph("a")], [glyph("b")]),
        glyph("\u2212"),
        Editor.builders.root(null, [glyph("z"), glyph("+"), glyph("1")]),
    ]);

    // @ts-expect-error: ignore readonly
    editNode.children[0].style.cancel = 1;
    // @ts-expect-error: ignore readonly
    editNode.children[1].style.cancel = 2;
    // @ts-expect-error: ignore readonly
    editNode.children[3].style.cancel = 3;
    // @ts-expect-error: we know that this is a root
    editNode.children[5].children[1].children[0].style.cancel = 4;
    // @ts-expect-error: we know that this is a root
    editNode.children[5].children[1].children[1].style.cancel = 4;
    // @ts-expect-error: we know that this is a root
    editNode.children[5].children[1].children[2].style.cancel = 4;

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };
    const prod = Typesetter.typeset(editNode, context);

    return <MathRenderer scene={prod} style={style} />;
};

export const Matrix: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const matrix = Editor.builders.row([
        Editor.builders.glyph("A"),
        Editor.builders.glyph("="),
        Editor.builders.matrix(
            [
                // first row
                [Editor.builders.glyph("a")],
                [Editor.builders.glyph("b")],
                [Editor.builders.glyph("c")],

                // second row
                [Editor.builders.glyph("d")],
                [
                    Editor.builders.glyph("e"),
                    Editor.builders.glyph("+"),
                    Editor.builders.glyph("1"),
                ],
                [Editor.builders.glyph("f")],

                // third row
                [Editor.builders.glyph("0")],
                [Editor.builders.glyph("0")],
                [Editor.builders.glyph("1")],
            ],
            3,
            3,
            {
                left: Editor.builders.glyph("["),
                right: Editor.builders.glyph("]"),
            },
        ),
    ]);

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };
    const prod = Typesetter.typeset(matrix, context);

    return <MathRenderer scene={prod} style={style} />;
};

export const VerticalWork: Story<EmptyProps> = (args, {loaded: fontData}) => {
    const {builders} = Editor;
    const table = builders.algebra(
        [
            // first row
            [],
            [builders.glyph("2"), builders.glyph("x")],
            [],
            [builders.glyph("+")],
            [builders.glyph("5")],
            [],
            [builders.glyph("=")],
            [],
            [builders.glyph("1"), builders.glyph("0")],
            [],

            // second row
            [],
            [],
            [builders.glyph("\u2212"), builders.glyph("y")],
            [builders.glyph("\u2212")],
            [builders.glyph("5")],
            [],
            [],
            [builders.glyph("\u2212")],
            [builders.glyph("5")],
            [],

            // third row
            [],
            [builders.glyph("2"), builders.glyph("x")],
            [builders.glyph("\u2212"), builders.glyph("y")],
            [builders.glyph("\u2212")],
            [builders.glyph("5")],
            [],
            [builders.glyph("=")],
            [],
            [builders.glyph("5")],
            [],
        ],
        10,
        3,
    ) as Mutable<Editor.types.Table>;
    table.rowStyles = [null, null, {border: "top"}];
    const verticalWork = builders.row([table]);

    const fontSize = 60;
    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
        mathStyle: Typesetter.MathStyle.Display,
        renderMode: Typesetter.RenderMode.Dynamic,
        cramped: false,
    };
    const prod = Typesetter.typeset(verticalWork, context);

    return <MathRenderer scene={prod} style={style} />;
};
