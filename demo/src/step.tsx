import * as React from "react";
import {useDispatch} from "react-redux";

import * as Editor from "@math-blocks/editor";
import {parse} from "@math-blocks/editor-parser";
import {Icon, MathEditor} from "@math-blocks/react";
import {
    MistakeId,
    Mistake,
    checkStep,
    replaceNodeWithId,
} from "@math-blocks/step-checker";
import * as Semantic from "@math-blocks/semantic";

import {Step as _Step, StepStatus} from "./reducer";
import {HStack, VStack} from "./containers";
import {Dispatch} from "./store";

type Props = {
    focus: boolean;
    readonly: boolean;

    prevStep: _Step;
    step: _Step;

    onChange: (value: Editor.Row) => unknown;
};

const MistakeMessages: Record<MistakeId, string> = {
    [MistakeId.EQN_ADD_DIFF]: "different values were added to both sides",
    [MistakeId.EQN_MUL_DIFF]: "different values were multiplied on both sides",
    [MistakeId.EXPR_ADD_NON_IDENTITY]:
        "adding a non-identity valid is not allowed",
    [MistakeId.EXPR_MUL_NON_IDENTITY]:
        "multiplying a non-identity valid is not allowed",

    // TODO: handle subtraction
    [MistakeId.EVAL_ADD]: "addition is incorrect",
    // TODO: handle division
    [MistakeId.EVAL_MUL]: "multiplication is incorrect",
    [MistakeId.DECOMP_ADD]: "decomposition of addition is incorrect",
    [MistakeId.DECOMP_MUL]: "decomposition of multiplication is incorrect",
};

const Step: React.SFC<Props> = (props) => {
    const {focus, readonly, prevStep, step, onChange} = props;

    const dispatch: Dispatch = useDispatch();
    const parsedNextRef = React.useRef<Semantic.Types.Expression | null>(null);

    const handleCheckStep = (): boolean => {
        const prev = prevStep.value;
        const next = step.value;

        const parsedPrev = parse(prev);
        const parsedNext = parse(next);

        parsedNextRef.current = parsedNext;

        const {result, mistakes} = checkStep(parsedPrev, parsedNext);

        if (result) {
            if (
                parsedNext.type === "eq" &&
                parsedNext.args[0].type === "identifier" &&
                Semantic.isNumber(parsedNext.args[1])
            ) {
                dispatch({type: "right"});
                dispatch({type: "complete"});
            } else {
                dispatch({type: "right"});
                dispatch({type: "duplicate"});
            }
            return true;
        } else {
            dispatch({type: "wrong", mistakes});
        }

        return false;
    };

    let buttonOrIcon = (
        <button
            style={{
                fontSize: 30,
                borderRadius: 4,
            }}
            onClick={handleCheckStep}
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            disabled={step.status !== StepStatus.Pending}
        >
            Check
        </button>
    );
    if (step.status === StepStatus.Incorrect) {
        buttonOrIcon = <Icon name="incorrect" size={48} />;
    } else if (step.status === StepStatus.Correct) {
        buttonOrIcon = <Icon name="correct" size={48} />;
    }

    const colorMap = new Map<number, string>();

    if (step.status === StepStatus.Incorrect) {
        for (const mistake of step.mistakes) {
            // TODO: also highlight nodes from mistake.prevNodes
            for (const node of mistake.nextNodes) {
                if (node.loc) {
                    const editNode = Editor.Util.nodeAtPath(
                        step.value,
                        node.loc.path,
                    );
                    if (editNode && Editor.Util.hasChildren(editNode)) {
                        for (let i = node.loc.start; i < node.loc.end; i++) {
                            // NOTE: we shouldn't need this try-catch anymore
                            // since we filter out all nodes that aren't in
                            // next or prev.
                            try {
                                colorMap.set(
                                    editNode.children[i].id,
                                    "darkCyan",
                                );
                            } catch (e) {
                                // TODO: handle mistakes where the nodes are from the
                                // previous step.
                                // 2x + 5     = 10
                                // 2x + 5 - 5 = 10 - 5
                                // 2x         = 3
                                console.log(e);
                            }
                        }
                    }
                }
            }
        }
    }

    const correctMistake = (mistake: Mistake): void => {
        if (parsedNextRef.current) {
            for (const correction of mistake.corrections) {
                // TODO: return a new tree instead of mutating in place.
                // This currently isn't an issue since parsedNextRef.current
                // will be replaced with a newly parsed object next time we
                // press submit.
                replaceNodeWithId(
                    parsedNextRef.current,
                    correction.id,
                    correction.replacement,
                );
                const corrected = Editor.print(parsedNextRef.current);
                dispatch({
                    type: "update",
                    value: corrected,
                });
            }
        }
    };

    return (
        <VStack>
            <HStack
                style={{
                    position: "relative",
                    marginTop: 8,
                }}
            >
                <MathEditor
                    // HACK: whenever we apply a correction to a step, the value
                    // gets a new id.  Using that id as a the `key` will trigger
                    // a re-render.
                    key={step.value.id}
                    readonly={readonly}
                    rows={[step.value]}
                    stepChecker={true}
                    focus={focus}
                    onSubmit={handleCheckStep}
                    onChange={onChange}
                    style={{flexGrow: 1}}
                    colorMap={colorMap}
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
            {step.status === StepStatus.Incorrect &&
                step.mistakes.map((mistake, index) => {
                    return (
                        <HStack
                            key={`mistake=${index}`}
                            style={{fontFamily: "sans-serif", fontSize: 20}}
                        >
                            {MistakeMessages[mistake.id]}
                            {mistake.corrections.length > 0 && (
                                <button onClick={() => correctMistake(mistake)}>
                                    Correct the mistake for me
                                </button>
                            )}
                        </HStack>
                    );
                })}
        </VStack>
    );
};

export default Step;
