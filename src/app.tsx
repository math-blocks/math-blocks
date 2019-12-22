import * as React from "react";

const {useState} = React;

import MathKeypad from "./components/math-keypad";
import MathEditor from "./components/math-editor";
import * as Editor from "./editor/editor";
import * as Lexer from "./editor/editor-lexer";
import {lex} from "./editor/editor-lexer";
import Parser from "./editor/editor-parser";
import StepChecker from "./step-checker/step-checker";

const checker = new StepChecker();

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

const App: React.SFC<{}> = () => {
    const [steps, setSteps] = useState<Editor.Row<Editor.Glyph>[]>([
        question,
        step1,
    ]);

    const handleCheckStep = (
        prev: Editor.Row<Editor.Glyph>,
        next: Editor.Row<Editor.Glyph>,
    ): void => {
        const prevTokens: Editor.Node<Lexer.Token> = lex(prev);
        const nextTokens: Editor.Node<Lexer.Token> = lex(next);

        if (prevTokens.type === "row" && nextTokens.type === "row") {
            const result = checker.checkStep(
                Parser.parse(prevTokens.children),
                Parser.parse(nextTokens.children),
                [],
            );
            console.log(result);
            console.log(Parser.parse(prevTokens.children));
            console.log(Parser.parse(nextTokens.children));
            if (result.equivalent) {
                setSteps([...steps, steps[steps.length - 1]]);
            }
        }
    };

    return (
        <div style={{width: 800, margin: "auto"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
                <MathEditor
                    key={`question`}
                    readonly={true}
                    value={steps[0]}
                    focus={false}
                    onSubmit={(value: Editor.Row<Editor.Glyph>) => {
                        console.log(value);
                        setSteps([...steps, value]);
                    }}
                    style={{marginTop: 8}}
                />
                {steps.slice(1).flatMap((step, index) => {
                    return (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                            }}
                        >
                            <MathEditor
                                key={`step-${index}`}
                                readonly={false}
                                value={step}
                                focus={index === steps.length - 2}
                                onSubmit={(value: Editor.Row<Editor.Glyph>) => {
                                    setSteps([...steps, value]);
                                }}
                                onChange={(value: Editor.Row<Editor.Glyph>) => {
                                    setSteps([...steps.slice(0, -1), value]);
                                }}
                                style={{marginTop: 8, flexGrow: 1}}
                            />
                            <button
                                style={{
                                    marginTop: 8,
                                    marginLeft: 8,
                                    fontSize: 30,
                                    borderRadius: 4,
                                }}
                                onClick={() =>
                                    handleCheckStep(
                                        steps[index],
                                        steps[index + 1],
                                    )
                                }
                            >
                                Check
                            </button>
                        </div>
                    );
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
