// @flow
import * as React from "react";
import {useSelector, useDispatch} from "react-redux";

import {type Box} from "./layout";
import typeset from "./typeset";
import fontMetrics from "../metrics/comic-sans.json";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

import * as Editor from "./editor.js";
const {row, glyph, frac} = Editor;
const {useState} = React;

import {type Dispatch, type State} from "./reducer";
import reducer from "./reducer.js";

type Props = {|
    value: Editor.Row<Editor.Glyph>,
    readonly: boolean,
    onSubmit?: (value: Editor.Row<Editor.Glyph>) => mixed,
|};

const MathEditor = (props: Props) => {
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

    const fontSize = 64;
    // $FlowFixMe: make typeset return a Box
    const box = (typeset(fontMetrics)(fontSize)(1.0)(math): Box);

    return (
        <div
            tabIndex={0}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            style={{display: "inline-block", border: "solid 1px gray"}}
        >
            <MathRenderer box={box} cursor={cursor} />
        </div>
    );
};

export default MathEditor;
