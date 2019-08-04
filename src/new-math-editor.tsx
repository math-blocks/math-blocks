import * as React from "react";
import {useStore, useDispatch} from "react-redux";

import {Box} from "./layout";
import typeset from "./typeset";
import fontMetrics from "../metrics/comic-sans.json";
import MathRenderer from "./math-renderer";
import useEventListener from "./use-event-listener";

const NewMathEditor = () => {
  const store = useStore();
  const dispatch = useDispatch();
  useEventListener("keydown", (e: KeyboardEvent) => {
    dispatch({
      type: e.key,
    });
  });

  const {math, cursor} = store.getState();

  const fontSize = 64;
  const box = typeset(fontMetrics)(fontSize)(1.0)(math) as Box;

  return <MathRenderer box={box} cursor={cursor} />;
}

export default NewMathEditor;
