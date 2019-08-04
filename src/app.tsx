import * as React from "react";
import {createStore} from "redux";
import {Provider} from "react-redux";

import MathEditor from "./math-editor";
import MathKeypad from "./math-keypad";
import NewMathEditor from "./new-math-editor";
import reducer from "./reducer";

type State = {
  callback: (char: string) => void,
};

const store = createStore(reducer);

class App extends React.Component<{}, State> {
  state = {
    callback: (char: string) => {},
  };

  render() {
    return <div>
      <Provider store={store}>
        <NewMathEditor />
        <MathEditor />
        <MathKeypad />
      </Provider>
    </div>;
  }
}

export default App;
