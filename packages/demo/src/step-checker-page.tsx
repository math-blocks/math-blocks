import {hot} from "react-hot-loader/root";
import * as React from "react";

const {useState} = React;

import {Icon, MathKeypad, MathEditor} from "@math-blocks/react";
import {parse} from "@math-blocks/editor-parser";
import * as Editor from "@math-blocks/editor";
import StepChecker from "@math-blocks/step-checker";
import * as Semantic from "@math-blocks/semantic";

const checker = new StepChecker();

type ID = {
    id: number;
};

const question: Editor.Row<Editor.Glyph, ID> = Editor.Util.row("2x+5=10");
const step1: Editor.Row<Editor.Glyph, ID> = Editor.Util.row("2x+5=10");

enum StepState {
    Correct,
    Incorrect,
    Duplicate,
    Pending,
}

type Step = {
    state: StepState;
    value: Editor.Row<Editor.Glyph, ID>;
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
export const App: React.SFC<{}> = () => {
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
        prev: Editor.Row<Editor.Glyph, ID>,
        next: Editor.Row<Editor.Glyph, ID>,
    ): boolean => {
        const result = checker.checkStep(parse(prev), parse(next), []);

        if (result.equivalent) {
            const semanticNext = parse(next);
            if (
                semanticNext.type === "eq" &&
                semanticNext.args[0].type === "identifier" &&
                Semantic.isNumber(semanticNext.args[1])
            ) {
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
            return true;
        } else {
            setSteps([
                ...steps.slice(0, -1),
                {
                    ...steps[steps.length - 1],
                    state: StepState.Incorrect,
                },
            ]);
        }

        return false;
    };

    const isComplete = problemState === ProblemState.Complete;

    return (
        <div style={{width: 800, margin: "auto"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
                <MathEditor
                    key={`question`}
                    readonly={true}
                    rows={[steps[0].value]}
                    stepChecker={true}
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
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
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
                                rows={[step.value]}
                                stepChecker={true}
                                focus={index === steps.length - 2}
                                onSubmit={() => {
                                    return handleCheckStep(
                                        steps[index].value,
                                        steps[index + 1].value,
                                    );
                                }}
                                onChange={(
                                    value: Editor.Row<Editor.Glyph, ID>,
                                ) => {
                                    const state = Editor.isEqual(
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
