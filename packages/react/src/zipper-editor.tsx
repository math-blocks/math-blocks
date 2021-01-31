// @flow
import * as React from "react";
import {css, StyleSheet} from "aphrodite";

import * as Editor from "@math-blocks/editor-core";
import {typesetZipper} from "@math-blocks/typesetter";
import fontMetrics from "@math-blocks/metrics";

import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

const {useEffect, useState, useRef} = React;

type Props = {
    zipper: Editor.Zipper;
    readonly: boolean;

    // TODO: figure out a better way of handling focus
    focus?: boolean;

    onSubmit?: (value: Editor.Zipper) => unknown;
    onChange?: (value: Editor.Zipper) => unknown;

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
                const success = props.onSubmit(zipper);
                if (success) {
                    setActive(false);
                }
            } else {
                // TODO: create a zipper reducer
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
        }
    });

    const {style} = props;

    const fontSize = 64;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
        colorMap: props.colorMap,
    };

    const options = {};

    const scene = typesetZipper(zipper, context, options);

    return (
        <div
            tabIndex={!props.readonly ? 0 : undefined}
            ref={containerRef}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            className={css(styles.container)}
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

const styles = StyleSheet.create({
    container: {
        display: "inline-block",
        border: "solid 1px gray",
        outline: "none",
        borderRadius: 4,
        ":focus": {
            border: "solid 1px blue",
        },
        lineHeight: 0,
    },
});

export default MathEditor;
