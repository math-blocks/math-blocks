import * as React from "react";

import {notEmpty} from "@math-blocks/core";
import * as Editor from "@math-blocks/editor";
import {MathEditor} from "@math-blocks/react";
import {
    MistakeId,
    Mistake,
    checkStep,
    replaceNodeWithId,
} from "@math-blocks/grader";
import * as Semantic from "@math-blocks/semantic";
import {getHint, showMeHow} from "@math-blocks/solver";
import {Step as _Step, StepStatus, Action} from "@math-blocks/tutor";

import Icon from "./icon";
import {HStack, VStack} from "./layout";

const {NodeType} = Semantic;

type Dispatch = (action: Action) => void;

type Props = {
    readonly readonly: boolean;

    readonly prevStep: _Step;
    readonly step: _Step;

    readonly onChange: (value: Editor.Zipper) => unknown;

    readonly dispatch: Dispatch;
};

const MistakeMessages: Record<MistakeId, string> = {
    [MistakeId.EQN_ADD_DIFF]: "different values were added to both sides",
    [MistakeId.EQN_MUL_DIFF]: "different values were multiplied on both sides",
    [MistakeId.EXPR_ADD_NON_IDENTITY]:
        "adding a non-identity valid is not allowed",
    [MistakeId.EXPR_MUL_NON_IDENTITY]:
        "multiplying a non-identity value is not allowed",

    // TODO: handle subtraction
    [MistakeId.EVAL_ADD]: "addition is incorrect",
    // TODO: handle division
    [MistakeId.EVAL_MUL]: "multiplication is incorrect",
    [MistakeId.DECOMP_ADD]: "decomposition of addition is incorrect",
    [MistakeId.DECOMP_MUL]: "decomposition of multiplication is incorrect",
};

const highlightMistakes = (
    zipper: Editor.Zipper,
    mistakes: readonly Mistake[],
    color: string,
): Editor.Zipper => {
    console.log("highlightMistakes");
    for (const mistake of mistakes) {
        let insideMistake = false;
        console.log(mistake);

        zipper = Editor.transforms.traverseZipper(
            zipper,
            {
                enter(node, path) {
                    if (path.length === 0) {
                        return;
                    }

                    for (const nextNode of mistake.nextNodes) {
                        const loc = nextNode.loc;
                        if (!loc) {
                            continue;
                        }
                        for (let i = loc.start; i < loc.end; i++) {
                            const nextNodePath = [...loc.path, i];
                            if (arrayEq(nextNodePath, path)) {
                                console.log("entering mistake");
                                insideMistake = true;
                                break;
                            }
                        }
                    }
                },
                exit(node, path) {
                    const highlight = insideMistake;

                    for (const nextNode of mistake.nextNodes) {
                        const loc = nextNode.loc;
                        if (!loc) {
                            continue;
                        }
                        for (let i = loc.start; i < loc.end; i++) {
                            const nextNodePath = [...loc.path, i];
                            if (arrayEq(nextNodePath, path)) {
                                console.log("leaving mistake");
                                insideMistake = false;
                                break;
                            }
                        }
                    }

                    if (highlight) {
                        return {
                            ...node,
                            style: {
                                ...node.style,
                                color: color,
                            },
                        };
                    }
                },
            },
            [],
        );
    }
    return zipper;
};

const removeAllColor = (zipper: Editor.Zipper): Editor.Zipper => {
    return Editor.transforms.traverseZipper(
        zipper,
        {
            exit(node) {
                if (node.style.color) {
                    const {color, ...restStyle} = node.style;
                    return {
                        ...node,
                        style: restStyle,
                    };
                }
            },
        },
        [],
    );
};

function arrayEq<T>(a: readonly T[], b: readonly T[]): boolean {
    return a.length === b.length && a.every((e, i) => e === b[i]);
}

const Step: React.FunctionComponent<Props> = (props) => {
    const {readonly, prevStep, step, onChange, dispatch} = props;

    const parsedNextRef = React.useRef<Semantic.types.Node | null>(null);
    const [hint, setHint] = React.useState<"none" | "text" | "showme">("none");
    const [hintText, setHintText] = React.useState<string | null>(null);
    const [showed, setShowed] = React.useState<boolean>(false);

    // This is only used when clicking the "Check" button since that button's click
    // handler doesn't have direct access to the current value of MathEditor's
    // zipper like "handleCheckStep" does.
    const [zipper, setZipper] = React.useState<Editor.Zipper>(step.value);

    const handleCheckStep = React.useCallback(
        (zipperForMathEditor: Editor.Zipper): boolean => {
            const zipper = removeAllColor(zipperForMathEditor);
            const parsedPrev = Editor.parse(Editor.zipperToRow(prevStep.value));
            const parsedNext = Editor.parse(Editor.zipperToRow(zipper));

            parsedNextRef.current = parsedNext;

            const {result, mistakes} = checkStep(parsedPrev, parsedNext);

            if (result) {
                // Clear any color highlights from a previously incorrect step
                if (zipper !== step.value) {
                    dispatch({type: "update", value: zipper});
                }

                if (
                    parsedNext.type === NodeType.Equals &&
                    parsedNext.args[0].type === NodeType.Identifier &&
                    Semantic.util.isNumber(parsedNext.args[1])
                ) {
                    dispatch({type: "right", hint});
                    dispatch({type: "complete"}); // the problem is completely finished
                } else if (
                    parsedNext.type === NodeType.VerticalAdditionToRelation
                ) {
                    if (parsedNext.resultingRelation) {
                        const resultingEquation = Semantic.builders.eq([
                            Semantic.builders.add(
                                parsedNext.resultingRelation.left.filter(
                                    notEmpty,
                                ),
                            ),
                            Semantic.builders.add(
                                parsedNext.resultingRelation.right.filter(
                                    notEmpty,
                                ),
                            ),
                        ]);
                        const charRow = Editor.print(resultingEquation, true);
                        const zipper: Editor.Zipper = {
                            breadcrumbs: [],
                            row: {
                                type: "zrow",
                                id: resultingEquation.id,
                                left: [],
                                selection: [],
                                right: charRow.children,
                                style: {},
                            },
                        };
                        dispatch({type: "right", hint});
                        dispatch({type: "new_step", value: zipper});
                    } else {
                        const editorState = Editor.zipperToState(zipper);
                        const newEditorState = Editor.reducer(editorState, {
                            type: "ArrowDown",
                        });
                        const newZipper = newEditorState.zipper;
                        dispatch({type: "update", value: newZipper});
                    }
                } else {
                    dispatch({type: "right", hint});
                    dispatch({type: "duplicate"}); // copy the last step
                }

                // Manually focus the last input which will trigger the last
                // MathEditor to become active.  We do this in a setTimeout to
                // allow the DOM to update.
                setTimeout(() => {
                    const inputs = document.querySelectorAll("input");
                    const lastInput = inputs[inputs.length - 1];
                    lastInput.focus();
                }, 0);

                return true;
            } else {
                dispatch({type: "wrong", mistakes});
                // TODO: highlight nodes in the previous step as well if they're listed in
                // mistakes[*].prevNodes.
                dispatch({
                    type: "update",
                    value: highlightMistakes(zipper, mistakes, "darkCyan"),
                });
            }

            return false;
        },
        [dispatch, hint, prevStep.value, step.value],
    );

    const handleGetHint = (): void => {
        const parsedPrev = Editor.parse(Editor.zipperToRow(prevStep.value));
        const hint = getHint(parsedPrev, Semantic.builders.identifier("x"));

        // NOTE: Some steps will have their own sub-steps which we may want
        // to apply to help students better understand what the hint is doing.
        setHint("text");
        setHintText(hint.message);
    };

    const handleShowMe = (): void => {
        // TODO: check that we're solving an equations
        const parsedPrev = Editor.parse(
            Editor.zipperToRow(prevStep.value),
        ) as Semantic.types.Eq;

        const next = showMeHow(parsedPrev, Semantic.builders.identifier("x"));

        setHint("showme");
        setShowed(true);

        const row = Editor.print(next);
        const zipper: Editor.Zipper = {
            breadcrumbs: [],
            row: {
                id: row.id,
                type: "zrow",
                left: [],
                selection: [],
                right: row.children,
                style: {},
            },
        };

        // NOTE: Some steps will have their own sub-steps which we may want
        // to apply to help students better understand what the hint is doing.
        dispatch({
            type: "update",
            value: zipper,
        });
    };

    const handleChange = (zipper: Editor.Zipper): void => {
        setZipper(zipper);
        onChange(zipper);
    };

    let buttonsOrIcon = (
        <HStack>
            <button
                style={{fontSize: 30}}
                onClick={() => handleCheckStep(zipper)}
                onMouseDown={(e) => {
                    // Prevent clicking the button from blurring the MathEditor
                    e.preventDefault();
                    e.stopPropagation();
                }}
                disabled={step.status !== StepStatus.Pending}
            >
                Check
            </button>
            <button
                style={{fontSize: 30}}
                // TODO: determine if we have a hint, before showing the "Hint" button
                onClick={handleGetHint}
                onMouseDown={(e) => {
                    // Prevent clicking the button from blurring the MathEditor
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                Hint
            </button>
        </HStack>
    );

    if (step.status === StepStatus.Incorrect) {
        buttonsOrIcon = (
            <HStack>
                <Icon name="incorrect" size={48} />
            </HStack>
        );
    } else if (step.status === StepStatus.Correct) {
        const {hint} = step;

        buttonsOrIcon = (
            <HStack>
                <Icon name="correct" size={48} />
                {(hint === "showme" || hint === "text") && (
                    <Icon name="hint" size={48} />
                )}
            </HStack>
        );
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
                const zipper: Editor.Zipper = {
                    breadcrumbs: [],
                    row: {
                        id: corrected.id,
                        type: "zrow",
                        left: [],
                        selection: [],
                        right: corrected.children,
                        style: {},
                    },
                };

                dispatch({
                    type: "update",
                    value: zipper,
                });
                dispatch({type: "set_pending"});
                setZipper(zipper); // update this value so that we can submit the new answer
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
                    readonly={readonly}
                    zipper={step.value}
                    stepChecker={true}
                    onSubmit={handleCheckStep}
                    onChange={handleChange}
                    style={{flexGrow: 1}}
                />
                <VStack
                    style={{
                        justifyContent: "center",
                    }}
                >
                    <div style={{width: 200, marginLeft: 8}}>
                        {buttonsOrIcon}
                    </div>
                </VStack>
            </HStack>
            {hintText && (
                <HStack
                    style={{
                        alignItems: "center",
                        fontSize: 20,
                        fontFamily: "sans-serif",
                    }}
                >
                    {hintText}
                    <button
                        disabled={showed}
                        style={{fontSize: 20}}
                        onClick={() => handleShowMe()}
                    >
                        Show me how!
                    </button>
                </HStack>
            )}
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
