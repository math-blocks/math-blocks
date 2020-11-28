import {hot} from "react-hot-loader/root";
import * as React from "react";

const {useState} = React;

import {MathKeypad, MathEditor} from "@math-blocks/react";
import {parse} from "@math-blocks/editor-parser";
import * as Editor from "@math-blocks/editor";
import {checkStep} from "@math-blocks/step-checker";
import * as Semantic from "@math-blocks/semantic";

// TODO: rename Step to StepChecker and StepCheckerPage to Grader
import Step from "./step";
import {getPairs} from "./util";
import {State, ProblemStatus, StepStatus, reducer} from "./reducer";

const question: Editor.Row = Editor.Util.row("2x+5=10");

// TODO: Create two modes: immediate and delayed
// - Immediate feedback will show whether the current step is
//   incorrect when the user submits it and will force the user to
//   correct the issue before proceeding.
// - Delayed feedback will conceal the correctness of each step
//   until the user submits their answer.
export const App: React.SFC<{}> = () => {
    const [mode, setMode] = useState<"edit" | "solve">("solve");
    const [state, setState] = useState<State>({
        steps: [
            {
                status: StepStatus.Correct,
                value: question,
            },
            {
                status: StepStatus.Duplicate,
                value: JSON.parse(JSON.stringify(question)),
            },
        ],
        status: ProblemStatus.Incomplete,
    });

    const handleCheckStep = (prev: Editor.Row, next: Editor.Row): boolean => {
        const parsedPrev = parse(prev);
        const parsedNext = parse(next);

        const {result, mistakes} = checkStep(parsedPrev, parsedNext);

        if (result) {
            if (
                parsedNext.type === "eq" &&
                parsedNext.args[0].type === "identifier" &&
                Semantic.isNumber(parsedNext.args[1])
            ) {
                // mark the last item right and the problem as complete
                setState(
                    reducer(reducer(state, {type: "right"}), {
                        type: "complete",
                    }),
                );
            } else {
                // mark the last item right and duplicate it
                setState(
                    reducer(reducer(state, {type: "right"}), {
                        type: "duplicate",
                    }),
                );
            }
            return true;
        } else {
            setState(reducer(state, {type: "wrong", mistakes}));
        }

        return false;
    };

    const isComplete = state.status === ProblemStatus.Complete;
    const pairs = getPairs(state.steps);

    return (
        <div style={{width: 800, margin: "auto"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
                <MathEditor
                    key={`question`}
                    readonly={false}
                    rows={[state.steps[0].value]}
                    stepChecker={true}
                    focus={mode === "edit"}
                    style={{marginTop: 8}}
                    onChange={(value: Editor.Row) => {
                        setState(
                            reducer(state, {
                                type: "set",
                                steps: [
                                    {
                                        status: StepStatus.Correct,
                                        value: value,
                                    },
                                ],
                            }),
                        );
                    }}
                />
                {pairs.map(([prevStep, step], index) => {
                    const isLast = index === pairs.length - 1;

                    return (
                        <Step
                            key={`step-${index}`}
                            focus={isLast && mode === "solve"}
                            readonly={!isLast || isComplete}
                            prevStep={prevStep}
                            step={step}
                            onSubmit={() => {
                                return handleCheckStep(
                                    state.steps[index].value,
                                    state.steps[index + 1].value,
                                );
                            }}
                            onChange={(value: Editor.Row) => {
                                setState(
                                    reducer(state, {type: "update", value}),
                                );
                            }}
                        />
                    );
                })}
            </div>
            {isComplete && (
                <h1 style={{fontFamily: "sans-serif"}}>Good work!</h1>
            )}
            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {mode === "solve" && (
                    <button
                        style={{height: 48, fontSize: 24}}
                        onClick={() => {
                            setMode("edit");
                            setState(
                                reducer(state, {
                                    type: "set",
                                    steps: [state.steps[0]],
                                }),
                            );
                        }}
                    >
                        Edit Question
                    </button>
                )}
                {mode === "edit" && (
                    <button
                        style={{height: 48, fontSize: 24}}
                        onClick={() => {
                            setMode("solve");
                            // get the ball rolling
                            setState(reducer(state, {type: "duplicate"}));
                        }}
                    >
                        Solve Question
                    </button>
                )}
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
