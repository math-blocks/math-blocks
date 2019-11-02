// @flow
import * as React from "react";
import {css, StyleSheet} from "aphrodite";
import {useSelector, useDispatch} from "react-redux";

import {type Box} from "./layout";
import typeset from "./typeset";
import fontMetrics from "../metrics/comic-sans.json";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

import * as Editor from "./editor.js";
const {row, glyph, frac} = Editor;
const {useEffect, useState, useRef} = React;

import {type Dispatch, type State} from "./reducer";
import reducer from "./reducer.js";

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
            path: [props.value.id],
            prev: null,
            next: props.value.children[0].id,
        },
    });
    const dispatch = useDispatch<Dispatch>();
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
            console.log(e.key);
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

    return (
        <div
            tabIndex={!props.readonly ? 0 : undefined}
            ref={containerRef}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            className={css(styles.container)}
            style={style}
        >
            <MathRenderer box={box} cursor={active ? cursor : null} />
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
