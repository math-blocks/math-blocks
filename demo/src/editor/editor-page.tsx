import * as React from "react";

import {MathEditor, MathKeypad} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor-core";

import EditingPanel from "./editing-panel";

const startingValue = Editor.util.row(
    "\u00082x\u0008+\u00085\u0008\u0008=\u0008\u000810\u0008",
);

const EditorPage: React.FunctionComponent = () => (
    <div>
        <MathEditor readonly={false} rows={[startingValue]} focus={true} />
        <div style={{position: "fixed", bottom: 0, left: 0}}>
            <EditingPanel />
            <div style={{height: 8}} />
            <MathKeypad />
        </div>
        <div style={{position: "fixed", bottom: 0, right: 0, margin: 4}}>
            <div>
                Icons made by{" "}
                <a
                    href="https://www.flaticon.com/authors/pixel-perfect"
                    title="Pixel perfect"
                >
                    Pixel perfect
                </a>{" "}
                from{" "}
                <a href="https://www.flaticon.com/" title="Flaticon">
                    www.flaticon.com
                </a>
            </div>
        </div>
    </div>
);

export default EditorPage;
