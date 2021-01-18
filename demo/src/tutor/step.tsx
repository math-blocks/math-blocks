import * as React from "react";
import {useDispatch} from "react-redux";

import * as Editor from "@math-blocks/editor-core";
import {Icon, MathEditor} from "@math-blocks/react";
import {
    MistakeId,
    Mistake,
    checkStep,
    replaceNodeWithId,
} from "@math-blocks/grader";
import {types, util} from "@math-blocks/semantic";

import {Step as _Step, StepStatus} from "./reducer";
import {HStack, VStack} from "./layout";
import {Dispatch} from "./store";

type Props = {
    focus: boolean;
    readonly: boolean;

    prevStep: _Step;
    step: _Step;

    onChange: (value: Editor.types.Row) => unknown;
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
    root: types.Node,
    node: types.Node,
): types.Node | undefined => {
    const stack: types.Node[] = [];
    let result: types.Node | undefined = undefined;

    // traverse needs enter and exit semantics so that we can push/pop items
    // from the stack.
    util.traverse(root, {
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
    semanticRoot: types.Node,
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
                    node as types.NumericNode,
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
    const {focus, readonly, prevStep, step, onChange} = props;

    const dispatch: Dispatch = useDispatch();
    const parsedNextRef = React.useRef<types.Node | null>(null);

    const handleCheckStep = (): boolean => {
        const prev = prevStep.value;
        const next = step.value;

        const parsedPrev = Editor.parse(prev);
        const parsedNext = Editor.parse(next);

        parsedNextRef.current = parsedNext;

        const {result, mistakes} = checkStep(parsedPrev, parsedNext);

        if (result) {
            if (
                parsedNext.type === "eq" &&
                parsedNext.args[0].type === "identifier" &&
                util.isNumber(parsedNext.args[1])
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

    if (step.status === StepStatus.Incorrect && parsedNextRef.current) {
        for (const mistake of step.mistakes) {
            highlightMistake(
                step.value,
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
