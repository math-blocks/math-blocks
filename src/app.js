// @flow
import * as React from "react";

import MathKeypad from "./math-keypad";
import MathEditor from "./math-editor";

const App = () => {
    return (
        <div>
            <MathEditor />
            <MathKeypad />
        </div>
    );
};

export default App;
