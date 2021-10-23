import * as types from "../char/types";
import type {MatrixActions} from "../reducer/matrix";

export type Path = readonly number[];

export type Selection = {
    readonly anchor: {
        readonly path: Path;
        readonly offset: number;
    };
    readonly focus: {
        readonly path: Path;
        readonly offset: number;
    };
};

export type State = {
    readonly row: types.CharRow;
    readonly selecting: boolean;
    readonly selection: Selection;
};

export type Action =
    | {readonly type: "ArrowLeft"}
    | {readonly type: "ArrowRight"}
    | {readonly type: "ArrowUp"}
    | {readonly type: "ArrowDown"}
    | {readonly type: "Backspace"}
    | {readonly type: "Subscript"}
    | {readonly type: "Superscript"}
    | {
          readonly type: "Parens";
          readonly char: "(" | ")" | "[" | "]" | "{" | "}" | "|";
      }
    | {readonly type: "Fraction"}
    | {readonly type: "Root"} // TODO: add support for an index
    | {
          readonly type: "InsertChar";
          readonly char: string;
      }
    | {readonly type: "StartSelecting"}
    | {readonly type: "StopSelecting"}
    | {
          readonly type: "SetSelection";
          readonly selection: Selection;
      }
    // Formatting actions
    | {
          readonly type: "Color";
          readonly color: string;
      }
    | {readonly type: "Cancel"}
    | {readonly type: "Uncancel"}
    | MatrixActions;
