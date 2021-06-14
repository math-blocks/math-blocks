import type {MatrixActions} from "./matrix";
import type {Zipper} from "./types";

export type Action =
    | {
          type: "ArrowLeft";
      }
    | {
          type: "ArrowRight";
      }
    | {
          type: "Backspace";
      }
    | {
          type: "Subscript";
      }
    | {
          type: "Superscript";
      }
    | {
          type: "Parens";
          char: "(" | ")" | "[" | "]" | "{" | "}";
      }
    | {
          type: "Fraction";
      }
    | {
          // TODO: add support for an index
          type: "Root";
      }
    | {
          type: "InsertChar";
          char: string;
      }
    | {
          type: "StartSelecting";
      }
    | {
          type: "StopSelecting";
      }
    | {
          type: "PositionCursor";
          cursor: Zipper;
      }
    // Formatting actions
    | {
          type: "Color";
          color: string;
      }
    | {
          type: "Cancel";
      }
    | {
          type: "Uncancel";
      }
    | MatrixActions;
