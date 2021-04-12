import * as Editor from "@math-blocks/editor-core";
import {Mistake} from "@math-blocks/grader";

// TODO: add an 'Error' status
export enum StepStatus {
    Correct,
    Incorrect,
    Duplicate,
    Pending,
}

export type Step =
    | {
          status: StepStatus.Correct;
          value: Editor.Zipper;
          hint: "none" | "text" | "showme";
      }
    | {
          status: StepStatus.Duplicate;
          value: Editor.Zipper;
      }
    | {
          status: StepStatus.Pending;
          value: Editor.Zipper;
      }
    | {
          status: StepStatus.Incorrect;
          value: Editor.Zipper;
          mistakes: readonly Mistake[];
      };

export enum ProblemStatus {
    Incomplete,
    Complete,
}

export type State = {
    steps: readonly Step[];
    status: ProblemStatus;
};

export type Action =
    | {
          type: "right";
          hint: "none" | "text" | "showme";
      }
    | {
          type: "wrong";
          mistakes: readonly Mistake[];
      }
    | {
          type: "duplicate";
      }
    | {
          type: "update";
          value: Editor.Zipper;
      }
    | {
          type: "set";
          steps: readonly Step[];
      }
    | {
          type: "complete";
      };

const initialState: State = {
    steps: [],
    status: ProblemStatus.Incomplete,
};

// TODO: curry this reducer
export const reducer = (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case "right": {
            return {
                ...state,
                steps: [
                    ...state.steps.slice(0, -1),
                    {
                        ...state.steps[state.steps.length - 1],
                        status: StepStatus.Correct,
                        hint: action.hint,
                    },
                ],
            };
        }
        case "wrong": {
            return {
                ...state,
                steps: [
                    ...state.steps.slice(0, -1),
                    {
                        ...state.steps[state.steps.length - 1],
                        status: StepStatus.Incorrect,
                        mistakes: action.mistakes,
                    },
                ],
            };
        }
        case "duplicate": {
            return {
                ...state,
                steps: [
                    ...state.steps,
                    {
                        ...state.steps[state.steps.length - 1],
                        status: StepStatus.Duplicate,
                    },
                ],
            };
        }
        case "update": {
            console.log(action);
            return {
                ...state,
                steps: [
                    ...state.steps.slice(0, -1),
                    {
                        ...state.steps[state.steps.length - 1],
                        status: StepStatus.Pending,
                        value: action.value,
                    },
                ],
            };
        }
        case "set": {
            return {
                ...state,
                steps: action.steps,
            };
        }
        case "complete": {
            return {
                ...state,
                status: ProblemStatus.Complete,
            };
        }
        // Handle internal redux actions like init
        default:
            return state;
    }
};
