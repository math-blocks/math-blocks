import * as Editor from "@math-blocks/editor";
import {Mistake} from "@math-blocks/grader";

export enum StepStatus {
    Correct,
    Incorrect,
    Duplicate,
    Pending,
}

export type Step =
    | {
          status: StepStatus.Correct;
          value: Editor.Row;
      }
    | {
          status: StepStatus.Duplicate;
          value: Editor.Row;
      }
    | {
          status: StepStatus.Pending;
          value: Editor.Row;
      }
    | {
          status: StepStatus.Incorrect;
          value: Editor.Row;
          mistakes: Mistake[];
      };

export enum ProblemStatus {
    Incomplete,
    Complete,
}

export type State = {
    steps: Step[];
    status: ProblemStatus;
};

export type Action =
    | {
          type: "right";
      }
    | {
          type: "wrong";
          mistakes: Mistake[];
      }
    | {
          type: "duplicate";
      }
    | {
          type: "update";
          value: Editor.Row;
      }
    | {
          type: "set";
          steps: Step[];
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
