import * as React from "react";
import cx from "classnames";

import * as Editor from "@math-blocks/editor";
import * as Typesetter from "@math-blocks/typesetter";

import {FontDataContext} from "./font-data-context";
import styles from "./editor.module.css";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

import type {EditingEvent} from "./math-keypad";

const {useEffect, useState, useRef, useContext, useCallback, useMemo} = React;

type Props = {
    // The initial value for the editor
    readonly zipper: Editor.Zipper;
    readonly readonly: boolean;
    readonly fontSize?: number;
    readonly radicalDegreeAlgorithm?: Typesetter.RadicalDegreeAlgorithm;

    readonly onSubmit?: (zipper: Editor.Zipper) => unknown;
    readonly onChange?: (zipper: Editor.Zipper) => unknown;

    /**
     * Style
     */
    readonly style?: React.CSSProperties;

    readonly stepChecker?: boolean;

    // Renders bounding boxes around each group and glyph.
    readonly showHitboxes?: boolean;
};

const keydownToAction = (key: string): Editor.Action | null => {
    switch (key) {
        case "(":
        case ")":
        case "[":
        case "]":
        case "{":
        case "}":
        case "|":
            return {type: "Parens", char: key};
        case "ArrowLeft":
            return {type: "ArrowLeft"};
        case "ArrowRight":
            return {type: "ArrowRight"};
        case "ArrowUp":
            return {type: "ArrowUp"};
        case "ArrowDown":
            return {type: "ArrowDown"};
        case "Backspace":
            return {type: "Backspace"};
        case "_":
            return {type: "Subscript"};
        case "^":
            return {type: "Superscript"};
        case "/":
            return {type: "Fraction"};
        case "\u221A":
            return {type: "Root"};
        case "*":
            return {type: "InsertChar", char: "\u00B7"};
        case "-":
            return {type: "InsertChar", char: "\u2212"};
        case "Shift":
            return {type: "StartSelecting"};
        default: {
            if (key.length === 1 && key.charCodeAt(0) > 32) {
                return {type: "InsertChar", char: key};
            }
        }
    }
    return null;
};

const keyupToAction = (key: string): Editor.Action | null => {
    switch (key) {
        case "Shift":
            return {type: "StopSelecting"};
        default:
            return null;
    }
};

export const MathEditor: React.FunctionComponent<Props> = (props: Props) => {
    const memoizedState = useMemo(
        () => Editor.stateFromZipper(props.zipper),
        [props.zipper],
    );

    const [state, dispatch] = React.useReducer(Editor.reducer, memoizedState);
    const [active, setActive] = useState<boolean>(false);
    const [mouseDown, setMouseDown] = useState<boolean>(false);

    const fontData = useContext(FontDataContext);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Call onChange whenever state changes
    const {onChange} = props;
    useEffect(() => {
        if (onChange) {
            console.log(state.zipper);
            onChange(state.zipper);
        }
    }, [onChange, state]);

    const handleKeydown = useCallback(
        (e: KeyboardEvent): void => {
            if (active && !props.readonly) {
                const action = keydownToAction(e.key);

                if (e.key === "Enter" && props.onSubmit) {
                    props.onSubmit(state.zipper);
                }

                if (action) {
                    dispatch(action);
                }

                // Prevent StoryBook from capturing '/' and shifting focus to
                // its search field.
                e.stopPropagation();
            }
        },
        [state, props, active],
    );

    const handleKeyUp = useCallback(
        (e: KeyboardEvent): void => {
            if (active && !props.readonly) {
                const action = keyupToAction(e.key);
                if (action) {
                    dispatch(action);
                }
            }
        },
        [props, dispatch, active],
    );

    useEventListener("keydown", handleKeydown);
    useEventListener("keyup", handleKeyUp);

    type FormattingEvent =
        | {
              type: "color";
              value: string;
          }
        | {
              type: "cancel";
          }
        | {
              type: "uncancel";
          };

    const handleFormatting = useCallback(
        (e: CustomEvent<FormattingEvent>): void => {
            if (!active || props.readonly) {
                return;
            }
            const {detail} = e;
            if (detail.type === "color") {
                dispatch({
                    type: "Color",
                    color: detail.value,
                });
            } else if (detail.type === "cancel") {
                dispatch({type: "Cancel"});
            } else if (detail.type === "uncancel") {
                dispatch({type: "Uncancel"});
            }
        },
        [dispatch, active, props.readonly],
    ) as EventListener;

    // TODO: don't add event listener to window otherwise this event will
    // affect multiple MathEditor instances
    useEffect(
        () => {
            // Add event listener
            window.addEventListener("formatting", handleFormatting);

            // Remove event listener on cleanup
            return () => {
                window.removeEventListener("formatting", handleFormatting);
            };
        },
        [handleFormatting], // Re-run if the handler changes
    );

    const handleEditing = useCallback(
        ({detail}: CustomEvent<EditingEvent>): void => {
            if (!active || props.readonly) {
                return;
            }
            dispatch(detail);
        },
        [dispatch, active, props.readonly],
    ) as EventListener;

    // TODO: don't add event listener to window otherwise this event will
    // affect multiple MathEditor instances
    useEffect(
        () => {
            // Add event listener
            window.addEventListener("editing", handleEditing);

            // Remove event listener on cleanup
            return () => {
                window.removeEventListener("editing", handleEditing);
            };
        },
        [handleEditing], // Re-run if the handler changes
    );

    const positionCursor = (e: React.MouseEvent, select: boolean): void => {
        if (!svgRef?.current) {
            return;
        }
        const bounds = svgRef.current.getBoundingClientRect();
        const point = {x: e.clientX - bounds.x, y: e.clientY - bounds.y};

        const intersections = Typesetter.SceneGraph.findIntersections(
            point,
            scene.hitboxes,
        );

        const row = Editor.zipperToRow(state.zipper);
        const cursorZipper = Editor.rowToZipper(row, intersections);

        if (cursorZipper) {
            dispatch(
                select ? {type: "StartSelecting"} : {type: "StopSelecting"},
            );
            dispatch({
                type: "PositionCursor",
                cursor: cursorZipper,
            });
        }
    };

    // We need to update the state.zipper when props.zipper changes otherwise
    // it looks like fast-refresh is broken.
    React.useEffect(() => {
        dispatch({type: "Update", value: props.zipper});
    }, [props.zipper]);

    const {style, fontSize, showHitboxes} = props;

    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize || 64,
        mathStyle: Typesetter.MathStyle.Display,
        cramped: false,
        renderMode: Typesetter.RenderMode.Dynamic,
        radicalDegreeAlgorithm: props.radicalDegreeAlgorithm,
    };

    const options = {showCursor: active, debug: true};

    const scene = Typesetter.typesetZipper(state.zipper, context, options);

    return (
        <div
            tabIndex={!props.readonly ? 0 : undefined}
            ref={containerRef}
            onClick={(e) => {
                inputRef?.current?.focus();
            }}
            onMouseDown={(e) => {
                e.preventDefault(); // prevent blurring the input
                setActive(true);
                setMouseDown(true);
                positionCursor(e, e.shiftKey);
            }}
            onMouseMove={(e) => {
                if (mouseDown) {
                    positionCursor(e, true);
                }
            }}
            onMouseUp={(e) => {
                setMouseDown(false);
                dispatch({type: "StopSelecting"});
            }}
            className={cx({[styles.container]: true, [styles.focus]: active})}
            style={style}
            role="textbox"
        >
            <input
                ref={inputRef}
                type="text"
                style={{
                    transform: "scale(0)",
                    width: 0,
                    height: 0,
                    margin: 0,
                    padding: 0,
                    border: "none",
                }}
                onBlur={() => setActive(false)}
                onFocus={() => setActive(true)}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
            />
            <MathRenderer
                scene={scene}
                ref={svgRef}
                showHitboxes={showHitboxes}
            />
        </div>
    );
};

MathEditor.defaultProps = {
    style: {},
    fontSize: 64,
};

export default MathEditor;
