import * as React from "react";
import * as opentype from "opentype.js";

import {MathEditor, MathKeypad} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor-core";
import {FontMetricsContext, getFontMetrics} from "@math-blocks/metrics";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const simpleRow = Editor.util.row("2x+5=10");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const allNodeTypes = Editor.builders.row([
    Editor.builders.glyph("2"),
    Editor.builders.glyph("+"),
    Editor.builders.frac(
        [Editor.builders.glyph("1")],
        [
            Editor.builders.root(null, [
                Editor.builders.glyph("x"),
                Editor.builders.subsup(undefined, [Editor.builders.glyph("2")]),
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
            ]),
        ],
    ),
    Editor.builders.glyph("\u2212"),
    Editor.builders.glyph("\u2212"),
    Editor.builders.glyph("y"),
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
        id: nestedFractions.id,
        type: "zrow",
        left: [],
        selection: null,
        right: nestedFractions.children,
    },
};

const EditorPage: React.FunctionComponent = () => {
    const [font, setFont] = React.useState<opentype.Font | null>(null);

    React.useEffect(() => {
        opentype.load("/STIX2Math.otf", (err, font) => {
            if (font) {
                console.log(font);
                const A = font.glyphs.get(3);
                console.log(A.getMetrics());
                setFont(font);
            }
        });
    }, []);

    if (!font) {
        return null;
    }

    const fontMetrics = getFontMetrics(font);

    return (
        <FontMetricsContext.Provider value={fontMetrics}>
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
        </FontMetricsContext.Provider>
    );
};

export default EditorPage;
