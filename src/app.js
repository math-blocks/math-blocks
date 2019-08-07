// @flow
import * as React from "react";

import MathEditor from "./math-editor";
import MathKeypad from "./math-keypad";
import NewMathEditor from "./new-math-editor";

const App = () => {
  return <div>
    <NewMathEditor />
    {/* <MathEditor />
    <MathKeypad /> */}
  </div>;
}

export default App;
