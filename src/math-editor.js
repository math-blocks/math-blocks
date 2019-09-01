// @flow
import * as React from "react";
import {useSelector, useDispatch} from "react-redux";

import {type Box} from "./layout";
import typeset from "./typeset";
import fontMetrics from "../metrics/comic-sans.json";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

import {type Dispatch} from "./reducer";

const MathEditor = () => {
  const math = useSelector(state => state.math);
  const cursor = useSelector(state => state.cursor);
  const dispatch = useDispatch<Dispatch>();

  console.log(math);

  useEventListener("keydown", (e: KeyboardEvent) => {
    console.log(e.key);
    dispatch({
      type: e.key,
    });
  });

  const fontSize = 64;
  // $FlowFixMe: make typeset return a Box
  const box = (typeset(fontMetrics)(fontSize)(1.0)(math): Box);

  return <MathRenderer box={box} cursor={cursor} />;
}

export default MathEditor;
