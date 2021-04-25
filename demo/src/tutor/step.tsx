import * as React from "react";
import {useDispatch} from "react-redux";

import * as Editor from "@math-blocks/editor-core";
import {MathEditor} from "@math-blocks/react";
import {
    MistakeId,
    Mistake,
    checkStep,
    replaceNodeWithId,
} from "@math-blocks/grader";
import * as Semantic from "@math-blocks/semantic";
import {applyStep} from "@math-blocks/step-utils";
import {solve} from "@math-blocks/solver";

import Icon from "./icon";
import {Step as _Step, StepStatus} from "./reducer";
import {HStack, VStack} from "./layout";
import {Dispatch} from "./store";

type Props = {
    readonly: boolean;

    prevStep: _Step;
    step: _Step;

    onChange: (value: Editor.Zipper) => unknown;
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

// TODO: dedupe with Location in editor-parser
type Location = {
    path: readonly number[];
    start: number;
    end: number;
};

// TODO: dedupe with locFromRange in editor-parser
const mergeLocation = (start: Location, end: Location): Location => {
    // TODO: assert start.path === end.path
    return {
        path: start.path,
        start: start.start,
        end: end.end,
    };
};

const findParent = (
    root: Semantic.types.Node,
    node: Semantic.types.Node,
): Semantic.types.Node | undefined => {
    const stack: Semantic.types.Node[] = [];
    let result: Semantic.types.Node | undefined = undefined;

    // traverse needs enter and exit semantics so that we can push/pop items
    // from the stack.
    Semantic.util.traverse(root, {
        enter: (n) => {
            if (n === node) {
                result = stack[stack.length - 1];
            }
            stack.push(n);
        },
        exit: (n) => {
            stack.pop();
        },
    });

    return result;
};

const colorLocation = (
    editorRoot: Editor.types.Row,
    loc: Location,
    colorMap: Map<number, string>,
): void => {
    const editNode = Editor.util.nodeAtPath(editorRoot, loc.path);
    if (editNode && Editor.util.hasChildren(editNode)) {
        for (let i = loc.start; i < loc.end; i++) {
            colorMap.set(editNode.children[i].id, "darkCyan");
        }
    }
};

const highlightMistake = (
    editorRoot: Editor.types.Row,
    semanticRoot: Semantic.types.Node,
    mistake: Mistake,
    colorMap: Map<number, string>,
): void => {
    // It's possible that nodes for given mistake may have different parent
    // nodes.  This map is used only for nodes that are children of 'add' or
    // 'mul'.
    const entriesByParentId = new Map<number, [number, Location][]>();

    for (const node of mistake.nextNodes) {
        // There's no gaurantee that the nodes come in ascending order so let's
        // order them first
        if (node.loc) {
            const parentNode = findParent(semanticRoot, node);
            if (
                parentNode &&
                (parentNode.type === "add" || parentNode.type === "mul")
            ) {
                const index = parentNode.args.indexOf(
                    node as Semantic.types.NumericNode,
                );
                if (parentNode) {
                    if (entriesByParentId.has(parentNode.id)) {
                        entriesByParentId
                            .get(parentNode.id)
                            ?.push([index, node.loc]);
                    } else {
                        entriesByParentId.set(parentNode.id, [
                            [index, node.loc],
                        ]);
                    }
                }
            } else {
                // If the parent isn't an 'add' or 'mul' we color it immediately
                colorLocation(editorRoot, node.loc, colorMap);
            }
        }
    }

    for (const childEntries of entriesByParentId.values()) {
        const sortedEntries = childEntries.sort((a, b) => a[0] - b[0]);
        let prevIndex = sortedEntries[0][0];
        let loc = sortedEntries[0][1];

        for (let i = 1; i < sortedEntries.length; i++) {
            const index = sortedEntries[i][0];
            if (index > prevIndex + 1) {
                colorLocation(editorRoot, loc, colorMap);
                loc = sortedEntries[i][1];
            } else {
                loc = mergeLocation(loc, sortedEntries[i][1]);
            }
            prevIndex = index;
        }

        colorLocation(editorRoot, loc, colorMap);
    }
};

const Step: React.FunctionComponent<Props> = (props) => {
    const {readonly, prevStep, step, onChange} = props;

    const dispatch: Dispatch = useDispatch();
    const parsedNextRef = React.useRef<Semantic.types.Node | null>(null);
    const [hint, setHint] = React.useState<"none" | "text" | "showme">("none");
    const [hintText, setHintText] = React.useState<string | null>(null);
    const [showed, setShowed] = React.useState<boolean>(false);

    const handleCheckStep = (): boolean => {
        const parsedPrev = Editor.parse(Editor.zipperToRow(prevStep.value));
        const parsedNext = Editor.parse(Editor.zipperToRow(step.value));

        parsedNextRef.current = parsedNext;

        const {result, mistakes} = checkStep(parsedPrev, parsedNext);

        if (result) {
            if (
                parsedNext.type === "eq" &&
                parsedNext.args[0].type === "identifier" &&
                Semantic.util.isNumber(parsedNext.args[1])
            ) {
                dispatch({type: "right", hint});
                dispatch({type: "complete"});
            } else {
                dispatch({type: "right", hint});
                dispatch({type: "duplicate"});
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
        }

        return false;
    };

    const handleGetHint = (): void => {
        // TODO: check that we're solving an equations
        const parsedPrev = Editor.parse(
            Editor.zipperToRow(prevStep.value),
        ) as Semantic.types.Eq;

        const solution = solve(parsedPrev, Semantic.builders.identifier("x"));

        if (solution && solution.substeps.length > 0) {
            // Grab the first step of the solution and apply it to the previous
            // math statement that the user has entered.
            const step = solution.substeps[0];

            // NOTE: Some steps will have their own sub-steps which we may want
            // to apply to help students better understand what the hint is doing.

            setHint("text");
            setHintText(step.message);
        } else {
            throw new Error("no solution");
        }
    };

    const handleShowMe = (): void => {
        // TODO: check that we're solving an equations
        const parsedPrev = Editor.parse(
            Editor.zipperToRow(prevStep.value),
        ) as Semantic.types.Eq;

        const solution = solve(parsedPrev, Semantic.builders.identifier("x"));

        if (solution && solution.substeps.length > 0) {
            // Grab the first step of the solution and apply it to the previous
            // math statement that the user has entered.
            const step = solution.substeps[0];
            const next = applyStep(parsedPrev, step);

            setHint("showme");
            setShowed(true);

            const row = Editor.print(next);
            const zipper: Editor.Zipper = {
                breadcrumbs: [],
                row: {
                    id: row.id,
                    type: "zrow",
                    left: [],
                    selection: null,
                    right: row.children,
                },
            };

            // NOTE: Some steps will have their own sub-steps which we may want
            // to apply to help students better understand what the hint is doing.
            dispatch({
                type: "update",
                value: zipper,
            });
        } else {
            throw new Error("no solution");
        }
    };

    let buttonsOrIcon = (
        <HStack>
            <button
                style={{fontSize: 30}}
                onClick={handleCheckStep}
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

    const colorMap = new Map<number, string>();

    if (step.status === StepStatus.Incorrect && parsedNextRef.current) {
        for (const mistake of step.mistakes) {
            highlightMistake(
                Editor.zipperToRow(step.value),
                parsedNextRef.current,
                mistake,
                colorMap,
            );
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
                const zipper: Editor.Zipper = {
                    breadcrumbs: [],
                    row: {
                        id: corrected.id,
                        type: "zrow",
                        left: [],
                        selection: null,
                        right: corrected.children,
                    },
                };

                dispatch({
                    type: "update",
                    value: zipper,
                });
            }
        }
    };

    const zipper: Editor.Zipper = step.value;

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
                    zipper={zipper}
                    stepChecker={true}
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
