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

    onSubmit?: (zipper: Editor.Zipper) => unknown;
    onChange?: (zipper: Editor.Zipper) => unknown;

    /**
     * Style
     */
    style?: React.CSSProperties;

    stepChecker?: boolean;

    colorMap?: Map<number, string>;
};

export const MathEditor: React.FunctionComponent<Props> = (props: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState<boolean>(false);
    const [zipper, setZipper] = useState<Editor.Zipper>(props.zipper);
    const fontData = useContext(FontDataContext);
    const inputRef = useRef<HTMLInputElement>(null);

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

    const focusHandler = (): void => inputRef?.current?.focus();

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
    };

    const options = {showCursor: active};

    const scene = Typesetter.typesetZipper(zipper, context, options);

    return (
        <div
            tabIndex={!props.readonly ? 0 : undefined}
            ref={containerRef}
            onClick={focusHandler}
            onMouseDown={(e) => {
                setActive(true);
                // prevent blurring the input
                e.preventDefault();
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
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
            />
            <MathRenderer scene={scene} />
        </div>
    );
};

MathEditor.defaultProps = {
    style: {},
    fontSize: 64,
};

export default MathEditor;
