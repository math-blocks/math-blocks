import {hot} from "react-hot-loader/root";
import * as React from "react";
import {useSelector, useDispatch} from "react-redux";

import {MathKeypad, ZipperEditor} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor-core";

// TODO: rename Step to StepChecker and StepCheckerPage to Grader
import Step from "./step";
import {getPairs} from "./util";
import {State, ProblemStatus, StepStatus} from "./reducer";
import {Dispatch} from "./store";
import {HStack, VStack} from "./layout";

const {useState} = React;

// TODO: Create two modes: immediate and delayed
// - Immediate feedback will show whether the current step is
//   incorrect when the user submits it and will force the user to
//   correct the issue before proceeding.
// - Delayed feedback will conceal the correctness of each step
//   until the user submits their answer.
const Tutor: React.FunctionComponent = () => {
    const [mode, setMode] = useState<"edit" | "solve">("solve");

    const state = useSelector<State, State>((state) => state);
    const dispatch: Dispatch = useDispatch();

    const isComplete = state.status === ProblemStatus.Complete;
    const pairs = getPairs(state.steps);

    const zipper: Editor.Zipper = {
        breadcrumbs: [],
        row: {
            id: state.steps[0].value.id,
            type: "zrow",
            left: [],
            selection: null,
            right: state.steps[0].value.children,
        },
    };

    return (
        <div style={{margin: "auto"}}>
            <VStack>
                <HStack>
                    <ZipperEditor
                        key={`question`}
                        readonly={false}
                        zipper={zipper}
                        stepChecker={true}
                        focus={mode === "edit"}
                        style={{marginTop: 8, flexGrow: 1}}
                        onChange={(value: Editor.types.Row) => {
                            dispatch({
                                type: "set",
                                steps: [
                                    {
                                        status: StepStatus.Correct,
                                        value: value,
                                        hint: "none",
                                    },
                                ],
                            });
                        }}
                    />
                    <div style={{width: 200, marginLeft: 8}} />
                </HStack>
                {pairs.map(([prevStep, step], index) => {
                    const isLast = index === pairs.length - 1;

                    return (
                        <Step
                            key={`step-${index}`}
                            focus={isLast && mode === "solve"}
                            readonly={!isLast || isComplete}
                            prevStep={prevStep}
                            step={step}
                            onChange={(value: Editor.types.Row) => {
                                dispatch({type: "update", value});
                            }}
                        />
                    );
                })}
            </VStack>
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
                            dispatch({
                                type: "set",
                                steps: [state.steps[0]],
                            });
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
                            dispatch({type: "duplicate"});
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

export default hot(Tutor);
