// @flow
import * as React from "react";
import {css, StyleSheet} from "aphrodite";

import * as Editor from "@math-blocks/editor";
import * as Typesetter from "@math-blocks/typesetter";

import fontMetrics from "@math-blocks/metrics";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

const {useEffect, useState, useRef} = React;

type Row = Editor.Row<Editor.Glyph, {id: number}>;

// TODO: dedupe with typeset.ts
type Below = {
    lhs: Row;
    rhs: Row;
};

type Props = {
    rows: Row[];
    readonly: boolean;

    // TODO: figure out a better way of handling focus
    focus?: boolean;

    onSubmit?: (value: Row) => unknown;
    onChange?: (value: Row) => unknown;

    /**
     * Style
     */
    style?: React.CSSProperties;

    stepChecker?: boolean;
};

export const MathEditor: React.SFC<Props> = (props: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState<boolean>(false);
    const rows = props.rows.map((row) => ({
        math: row,
        cursor: {
            path: [],
            prev: -Infinity,
            next: 0,
        },
        selectionStart: undefined,
        cancelRegions: [],
    }));
    const [state, setState] = useState<Editor.State>({
        rows,
        rowIndex: 0,
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
                // TODO: submit all rows
                const success = props.onSubmit(state.rows[0].math);
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
                    // TODO: communicate all rows when sending this event
                    props.onChange(value.rows[0].math);
                }
            }
        }
    });

    const {cancelRegions} = state.rows[0];
    const {style} = props;

    const fontSize = 64;
    const context = {
        fontMetrics,
        baseFontSize: fontSize,
        multiplier: 1.0,
        cramped: false,
    };

    const box = props.stepChecker
        ? (Typesetter.typeset(state.rows[0].math, {
              fontMetrics,
              baseFontSize: fontSize,
              multiplier: 1.0,
              cramped: false,
          }) as Typesetter.Layout.Box) // TODO: make typeset return a Box
        : Typesetter.typesetWithWork(
              state.rows.map((row) => row.math),
              context,
          );

    const layoutCursor = Editor.layoutCursorFromState(
        state.rows[state.rowIndex],
    );
    console.log("cursor: ", state.rows[state.rowIndex].cursor);
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
