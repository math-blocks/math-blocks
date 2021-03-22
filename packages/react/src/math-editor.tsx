import * as React from "react";

import * as Editor from "@math-blocks/editor-core";
import {typesetZipper} from "@math-blocks/typesetter";
import {FontMetricsContext} from "@math-blocks/metrics";

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

    onSubmit?: (value: Editor.types.Row) => unknown;
    onChange?: (value: Editor.types.Row) => unknown;

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
    const fontMetrics = useContext(FontMetricsContext);

    useEffect(() => {
        if (props.focus && containerRef.current) {
            containerRef.current.focus();
        }
    }, ["hot"]);

    // update state to match props
    if (!props.focus && active) {
        setActive(false);
    }

    useEventListener("keydown", (e: KeyboardEvent) => {
        if (active && !props.readonly) {
            const action = {
                type: e.key,
                shift: e.shiftKey,
            };
            if (e.key === "Enter" && props.onSubmit) {
                // TODO: submit all rows
                const success = props.onSubmit(Editor.zipperToRow(zipper));
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
                    props.onChange(Editor.zipperToRow(value));
                }
            }
        }
    });

    const {style} = props;

    const fontSize = 64;
    const context = {
        fontMetrics: fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        colorMap: props.colorMap,
    };

    const options = {showCursor: active};

    const scene = typesetZipper(zipper, context, options);

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
};

export default MathEditor;
