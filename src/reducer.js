// @flow
import {type Node, type Row} from "./editor-ast";
import {type EditorCursor} from "./editor";
import {getId} from "./unique-id";

export type State = {
  math: Row,
  cursor: EditorCursor,
};

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

const initialState: State = {
  math: root,
  cursor,
};

const reducer = (state: State = initialState, action: any) => {
  console.log(action);
  switch (action.type) {
    case "ArrowLeft":
      return state;
    case "ArrowRight":
      return state;
    default:
      return state;
  }
};

export default reducer;
