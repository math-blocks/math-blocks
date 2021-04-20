import * as React from "react";

import {MathEditor, MathKeypad, FontDataContext} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor-core";
import {parse, getFontData} from "@math-blocks/opentype";

import type {FontData} from "@math-blocks/opentype";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const simpleRow = Editor.util.row("2x+5=10");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const delimiters = Editor.builders.row([
    Editor.builders.glyph("x"),
    Editor.builders.glyph("+"),
    Editor.builders.delimited(
        [
            Editor.builders.glyph("y"),
            Editor.builders.glyph("\u2212"),
            Editor.builders.glyph("1"),
        ],
        Editor.builders.glyph("("),
        Editor.builders.glyph(")"),
    ),
    Editor.builders.glyph("+"),
    Editor.builders.glyph("z"),
]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const allNodeTypes = Editor.builders.row([
    Editor.builders.glyph("2"),
    Editor.builders.glyph("+"),
    Editor.builders.frac(
        [Editor.builders.glyph("1")],
        [
            Editor.builders.root(
                [
                    Editor.builders.glyph("1"),
                    Editor.builders.glyph("2"),
                    Editor.builders.glyph("3"),
                ],
                [
                    Editor.builders.glyph("x"),
                    Editor.builders.subsup(undefined, [
                        Editor.builders.glyph("2"),
                    ]),
                    Editor.builders.glyph("+"),
                    Editor.builders.frac(
                        [Editor.builders.glyph("1")],
                        [
                            Editor.builders.glyph("a"),
                            Editor.builders.subsup(
                                [Editor.builders.glyph("n")],
                                undefined,
                            ),
                        ],
                    ),
                ],
            ),
        ],
    ),
    Editor.builders.glyph("\u2212"),
    Editor.builders.glyph("\u2212"),
    Editor.builders.glyph("y"),
    Editor.builders.glyph("+"),
    Editor.builders.limits(
        Editor.builders.row([
            Editor.builders.glyph("l"),
            Editor.builders.glyph("i"),
            Editor.builders.glyph("m"),
        ]),
        [
            Editor.builders.glyph("x"),
            Editor.builders.glyph("\u2192"), // \rightarrow
            Editor.builders.glyph("0"),
        ],
    ),
    Editor.builders.glyph("+"),
    Editor.builders.limits(
        Editor.builders.glyph("\u2211"), // \sum
        [
            Editor.builders.glyph("i"),
            Editor.builders.glyph("="),
            Editor.builders.glyph("0"),
        ],
        [Editor.builders.glyph("\u221E")], // \infty
    ),
]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nestedFractions = Editor.builders.row([
    Editor.builders.glyph("a"),
    Editor.builders.glyph("+"),
    Editor.builders.frac(
        [
            Editor.builders.glyph("2"),
            Editor.builders.glyph("+"),
            Editor.builders.frac(
                [
                    Editor.builders.glyph("x"),
                    Editor.builders.glyph("+"),
                    Editor.builders.glyph("1"),
                ],
                [Editor.builders.glyph("1")],
            ),
            Editor.builders.glyph("\u2212"),
            Editor.builders.glyph("\u2212"),
            Editor.builders.glyph("y"),
        ],
        [Editor.builders.glyph("1")],
    ),
    Editor.builders.glyph("\u2212"),
    Editor.builders.glyph("b"),
]);

const zipper: Editor.Zipper = {
    breadcrumbs: [],
    row: {
        id: allNodeTypes.id,
        type: "zrow",
        left: [],
        selection: null,
        right: allNodeTypes.children,
    },
};

const EditorPage: React.FunctionComponent = () => {
    const [stixFontData, setStixFontData] = React.useState<FontData | null>(
        null,
    );
    const [lmFontData, setLmFontData] = React.useState<FontData | null>(null);
    const [bonumFontData, setBonumFontData] = React.useState<FontData | null>(
        null,
    );
    const [
        pagellaFontData,
        setPagellaFontData,
    ] = React.useState<FontData | null>(null);
    const [scholaFontData, setScholaFontData] = React.useState<FontData | null>(
        null,
    );
    const [termesFontData, setTermesFontData] = React.useState<FontData | null>(
        null,
    );
    const [fontIndex, setFontIndex] = React.useState<number>(0);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/STIX2Math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            console.log(font);
            setStixFontData(getFontData(font, "STIX2"));
        };

        loadFont();
    }, []);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/latinmodern-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            console.log(font);
            setLmFontData(getFontData(font, "LM-Math"));
        };

        loadFont();
    }, []);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/texgyrebonum-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            console.log(font);
            setBonumFontData(getFontData(font, "Bonum-Math"));
        };

        loadFont();
    }, []);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/texgyrepagella-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            console.log(font);
            setPagellaFontData(getFontData(font, "Pagella-Math"));
        };

        loadFont();
    }, []);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/texgyreschola-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            console.log(font);
            setScholaFontData(getFontData(font, "Schola-Math"));
        };

        loadFont();
    }, []);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            const res = await fetch("/texgyretermes-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            console.log(font);
            setTermesFontData(getFontData(font, "Termes-Math"));
        };

        loadFont();
    }, []);

    if (
        !stixFontData ||
        !lmFontData ||
        !bonumFontData ||
        !pagellaFontData ||
        !scholaFontData ||
        !termesFontData
    ) {
        return null;
    }

    const fonts = [
        stixFontData,
        lmFontData,
        bonumFontData,
        pagellaFontData,
        scholaFontData,
        termesFontData,
    ];
    const fontData = fonts[fontIndex];
    const fontSize = 64;

    // TODO:
    // - render glyphs using <path> and <text> side by side to compare their size
    // - fix radical and index positioning

    return (
        <FontDataContext.Provider value={fontData}>
            <MathEditor
                fontSize={fontSize}
                readonly={false}
                zipper={zipper}
                focus={true}
                onChange={(value) => {
                    console.log(value);
                }}
            />
            <br />
            <br />
            <div style={{fontFamily: "Bonum-Math", fontSize: fontSize}}></div>
            <div style={{display: "flex", alignItems: "center"}}>
                <span style={{fontFamily: "sans-serif", paddingRight: 8}}>
                    Font:{" "}
                </span>
                <select
                    onChange={(e) => setFontIndex(parseInt(e.target.value))}
                    defaultValue={fontIndex}
                >
                    <option value={0}>STIX2</option>
                    <option value={1}>Latin Modern</option>
                    <option value={2}>Gyre Bonum</option>
                    <option value={3}>Gyre Pagella</option>
                    <option value={4}>Gyre Schola</option>
                    <option value={5}>Gyre Termes</option>
                </select>
            </div>
            <div style={{position: "fixed", bottom: 0, left: 0}}>
                {/* <EditingPanel /> */}
                <div style={{height: 8}} />
                <MathKeypad />
            </div>
        </FontDataContext.Provider>
    );
};

export default EditorPage;
