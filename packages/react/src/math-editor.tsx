import * as React from "react";

import * as Editor from "@math-blocks/editor-core";
import * as Typesetter from "@math-blocks/typesetter";

import {FontDataContext} from "./font-data-context";
import styles from "./editor.module.css";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

const {useEffect, useState, useRef, useContext} = React;

type Props = {
    // The initial value for the editor
    zipper: Editor.Zipper;
    readonly: boolean;

    // TODO: figure out a better way of handling focus
    focus?: boolean;
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

    useEffect(() => {
        if (props.focus && containerRef.current) {
            containerRef.current.focus();
        }
    }, [props.focus]);

    // update state to match props
    if (!props.focus && active) {
        setActive(false);
    }

    const callback = React.useCallback(
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

                // Prevent StoryBook from capturing '/' and shifting focus to its
                // search field.
                e.stopPropagation();
            }
        },
        [zipper, props, active],
    );

    useEventListener("keydown", callback);

    // We need to update the state.zipper when props.zipper changes otherwise
    // it looks like fast-refresh is broken.
    React.useEffect(() => {
        setZipper(props.zipper);
    }, [props.zipper]);

    const {style, fontSize} = props;

    const context: Typesetter.Context = {
        fontData: fontData,
        baseFontSize: fontSize,
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
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            className={styles.container}
            style={style}
            role="textbox"
        >
            <MathRenderer scene={scene} />
        </div>
    );
};

MathEditor.defaultProps = {
    style: {},
    fontSize: 64,
};

export default MathEditor;
