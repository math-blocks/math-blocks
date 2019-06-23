import * as React from "react";
import * as ReactDOM from "react-dom";

import MathEditor from "./math-editor";

const container = document.createElement("div");
document.body.appendChild(container);

ReactDOM.render(<div>
  <h1>Hello, world!</h1>
  <MathEditor />
</div>, container);
