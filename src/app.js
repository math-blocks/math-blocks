// @flow
import * as React from "react";
import {css} from "aphrodite";

const {useState} = React;

import MathKeypad from "./math-keypad";
import MathEditor from "./math-editor";
import * as Editor from "./editor.js";
const {row, glyph, frac} = Editor;

const question: Editor.Row<Editor.Glyph> = row([
    glyph("2"),
    glyph("x"),
    glyph("+"),
    glyph("5"),
    glyph("="),
    glyph("1"),
    glyph("0"),
]);

const step1: Editor.Row<Editor.Glyph> = row([
    glyph("2"),
    glyph("x"),
    glyph("+"),
    glyph("5"),
    glyph("="),
    glyph("1"),
    glyph("0"),
]);

const answer: Editor.Row<Editor.Glyph> = row([
    glyph("x"),
    glyph("="),
    frac([glyph("5")], [glyph("2")]),
]);

const App = () => {
    const [steps, setSteps] = useState([question, step1]);

    return (
        <div style={{width: 800, margin: "auto"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
                {steps.flatMap((step, index) => {
                    return [
                        <MathEditor
                            key={`step-${index}`}
                            readonly={index === 0}
                            value={step}
                            focus={index === steps.length - 1}
                            onSubmit={(value: Editor.Row<Editor.Glyph>) => {
                                console.log(value);
                                setSteps([...steps, value]);
                            }}
                            style={{marginTop: 8}}
                        />,
                    ];
                })}
                <MathEditor
                    readonly={true}
                    value={answer}
                    onSubmit={(value: Editor.Row<Editor.Glyph>) => {
                        console.log(value);
                        setSteps([...steps, value]);
                    }}
                    style={{marginTop: 8}}
                />
            </div>

            <MathKeypad />
        </div>
    );
};

export default App;
