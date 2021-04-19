import * as React from "react";

import {MathEditor, MathKeypad, FontDataContext} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor-core";
import {parse, getFontData} from "@math-blocks/opentype";

import type {Font} from "@math-blocks/opentype";

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
    const [font, setFont] = React.useState<Font | null>(null);

    React.useEffect(() => {
        const loadFont = async (): Promise<void> => {
            // const res = await fetch("/STIX2Math.otf");
            const res = await fetch("/latinmodern-math.otf");
            const blob = await res.blob();
            const font = await parse(blob);
            console.log(font);
            setFont(font);
        };

        loadFont();
    }, []);

    if (!font) {
        return null;
    }

    // const fontData = getFontData(font, "STIX2");
    const fontData = getFontData(font, "LM-Math");

    return (
        <FontDataContext.Provider value={fontData}>
            <MathEditor
                readonly={false}
                zipper={zipper}
                focus={true}
                onChange={(value) => {
                    console.log(value);
                }}
            />
            <div style={{position: "fixed", bottom: 0, left: 0}}>
                {/* <EditingPanel /> */}
                <div style={{height: 8}} />
                <MathKeypad />
            </div>
        </FontDataContext.Provider>
    );
};

export default EditorPage;
