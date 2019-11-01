// @flow
import * as React from "react";

const {useState} = React;

import MathKeypad from "./math-keypad";
import MathEditor from "./math-editor";
import * as Editor from "./editor.js";
const {row, glyph, frac} = Editor;

const value: Editor.Row<Editor.Glyph> = row([
    glyph("2"),
    glyph("x"),
    glyph("+"),
    glyph("5"),
    glyph("="),
    glyph("1"),
    glyph("0"),
]);

const App = () => {
    const [steps, setSteps] = useState([value]);

    return (
        <div style={{width: 800, margin: "auto"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
                {steps.map(step => (
                    <MathEditor
                        readonly={false}
                        value={step}
                        onSubmit={(value: Editor.Row<Editor.Glyph>) => {
                            console.log(value);
                            setSteps([...steps, value]);
                        }}
                    />
                ))}
            </div>
            <MathKeypad />
        </div>
    );
};

export default App;
