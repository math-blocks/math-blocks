import * as React from "react";
import * as Editor from "@math-blocks/editor";
import {Icon, MathEditor} from "@math-blocks/react";

import {StepType, StepState} from "./types";
import {HStack, VStack} from "./containers";

type ID = {
    id: number;
};

type EditorNode = Editor.Row<Editor.Glyph, ID>;

type Props = {
    focus: boolean;
    readonly: boolean;
    step: StepType;

    onSubmit: () => unknown;
    onChange: (value: EditorNode) => unknown;
};

const Step: React.SFC<Props> = (props) => {
    const {focus, readonly, step, onSubmit, onChange} = props;

    let buttonOrIcon = (
        <button
            style={{
                fontSize: 30,
                borderRadius: 4,
            }}
            onClick={onSubmit}
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            disabled={step.state !== StepState.Pending}
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
        <VStack>
            <HStack
                style={{
                    position: "relative",
                    marginTop: 8,
                }}
            >
                <MathEditor
                    readonly={readonly}
                    rows={[step.value]}
                    stepChecker={true}
                    focus={focus}
                    onSubmit={onSubmit}
                    onChange={onChange}
                    style={{flexGrow: 1}}
                />
                <VStack
                    style={{
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
                </VStack>
            </HStack>
            {step.state === StepState.Incorrect && step.mistake && (
                <span style={{fontFamily: "sans-serif", fontSize: 20}}>
                    {step.mistake.message}
                </span>
            )}
        </VStack>
    );
};

export default Step;
