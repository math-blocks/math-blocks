import * as React from "react";

import MathEditor from "./math-editor";
import MathKeypad from "./math-keypad";

type State = {
  callback: (char: string) => void,
};

class App extends React.Component<{}, State> {
  state = {
    callback: (char: string) => {},
  };

  render() {
    return <div>
      <MathEditor />
      <MathKeypad />
    </div>;
  }
}

export default App;
