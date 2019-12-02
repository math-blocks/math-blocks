// @flow
import * as React from "react";
import {css, StyleSheet} from "aphrodite";

import {type Box} from "./layout";
import typeset from "./typeset";
import fontMetrics from "../metrics/comic-sans.json";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

import * as Editor from "./editor/editor.js";
const {row, glyph, frac} = Editor;
const {useEffect, useState, useRef} = React;

import reducer from "./editor/editor-reducer.js";

type Props = {
    value: Editor.Row<Editor.Glyph>,
    readonly: boolean,
    focus?: boolean,
    onSubmit?: (value: Editor.Row<Editor.Glyph>) => mixed,
    style: {[string]: any, ...},
};

const MathEditor = (props: Props) => {
    const containerRef = useRef(null);
    const [active, setActive] = useState<boolean>(false);
    const [state, setState] = useState({
        math: props.value,
        cursor: {
            path: [],
            prev: null,
            next: 0,
        },
    });
    useEffect(() => {
        if (props.focus && containerRef.current) {
            containerRef.current.focus();
        }
    }, []);

    useEventListener("keydown", (e: KeyboardEvent) => {
        if (active && !props.readonly) {
            const action = {
                type: e.key,
            };
            if (e.key === "Enter" && props.onSubmit) {
                props.onSubmit(state.math);
            }
            setState(reducer(state, action));
        }
    });

    const {math, cursor} = state;
    const {style} = props;

    const fontSize = 64;
    // $FlowFixMe: make typeset return a Box
    const box = (typeset(fontMetrics)(fontSize)(1.0)(math): Box);

    // TODO: find id of nodes from the cursor and create a cursor that contains ids
    // so that we can render the cursor properly.  The need for the change is that
    // typesetting introduces additional nodes so we can't rely on the position like
    // we did in the reducer.

    type LayoutCursor = {
        parent: number,
        prev: ?number,
        next: ?number,
    };

    const layoutCursor: LayoutCursor = {
        parent: Editor.nodeAtPath(math, cursor.path).id,
        prev:
            cursor.prev != null
                ? Editor.nodeAtPath(math, [...cursor.path, cursor.prev])?.id ??
                  null
                : null,
        next:
            cursor.next != null
                ? Editor.nodeAtPath(math, [...cursor.path, cursor.next])?.id ??
                  null
                : null,
    };

    return (
        <div
            tabIndex={!props.readonly ? 0 : undefined}
            ref={containerRef}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            className={css(styles.container)}
            style={style}
        >
            <MathRenderer box={box} cursor={active ? layoutCursor : null} />
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
            border: "solid 1px white",
        },
        lineHeight: 0,
    },
});

export default MathEditor;
