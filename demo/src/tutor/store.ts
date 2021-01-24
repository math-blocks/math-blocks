import {createStore} from "redux";

import * as Editor from "@math-blocks/editor-core";

import {reducer, State, StepStatus, ProblemStatus} from "./reducer";

const question: Editor.types.Row = Editor.util.row("2x+5=10");

const initialState: State = {
    steps: [
        {
            status: StepStatus.Correct,
            value: question,
            hint: "none",
        },
        {
            status: StepStatus.Duplicate,
            value: JSON.parse(JSON.stringify(question)),
        },
    ],
    status: ProblemStatus.Incomplete,
};

export const store = createStore(reducer, initialState);

export type Dispatch = typeof store.dispatch;
