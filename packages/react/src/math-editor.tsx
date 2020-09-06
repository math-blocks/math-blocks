// @flow
import * as React from "react";
import {css, StyleSheet} from "aphrodite";

import * as Editor from "@math-blocks/editor";
import * as Typesetter from "@math-blocks/typesetter";

import fontMetrics from "@math-blocks/metrics";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

const {useEffect, useState, useRef} = React;

type ID = {
    id: number;
};

// TODO: dedupe with typeset.ts
type Below = {
    lhs: Editor.Row<Editor.Glyph, ID>;
    rhs: Editor.Row<Editor.Glyph, ID>;
};

type Props = {
    /**
     * value
     */
    value: Editor.Row<Editor.Glyph, ID>;

    /**
     * showing work below
     */
    below?: Below;

    readonly: boolean;

    // TODO: figure out a better way of handling focus
    focus?: boolean;

    onSubmit?: (value: Editor.Row<Editor.Glyph, ID>) => unknown;
    onChange?: (value: Editor.Row<Editor.Glyph, ID>) => unknown;

    /**
     * Style
     */
    style?: React.CSSProperties;
};

export const MathEditor: React.SFC<Props> = (props: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState<boolean>(false);
    const [state, setState] = useState<Editor.State>({
        above: {
            math: props.value,
            cursor: {
                path: [],
                prev: -Infinity,
                next: 0,
            },
            selectionStart: undefined,
            cancelRegions: [],
        },
        below: {},
        mode: "above",
    });
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
                const success = props.onSubmit(state.above.math);
                if (success) {
                    setActive(false);
                }
            } else {
                const value = Editor.reducer(state, action);
                setState(value);
                if (
                    props.onChange &&
                    e.keyCode !== 37 &&
                    e.keyCode !== 38 &&
                    e.keyCode !== 39 &&
                    e.keyCode !== 40
                ) {
                    props.onChange(value.above.math);
                }
            }
        }
    });

    const {math, cancelRegions} = state.above;
    const {style, below} = props;

    const fontSize = 64;
    // $FlowFixMe: make typeset return a Box
    const box = Typesetter.typeset(
        math,
        {
            fontMetrics,
            baseFontSize: fontSize,
            multiplier: 1.0,
            cramped: false,
        },
        below,
    ) as Typesetter.Layout.Box;

    const layoutCursor = Editor.layoutCursorFromState(state.above);
    console.log(layoutCursor);

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
            <MathRenderer
                box={box}
                cursor={active ? layoutCursor : undefined}
                editorCursor={state.above.cursor}
                cancelRegions={cancelRegions}
            />
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
