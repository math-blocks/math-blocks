import {createStore} from "redux";

import * as Editor from "@math-blocks/editor";
import {reducer, State, StepStatus, ProblemStatus} from "@math-blocks/tutor";

const clone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

// TODO: move everything in this file to the `tutor` package and create a
// function that takes a zipper and returns a new store

const question: Editor.types.CharRow = Editor.util.row("2x+5=10");
const zipper = Editor.rowToZipper(question, []);

if (!zipper) {
    throw new Error("Can't create a zipper from the given question");
}

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
