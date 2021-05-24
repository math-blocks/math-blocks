import * as React from "react";
import cx from "classnames";

import * as Editor from "@math-blocks/editor-core";
import * as Typesetter from "@math-blocks/typesetter";

import {FontDataContext} from "./font-data-context";
import styles from "./editor.module.css";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

const {useState, useRef, useContext, useCallback} = React;

type Props = {
    // The initial value for the editor
    zipper: Editor.Zipper;
    readonly: boolean;
    fontSize?: number;
    radicalDegreeAlgorithm?: Typesetter.RadicalDegreeAlgorithm;

    onSubmit?: (zipper: Editor.Zipper) => unknown;
    onChange?: (zipper: Editor.Zipper) => unknown;

    /**
     * Style
     */
    style?: React.CSSProperties;

    stepChecker?: boolean;

    colorMap?: Map<number, string>;

    // Renders bounding boxes around each group and glyph.
    showHitboxes?: boolean;
};

export const MathEditor: React.FunctionComponent<Props> = (props: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState<boolean>(false);

    // In the future we may want to provide a way to set both the start and end
    // positions so that we set a starting selection.
    const [startZipper, setStartZipper] = useState<Editor.Zipper>(props.zipper);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [endZipper, setEndZipper] = useState<Editor.Zipper>(props.zipper);
    const [zipper, setZipper] = useState<Editor.Zipper>(props.zipper);
    const [mouseDown, setMouseDown] = useState<boolean>(false);

    const fontData = useContext(FontDataContext);
    const inputRef = useRef<HTMLInputElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const callback = useCallback(
        (e: KeyboardEvent): void => {
            console.log(e.key);

            if (active && !props.readonly) {
                const action = {
                    type: e.key,
                };
                if (e.key === "Enter" && props.onSubmit) {
                    // TODO: submit all rows
                    const success = props.onSubmit(zipper);
                    if (success) {
                        setActive(false);
                    }
                } else {
                    if (e.key === "Shift") {
                        // Start a selection
                        setEndZipper(startZipper);
                    } else if (
                        e.shiftKey &&
                        (e.key === "ArrowLeft" || e.key === "ArrowRight")
                    ) {
                        // Handle modifying the current selection.
                        const newEndZipper = Editor.zipperReducer(
                            startZipper,
                            action,
                            endZipper,
                        );
                        const selectionZipper = Editor.selectionZipperFromZippers(
                            startZipper,
                            newEndZipper,
                        );
                        if (selectionZipper) {
                            setZipper(selectionZipper);
                            setEndZipper(newEndZipper);
                        }
                    } else {
                        // Modify the content
                        const value: Editor.Zipper = Editor.zipperReducer(
                            zipper,
                            action,
                        );
                        setZipper(value);
                        // Always up the start position when not holding shift
                        setStartZipper(value);
                        if (
                            props.onChange &&
                            e.keyCode !== 37 &&
                            e.keyCode !== 38 &&
                            e.keyCode !== 39 &&
                            e.keyCode !== 40
                        ) {
                            // TODO: communicate all rows when sending this event
                            props.onChange(value);
                        }
                    }
                }

                // Prevent StoryBook from capturing '/' and shifting focus to
                // its search field.
                e.stopPropagation();
            }
        },
        [zipper, startZipper, endZipper, props, active],
    );

    useEventListener("keydown", callback);

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

        const row = Editor.zipperToRow(zipper);
        const newZipper = Editor.rowToZipper(row, intersections);

        if (newZipper) {
            if (select) {
                const selectionZipper = Editor.selectionZipperFromZippers(
                    startZipper,
                    newZipper,
                );
                if (selectionZipper) {
                    setEndZipper(newZipper);
                    setZipper(selectionZipper);
                }
            } else {
                setStartZipper(newZipper);
                setEndZipper(newZipper);
                setZipper(newZipper);
            }
        }
    };

    // We need to update the state.zipper when props.zipper changes otherwise
    // it looks like fast-refresh is broken.
    React.useEffect(() => {
        setZipper(props.zipper);
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

    const scene = Typesetter.typesetZipper(zipper, context, options);

    return (
        <div
            tabIndex={!props.readonly ? 0 : undefined}
            ref={containerRef}
            onClick={(e) => {
                inputRef?.current?.focus();
            }}
            onMouseDown={(e) => {
                setActive(true);
                setMouseDown(true);
                // prevent blurring the input
                e.preventDefault();
                positionCursor(e, e.shiftKey);
            }}
            onMouseMove={(e) => {
                if (mouseDown) {
                    positionCursor(e, true);
                }
            }}
            onMouseUp={(e) => {
                setMouseDown(false);
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
