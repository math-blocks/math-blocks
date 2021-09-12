import {hot} from "react-hot-loader/root";
import * as React from "react";

import {MathKeypad, MathEditor} from "@math-blocks/react";
import * as Editor from "@math-blocks/editor";
import {reducer, ProblemStatus} from "@math-blocks/tutor";

// TODO: rename Step to StepChecker and StepCheckerPage to Grader
import Step from "./step";
import {getPairs} from "./util";
import {initialState} from "./store";
import {HStack, VStack} from "./layout";

// TODO: Create two modes: immediate and delayed
// - Immediate feedback will show whether the current step is
//   incorrect when the user submits it and will force the user to
//   correct the issue before proceeding.
// - Delayed feedback will conceal the correctness of each step
//   until the user submits their answer.
const Tutor: React.FunctionComponent = () => {
    // const [mode, setMode] = React.useState<"edit" | "solve">("solve");
    const [state, dispatch] = React.useReducer(reducer, initialState);

    const isComplete = state.status === ProblemStatus.Complete;
    const pairs = getPairs(state.steps);

    const zipper: Editor.Zipper = state.steps[0].value;

    return (
        <HStack style={{margin: "auto"}}>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: 320,
                    marginRight: 32,
                }}
            >
                {/* {mode === "solve" && (
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
                )} */}
                <MathKeypad />
                <div style={{position: "fixed", bottom: 0, left: 0, margin: 4}}>
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
            <VStack style={{flexGrow: 1, height: "100vh", overflowY: "scroll"}}>
                <HStack>
                    <MathEditor
                        key={`question`}
                        readonly={false}
                        zipper={zipper}
                        stepChecker={true}
                        style={{marginTop: 8, flexGrow: 1}}
                    />
                    <div style={{width: 200, marginLeft: 8}} />
                </HStack>
                {pairs.map(([prevStep, step], index) => {
                    const isLast = index === pairs.length - 1;

                    return (
                        <Step
                            key={`step-${index}`}
                            // focus={isLast && mode === "solve"}
                            dispatch={dispatch}
                            readonly={!isLast || isComplete}
                            prevStep={prevStep}
                            step={step}
                            onChange={() => dispatch({type: "set_pending"})}
                        />
                    );
                })}
                {isComplete && (
                    <h1 style={{fontFamily: "sans-serif"}}>Good work!</h1>
                )}
            </VStack>
        </HStack>
    );
};

export default hot(Tutor);
