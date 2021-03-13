import * as React from "react";

import {
    ZipperEditor,
    MathKeypad,
    MathmlRenderer,
    MathRenderer,
} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor-core";
import {typesetZipper} from "@math-blocks/typesetter";
import fontMetrics from "@math-blocks/metrics";

// import EditingPanel from "./editing-panel";

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
    const [value, setValue] = React.useState(nestedFractions);
    let node = null;
    try {
        node = Editor.parse(value);
        console.log(node);
    } catch (e) {
        // drop the error
    }

    const fontSize = 64;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        colorMap: undefined,
    };

    const options = {showCursor: false};

    const scene = typesetZipper(zipper, context, options);

    return (
        <div>
            <div style={{display: "flex", alignItems: "center"}}>
                <ZipperEditor
                    readonly={false}
                    zipper={zipper}
                    focus={true}
                    onChange={(value) => {
                        // console.log(value);
                        setValue(value);
                    }}
                />
                <div style={{position: "relative"}}>
                    <MathRenderer scene={scene} />
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            transform:
                                "scale(1.13, 1.18) translate(25px, 12px)",
                        }}
                    >
                        <MathmlRenderer math={node} />
                    </div>
                </div>
            </div>
            <div style={{position: "fixed", bottom: 0, left: 0}}>
                {/* <EditingPanel /> */}
                <div style={{height: 8}} />
                <MathKeypad />
            </div>
        </div>
    );
};

export default EditorPage;
