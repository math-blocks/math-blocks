import {createStore} from "redux";

import * as Editor from "@math-blocks/editor-core";

import {reducer, State, StepStatus, ProblemStatus} from "./reducer";

const clone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

const question: Editor.types.Row = Editor.util.row("2x+5=10");
const zipper: Editor.Zipper = {
    breadcrumbs: [],
    row: {
        id: question.id,
        type: "zrow",
        left: [],
        selection: null,
        right: question.children,
    },
};

const initialState: State = {
    steps: [
        {
            status: StepStatus.Correct,
            value: zipper,
            hint: "none",
        },
        {
            status: StepStatus.Duplicate,
            value: clone(zipper),
        },
    ],
    status: ProblemStatus.Incomplete,
};

export const store = createStore(reducer, initialState);

export type Dispatch = typeof store.dispatch;
