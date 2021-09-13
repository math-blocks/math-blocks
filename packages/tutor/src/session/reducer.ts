import * as Editor from "@math-blocks/editor";
import {Mistake} from "../grader/index";

// TODO: add an 'Error' status
export enum StepStatus {
    Correct,
    Incorrect,
    Duplicate,
    Pending,
}

export type Step =
    | {
          readonly status: StepStatus.Correct;
          readonly value: Editor.Zipper;
          readonly hint: "none" | "text" | "showme";
      }
    | {
          readonly status: StepStatus.Duplicate;
          readonly value: Editor.Zipper;
      }
    | {
          readonly status: StepStatus.Pending;
          readonly value: Editor.Zipper;
      }
    | {
          readonly status: StepStatus.Incorrect;
          readonly value: Editor.Zipper;
          readonly mistakes: readonly Mistake[];
      };

export enum ProblemStatus {
    Incomplete,
    Complete,
}

export type State = {
    readonly steps: readonly Step[];
    readonly status: ProblemStatus;
};

export type Action =
    | {
          readonly type: "right";
          readonly hint: "none" | "text" | "showme";
      }
    | {
          readonly type: "wrong";
          readonly mistakes: readonly Mistake[];
      }
    | {
          readonly type: "duplicate";
      }
    | {
          readonly type: "update";
          readonly value: Editor.Zipper;
      }
    | {
          readonly type: "new_step";
          readonly value: Editor.Zipper;
      }
    | {
          readonly type: "set";
          readonly steps: readonly Step[];
      }
    | {
          readonly type: "set_pending";
      }
    | {
          readonly type: "complete";
      };

const initialState: State = {
    steps: [],
    status: ProblemStatus.Incomplete,
};

// TODO: curry this reducer
export const reducer = (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case "right": {
            const {value} = state.steps[state.steps.length - 1];
            return {
                ...state,
                steps: [
                    ...state.steps.slice(0, -1),
                    {
                        value,
                        status: StepStatus.Correct,
                        hint: action.hint,
                    },
                ],
            };
        }
        case "wrong": {
            const {value} = state.steps[state.steps.length - 1];
            return {
                ...state,
                steps: [
                    ...state.steps.slice(0, -1),
                    {
                        value,
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
                        // TODO: make this a deep copy
                        ...state.steps[state.steps.length - 1],
                        status: StepStatus.Duplicate,
                    },
                ],
            };
        }
        case "new_step": {
            return {
                ...state,
                steps: [
                    ...state.steps,
                    {
                        status: StepStatus.Pending,
                        value: action.value,
                    },
                ],
            };
        }
        case "update": {
            return {
                ...state,
                steps: [
                    ...state.steps.slice(0, -1),
                    {
                        ...state.steps[state.steps.length - 1],
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
        case "set_pending": {
            const {value} = state.steps[state.steps.length - 1];
            return {
                ...state,
                steps: [
                    ...state.steps.slice(0, -1),
                    {
                        value,
                        status: StepStatus.Pending,
                    },
                ],
            };
        }
        case "complete": {
            return {
                ...state,
                status: ProblemStatus.Complete,
            };
        }
        default:
            return state;
    }
};
