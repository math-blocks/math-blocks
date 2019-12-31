// @flow
import * as React from "react";
import {css, StyleSheet} from "aphrodite";

import {Box} from "../typesetting/layout";
import typeset from "../typesetting/typeset";
import fontMetrics from "../../metrics/comic-sans.json";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";
import {State} from "../editor/editor-reducer";

import * as Editor from "../editor/editor";
const {useEffect, useState, useRef} = React;

import reducer from "../editor/editor-reducer";

type Props = {
    /**
     * value
     */
    value: Editor.Row<Editor.Glyph>;

    readonly: boolean;
    focus?: boolean;
    onSubmit?: (value: Editor.Row<Editor.Glyph>) => unknown;
    onChange?: (value: Editor.Row<Editor.Glyph>) => unknown;

    /**
     * Style
     */
    style?: React.CSSProperties;
};

type LayoutCursor = {
    parent: number;
    prev: number | null;
    next: number | null;
    selection: boolean;
};

const layoutCursorFromState = (state: State): LayoutCursor => {
    const {math, cursor, selectionStart} = state;
    const parentNode = Editor.nodeAtPath(math, cursor.path);

    if (!selectionStart) {
        return {
            parent: parentNode.id,
            prev: cursor.prev,
            next: cursor.next,
            selection: false,
        };
    } else {
        if (
            selectionStart.next != null &&
            selectionStart.next <= (cursor.prev || 0)
        ) {
            return {
                parent: parentNode.id,
                prev: selectionStart.prev,
                next: cursor.next,
                selection: true,
            };
        } else {
            return {
                parent: parentNode.id,
                prev: cursor.prev,
                next: selectionStart.next,
                selection: true,
            };
        }
    }
};

export const MathEditor: React.SFC<Props> = (props: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState<boolean>(false);
    const [state, setState] = useState<State>({
        math: props.value,
        cursor: {
            path: [],
            prev: null,
            next: 0,
        },
        selectionStart: null,
    });
    useEffect(() => {
        if (props.focus && containerRef.current) {
            containerRef.current.focus();
        }
    }, ["hot"]);

    useEventListener("keydown", (e: KeyboardEvent) => {
        if (active && !props.readonly) {
            const action = {
                type: e.key,
                shift: e.shiftKey,
            };
            if (e.key === "Enter" && props.onSubmit) {
                props.onSubmit(state.math);
                setActive(false);
            } else {
                const value = reducer(state, action);
                setState(value);
                if (
                    props.onChange &&
                    e.keyCode !== 37 &&
                    e.keyCode !== 38 &&
                    e.keyCode !== 39 &&
                    e.keyCode !== 40
                ) {
                    props.onChange(value.math);
                }
            }
        }
    });

    const {math} = state;
    const {style} = props;

    const fontSize = 64;
    // $FlowFixMe: make typeset return a Box
    const box = typeset(fontMetrics)(fontSize)(1.0)(math) as Box;

    const layoutCursor = layoutCursorFromState(state);

    return (
        <div
            tabIndex={!props.readonly ? 0 : undefined}
            ref={containerRef}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            className={css(styles.container)}
            style={style}
        >
            <MathRenderer
                box={box}
                cursor={active ? layoutCursor : undefined}
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
