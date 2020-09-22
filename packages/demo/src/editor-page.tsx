import * as React from "react";

import {MathEditor, MathKeypad} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor";

import CancelButton from "./cancel-button";

const startingValue = Editor.Util.row(
    "\u00082x\u0008+\u00085\u0008\u0008=\u0008\u000810\u0008",
);
const emptyWork1 = Editor.Util.row(
    "\u0008\u0008\u0008\u0008\u0008\u0008\u0008\u0008",
);
const emptyWork2 = Editor.Util.row(
    "\u0008\u0008\u0008\u0008\u0008\u0008\u0008\u0008",
);

const value = Editor.Util.row("2x+5=\u0008\u000810");
const work = Editor.Util.row("\u0008\u0008\u00085\u0008\u0008-5");

const EditorPage: React.SFC<{}> = () => (
    <div>
        <MathEditor
            readonly={false}
            rows={[startingValue, emptyWork1, emptyWork2]}
            focus={true}
        />
        <div style={{position: "fixed", bottom: 0, left: 0}}>
            <CancelButton />
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
