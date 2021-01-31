import * as React from "react";
import {StyleSheet, css} from "aphrodite";

import {ZipperEditor, MathKeypad} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor-core";

// import EditingPanel from "./editing-panel";

const startingValue = Editor.util.row("2x+5=10");

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
        <ZipperEditor readonly={false} zipper={zipper} focus={true} />
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
