import * as React from "react";
import {StyleSheet, css} from "aphrodite";

import {ZipperEditor, MathKeypad} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor-core";

// import EditingPanel from "./editing-panel";

// const startingValue = Editor.util.row("2x+5=10");
const startingValue = Editor.builders.row([
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

const zipper: Editor.Zipper = {
    path: [],
    row: {
        id: startingValue.id,
        type: "zrow",
        left: [],
        right: startingValue.children,
    },
};

const EditorPage: React.FunctionComponent = () => (
    <div>
        <ZipperEditor
            readonly={false}
            zipper={zipper}
            focus={true}
            onChange={(value) => {
                console.log(value);
            }}
        />
        <div style={{position: "fixed", bottom: 0, left: 0}}>
            {/* <EditingPanel /> */}
            <div className={css(styles.separator)} />
            <MathKeypad />
        </div>
    </div>
);

export default EditorPage;

const styles = StyleSheet.create({
    separator: {
        height: 8,
    },
});
