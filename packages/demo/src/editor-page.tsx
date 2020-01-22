import * as React from "react";

import {MathEditor, MathKeypad} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor";

const EditorPage: React.SFC<{}> = () => (
    <div>
        <MathEditor readonly={false} value={Editor.Util.row("2x+5=10")} />
        <div style={{position: "fixed", bottom: 0, left: 0}}>
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
