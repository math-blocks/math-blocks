import * as Editor from "@math-blocks/editor";
import {Mistake} from "@math-blocks/step-checker";

type ID = {
    id: number;
};

type EditorNode = Editor.Row;

export enum StepState {
    Correct,
    Incorrect,
    Duplicate,
    Pending,
}

export type StepType =
    | {
          state: StepState.Correct;
          value: EditorNode;
      }
    | {
          state: StepState.Duplicate;
          value: EditorNode;
      }
    | {
          state: StepState.Pending;
          value: EditorNode;
      }
    | {
          state: StepState.Incorrect;
          value: EditorNode;
          mistakes: Mistake[];
      };
