import {hot} from "react-hot-loader/root";
import * as React from "react";

const {useState} = React;

import MathKeypad from "./components/math-keypad";
import MathEditor from "./components/math-editor";
import * as Editor from "./editor/editor";
import * as Lexer from "./editor/editor-lexer";
import {lex} from "./editor/editor-lexer";
import Parser from "./editor/editor-parser";
import StepChecker from "./step-checker/step-checker";
import Icon from "./components/icon";
import {isEqual} from "./editor/util";

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

enum StepState {
    Correct,
    Incorrect,
    Duplicate,
    Pending,
}

type Step = {
    state: StepState;
    value: Editor.Row<Editor.Glyph>;
};

enum ProblemState {
    InProgress,
    Complete,
}

// TODO: Create two modes: immediate and delayed
// - Immediate feedback will show whether the current step is
//   incorrect when the user submits it and will force the user to
//   correct the issue before proceeding.
// - Delayed feedback will conceal the correctness of each step
//   until the user submits their answer.
const App: React.SFC<{}> = () => {
    const [problemState, setProblemState] = useState(ProblemState.InProgress);
    const [steps, setSteps] = useState<Step[]>([
        {
            state: StepState.Correct,
            value: question,
        },
        {
            state: StepState.Duplicate,
            value: step1,
        },
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

            if (result.equivalent) {
                if (isEqual(next, answer)) {
                    setSteps([
                        ...steps.slice(0, -1),
                        {
                            ...steps[steps.length - 1],
                            state: StepState.Correct,
                        },
                    ]);
                    setProblemState(ProblemState.Complete);
                } else {
                    setSteps([
                        ...steps.slice(0, -1),
                        {
                            ...steps[steps.length - 1],
                            state: StepState.Correct,
                        },
                        {
                            ...steps[steps.length - 1],
                            state: StepState.Duplicate,
                        },
                    ]);
                }
            } else {
                setSteps([
                    ...steps.slice(0, -1),
                    {
                        ...steps[steps.length - 1],
                        state: StepState.Incorrect,
                    },
                ]);
            }
        }
    };

    const isComplete = problemState === ProblemState.Complete;

    return (
        <div style={{width: 800, margin: "auto"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
                <MathEditor
                    key={`question`}
                    readonly={true}
                    value={steps[0].value}
                    focus={false}
                    style={{marginTop: 8}}
                />
                {steps.slice(1).flatMap((step, index) => {
                    const isLast = index !== steps.length - 2;
                    const isPending = step.state !== StepState.Pending;
                    let buttonOrIcon = (
                        <button
                            style={{
                                fontSize: 30,
                                borderRadius: 4,
                            }}
                            onClick={() =>
                                handleCheckStep(
                                    steps[index].value,
                                    steps[index + 1].value,
                                )
                            }
                            disabled={isLast || isPending || isComplete}
                        >
                            Check
                        </button>
                    );
                    if (step.state === StepState.Incorrect) {
                        buttonOrIcon = <Icon name="incorrect" size={48} />;
                    } else if (step.state === StepState.Correct) {
                        buttonOrIcon = <Icon name="correct" size={48} />;
                    }
                    return (
                        <div
                            key={`step-${index}`}
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                position: "relative",
                                marginTop: 8,
                            }}
                        >
                            <MathEditor
                                readonly={
                                    index !== steps.length - 2 || isComplete
                                }
                                value={step.value}
                                focus={index === steps.length - 2}
                                onSubmit={() => {
                                    handleCheckStep(
                                        steps[index].value,
                                        steps[index + 1].value,
                                    );
                                }}
                                onChange={(value: Editor.Row<Editor.Glyph>) => {
                                    const state = isEqual(
                                        steps[index].value,
                                        value,
                                    )
                                        ? StepState.Duplicate
                                        : StepState.Pending;
                                    setSteps([
                                        ...steps.slice(0, -1),
                                        {
                                            state,
                                            value,
                                        },
                                    ]);
                                }}
                                style={{flexGrow: 1}}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                }}
                            >
                                <div
                                    style={{
                                        marginLeft: 8,
                                        position: "absolute",
                                        left: 800,
                                    }}
                                >
                                    {buttonOrIcon}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {/* <MathEditor
                    readonly={true}
                    value={answer}
                    style={{marginTop: 8}}
                /> */}
            </div>
            {isComplete && (
                <h1 style={{fontFamily: "sans-serif"}}>Good work!</h1>
            )}
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
};

export default hot(App);
