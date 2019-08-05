// @flow
import * as React from "react";

import MathRenderer from "./math-renderer";
import {type Box} from "./layout";
import {createEditor, type EditorCursor} from "./editor";
import {getId} from "./unique-id";
import {type Row, findNode} from "./editor-ast";
import typeset from "./typeset";
import fontMetrics from "../metrics/comic-sans.json";

type Props = {};

type State = {
  box: Box,
  root: Row,
  cursor: EditorCursor,
};

export default class MathEditor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const root: Row = {
      id: getId(),
      type: "row",
      children: [{
        id: getId(),
        type: "glyph",
        char: "1",
      }, {
        id: getId(),
        type: "glyph",
        char: "+",
      }, {
        id: getId(),
        type: "frac", 
        numerator: {
          id: getId(),
          type: "row",
          children: [{
            id: getId(),
            type: "glyph",
            char: "1",
          }],
        },
        denominator: {
          id: getId(),
          type: "row",
          children: [{
            id: getId(),
            type: "glyph",
            char: "2",
          }, {
            id: getId(),
            type: "glyph",
            char: "y",
          }],
        },
      }, {
        id: getId(),
        type: "glyph",
        char: "\u2212",
      }, {
        id: getId(),
        type: "glyph",
        char: "x",
      }],
    };
    
    const cursor: EditorCursor = {
      path: [root.id],
      prev: root.children[1].id,
      next: root.children[2].id,
    };

    const fontSize = 64;
    // $FlowFixMe: make typeset returrn a Box
    const box = (typeset(fontMetrics)(fontSize)(1.0)(root): Box);

    this.state = {cursor, box, root};
  }

  componentDidMount() {
    const {root, cursor} = this.state;
    createEditor(root, cursor, (cursor) => {
      const fontSize = 64;
      const box = typeset(fontMetrics)(fontSize)(1.0)(root);
  
      if (box.type === "Box") {
        this.setState({
          box,
          cursor,
        });
      }
    });
  }

  render() {
    const {box, cursor} = this.state;
    return <MathRenderer box={box} cursor={cursor} />
  }
}
