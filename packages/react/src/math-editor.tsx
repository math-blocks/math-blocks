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
    debug?: boolean;
};

export const MathEditor: React.FunctionComponent<Props> = (props: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState<boolean>(false);
    const [zipper, setZipper] = useState<Editor.Zipper>(props.zipper);
    const fontData = useContext(FontDataContext);
    const inputRef = useRef<HTMLInputElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const callback = useCallback(
        (e: KeyboardEvent): void => {
            if (active && !props.readonly) {
                const action = {
                    type: e.key,
                    shift: e.shiftKey,
                };
                if (e.key === "Enter" && props.onSubmit) {
                    // TODO: submit all rows
                    const success = props.onSubmit(zipper);
                    if (success) {
                        setActive(false);
                    }
                } else {
                    const value: Editor.Zipper = Editor.zipperReducer(
                        zipper,
                        action,
                    );
                    setZipper(value);
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

                // Prevent StoryBook from capturing '/' and shifting focus to
                // its search field.
                e.stopPropagation();
            }
        },
        [zipper, props, active],
    );

    useEventListener("keydown", callback);

    const positionCursor = (e: React.MouseEvent): void => {
        if (!svgRef?.current) {
            return;
        }
        const bounds = svgRef.current.getBoundingClientRect();
        const point = {x: e.clientX - bounds.x, y: e.clientY - bounds.y};

        const intersections = Typesetter.SceneGraph.findIntersections(
            point,
            scene.hitboxes,
        );
        // put the node ids in the correct order to work with rowToZipper
        intersections.reverse();

        const row = Editor.zipperToRow(zipper);
        const newZipper = Editor.rowToZipper(row, intersections);
        if (newZipper) {
            setZipper(newZipper);
        }
    };

    // We need to update the state.zipper when props.zipper changes otherwise
    // it looks like fast-refresh is broken.
    React.useEffect(() => {
        setZipper(props.zipper);
    }, [props.zipper]);

    const {style, fontSize} = props;

    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize || 64,
        mathStyle: Typesetter.MathStyle.Display,
        cramped: false,
        colorMap: props.colorMap,
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
                // prevent blurring the input
                e.preventDefault();
                positionCursor(e);
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
            <MathRenderer scene={scene} ref={svgRef} />
        </div>
    );
};

MathEditor.defaultProps = {
    style: {},
    fontSize: 64,
};

export default MathEditor;
