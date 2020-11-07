import {hot} from "react-hot-loader/root";
import * as React from "react";

const {useState} = React;

import {MathKeypad, MathEditor} from "@math-blocks/react";
import {parse} from "@math-blocks/editor-parser";
import * as Editor from "@math-blocks/editor";
import StepChecker, {Context} from "@math-blocks/step-checker";
import * as Semantic from "@math-blocks/semantic";

import Step from "./step";
import {StepType, StepState} from "./types";

const checker = new StepChecker();

type ID = {
    id: number;
};

const question: Editor.Row<Editor.Glyph, ID> = Editor.Util.row("2x+5=10");

enum ProblemState {
    InProgress,
    Complete,
}

// Mistakes that appear earlier in this list are given priority.
const MISTAKE_MESSAGES = [
    // Equation mistakes
    "different values were added to both sides",
    "different values were multiplied on both sides",

    // Expression mistakes
    "adding a non-identity valid is not allowed",
    "multiplying a non-identity valid is not allowed",
];

// TODO: Create two modes: immediate and delayed
// - Immediate feedback will show whether the current step is
//   incorrect when the user submits it and will force the user to
//   correct the issue before proceeding.
// - Delayed feedback will conceal the correctness of each step
//   until the user submits their answer.
export const App: React.SFC<{}> = () => {
    const [mode, setMode] = useState<"edit" | "solve">("solve");
    const [problemState, setProblemState] = useState(ProblemState.InProgress);

    const [steps, setSteps] = useState<StepType[]>([
        {
            state: StepState.Correct,
            value: question,
        },
        {
            state: StepState.Duplicate,
            value: JSON.parse(JSON.stringify(question)),
        },
    ]);

    const handleCheckStep = (
        prev: Editor.Row<Editor.Glyph, ID>,
        next: Editor.Row<Editor.Glyph, ID>,
    ): boolean => {
        const context: Context = {
            checker,
            steps: [],
            successfulChecks: new Set<string>(),
            reversed: false,
            mistakes: [],
        };

        const result = checker.checkStep(parse(prev), parse(next), context);

        if (result) {
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
            if (context.mistakes.length > 0) {
                let mistake = context.mistakes[0];
                let index = MISTAKE_MESSAGES.indexOf(mistake.message);

                for (let i = 0; i < context.mistakes.length; i++) {
                    const currentMistake = context.mistakes[i];

                    if (
                        index > MISTAKE_MESSAGES.indexOf(currentMistake.message)
                    ) {
                        index = i;
                        mistake = currentMistake;
                    }
                }

                // TODO: figure out how to how report multiple mistakes
                console.log(mistake);

                setSteps([
                    ...steps.slice(0, -1),
                    {
                        ...steps[steps.length - 1],
                        state: StepState.Incorrect,
                        mistake: mistake,
                    },
                ]);
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

        return false;
    };

    const isComplete = problemState === ProblemState.Complete;

    return (
        <div style={{width: 800, margin: "auto"}}>
            <div style={{display: "flex", flexDirection: "column"}}>
                <MathEditor
                    key={`question`}
                    readonly={false}
                    rows={[steps[0].value]}
                    stepChecker={true}
                    focus={mode === "edit"}
                    style={{marginTop: 8}}
                    onChange={(value: Editor.Row<Editor.Glyph, ID>) => {
                        setSteps([
                            {
                                state: StepState.Correct,
                                value: value,
                            },
                            // {
                            //     state: StepState.Duplicate,
                            //     value: JSON.parse(JSON.stringify(value)),
                            // },
                        ]);
                    }}
                />
                {steps.slice(1).flatMap((step, index) => {
                    const isLast = index === steps.length - 2;

                    return (
                        <Step
                            key={`step-${index}`}
                            focus={isLast && mode === "solve"}
                            readonly={!isLast || isComplete}
                            step={step}
                            onSubmit={() => {
                                return handleCheckStep(
                                    steps[index].value,
                                    steps[index + 1].value,
                                );
                            }}
                            onChange={(value: Editor.Row<Editor.Glyph, ID>) => {
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
                            setSteps([steps[0]]);
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
                            setSteps([
                                steps[0],
                                {
                                    ...steps[0],
                                    state: StepState.Duplicate,
                                },
                            ]);
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
